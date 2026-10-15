#!/usr/bin/env node
import { appendFile, readFile } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

export const SITE_URL = "https://www.walakatha.net/";
export const TARGET_QUERY = "වැල්";
export const RELEASE_AT = "2026-10-15T09:24:30Z";
export const BASELINE_WINDOW = Object.freeze({ startDate: "2026-09-15", endDate: "2026-10-12" });
export const DATA_LAG_DAYS = 3;
export const MIN_GLOBAL_IMPRESSIONS = 500;
export const MIN_SRI_LANKA_IMPRESSIONS = 100;
export const REPORT_MARKER = "<!-- gsc-ctr-followup:homepage-vel-2026-10 -->";
const ROOT = process.cwd();

export function addDays(dateText, days) {
  const parts = String(dateText).split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isInteger(n))) throw new Error("Invalid ISO date: " + dateText);
  const date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function getPostWindow(lastCrawlTime) {
  const crawlTime = Date.parse(lastCrawlTime || "");
  const releaseTime = Date.parse(RELEASE_AT);
  if (!Number.isFinite(crawlTime) || crawlTime < releaseTime) return null;
  const crawlDate = new Date(crawlTime).toISOString().slice(0, 10);
  const afterCrawl = addDays(crawlDate, 1);
  const recrawlGraceEnd = addDays(RELEASE_AT.slice(0, 10), 7);
  const startDate = afterCrawl > recrawlGraceEnd ? afterCrawl : recrawlGraceEnd;
  return { startDate, endDate: addDays(startDate, 27) };
}

export function aggregateRows(rows) {
  const result = { clicks: 0, impressions: 0, positionWeight: 0, ctr: null, position: null };
  for (const row of rows || []) {
    const clicks = Number(row.clicks) || 0;
    const impressions = Number(row.impressions) || 0;
    const position = Number(row.position);
    result.clicks += clicks;
    result.impressions += impressions;
    if (Number.isFinite(position) && impressions > 0) result.positionWeight += position * impressions;
  }
  if (result.impressions > 0) {
    result.ctr = result.clicks / result.impressions;
    result.position = result.positionWeight / result.impressions;
  }
  delete result.positionWeight;
  return result;
}

export function compareMetrics(baseline, post) {
  const deltaPp = baseline.ctr === null || post.ctr === null ? null : (post.ctr - baseline.ctr) * 100;
  const relativeChangePct = baseline.ctr === null || baseline.ctr === 0 || post.ctr === null
    ? null
    : ((post.ctr - baseline.ctr) / baseline.ctr) * 100;
  return { deltaPp, relativeChangePct };
}

export function hasEnoughGlobalImpressions(baseline, post) {
  return baseline.impressions >= MIN_GLOBAL_IMPRESSIONS && post.impressions >= MIN_GLOBAL_IMPRESSIONS;
}

function formatPct(value) {
  return value === null ? "—" : (value * 100).toFixed(2) + "%";
}
function formatNum(value, digits) {
  return value === null ? "—" : Number(value).toFixed(digits);
}
function metricsRow(label, windowLabel, metrics) {
  return "| " + label + " | " + windowLabel + " | " + metrics.clicks + " | " + metrics.impressions + " | " + formatPct(metrics.ctr) + " | " + formatNum(metrics.position, 1) + " |";
}
async function writeSummary(text) {
  const file = process.env.GITHUB_STEP_SUMMARY;
  if (file) await appendFile(file, text + "\n", "utf8");
  console.log(text);
}
async function setOutput(name, value) {
  const file = process.env.GITHUB_OUTPUT;
  if (file) await appendFile(file, name + "=" + value + "\n", "utf8");
}
function completeThroughDate() {
  return addDays(new Date().toISOString().slice(0, 10), -DATA_LAG_DAYS);
}
function gscClient() {
  const require = createRequire("/tmp/gsc-tool/package.json");
  const { google } = require("googleapis");
  const raw = process.env.GSC_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_INDEXING_KEY;
  if (!raw || !raw.trim()) throw new Error("Existing GSC service-account secret is missing.");
  let key;
  try { key = JSON.parse(raw); } catch { throw new Error("Existing GSC service-account secret is not valid JSON."); }
  if (!key.client_email || !key.private_key) throw new Error("GSC service-account JSON is missing required fields.");
  const auth = new google.auth.JWT(key.client_email, null, key.private_key, ["https://www.googleapis.com/auth/webmasters.readonly"], null);
  return { client: google.searchconsole({ version: "v1", auth }) };
}
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function retry(label, fn) {
  let last;
  for (let attempt = 0; attempt < 5; attempt++) {
    try { return await fn(); } catch (error) {
      last = error;
      const status = Number(error?.code || error?.response?.status) || null;
      if (status && status !== 429 && status < 500) {
        throw new Error(label + " failed (HTTP " + status + "): " + String(error.message || "request rejected"));
      }
      if (attempt === 4) break;
      await wait(1000 * (2 ** attempt));
    }
  }
  throw new Error(label + " failed after retries: " + String(last?.message || "unknown error"));
}
async function resolveProperty(client) {
  if (process.env.GSC_SITE_URL && process.env.GSC_SITE_URL.trim()) return process.env.GSC_SITE_URL.trim();
  const response = await retry("Search Console property list", () => client.sites.list());
  const entries = (response.data.siteEntry || []).filter((entry) => ["siteOwner", "siteFullUser", "siteRestrictedUser"].includes(entry.permissionLevel));
  if (!entries.length) throw new Error("The configured service account has no accessible Search Console property.");
  const domain = entries.find((entry) => entry.siteUrl === "sc-domain:walakatha.net");
  if (domain) return domain.siteUrl;
  const urlProperty = entries.find((entry) => entry.siteUrl.includes("walakatha.net"));
  if (urlProperty) return urlProperty.siteUrl;
  throw new Error("No accessible Search Console property matched walakatha.net.");
}
async function queryMetrics(client, property, window, country) {
  const filters = [
    { dimension: "page", operator: "equals", expression: SITE_URL },
    { dimension: "query", operator: "equals", expression: TARGET_QUERY },
  ];
  if (country) filters.push({ dimension: "country", operator: "equals", expression: country });
  const response = await retry("Search Analytics " + (country || "all countries") + " " + window.startDate + ".." + window.endDate, () =>
    client.searchanalytics.query({
      siteUrl: property,
      requestBody: {
        startDate: window.startDate,
        endDate: window.endDate,
        dimensions: ["date"],
        type: "web",
        dimensionFilterGroups: [{ groupType: "and", filters }],
        rowLimit: 25000,
        startRow: 0,
      },
    }),
  );
  return aggregateRows(response.data.rows || []);
}
function pendingText(reason, detail) {
  return [
    "## Post-recrawl homepage CTR comparison — pending",
    "- Target: exact Web query " + TARGET_QUERY + " on " + SITE_URL + ".",
    "- Status: " + reason,
    detail ? "- Detail: " + detail : "",
    "- The weekly workflow will recheck; no CTR or ranking improvement is claimed until the recrawl and comparable data are verified.",
  ].filter(Boolean).join("\n");
}
function buildReport(property, indexStatus, lastCrawlTime, postWindow, globalBase, globalPost, lkaBase, lkaPost) {
  const globalDelta = compareMetrics(globalBase, globalPost);
  const lkaDelta = compareMetrics(lkaBase, lkaPost);
  const lkaLowSample = lkaBase.impressions < MIN_SRI_LANKA_IMPRESSIONS || lkaPost.impressions < MIN_SRI_LANKA_IMPRESSIONS;
  return [
    "",
    "",
    "## " + new Date().toISOString().slice(0, 10) + " — Automated post-recrawl homepage CTR comparison",
    REPORT_MARKER,
    "",
    "- Property: " + property + "; page: " + SITE_URL + "; exact Web query: " + TARGET_QUERY + ".",
    "- Google URL Inspection confirmed verdict " + indexStatus.verdict + "; latest verified crawl: " + lastCrawlTime + ".",
    "- Baseline window: " + BASELINE_WINDOW.startDate + " to " + BASELINE_WINDOW.endDate + " (28 days before the snippet release). Post window: " + postWindow.startDate + " to " + postWindow.endDate + " (28 days, after a verified post-release crawl and at least seven days after deployment).",
    "- GSC data lag used: " + DATA_LAG_DAYS + " days. Both global periods met the minimum of " + MIN_GLOBAL_IMPRESSIONS + " impressions.",
    "",
    "| Geography | Window | Clicks | Impressions | CTR | Average position |",
    "| --- | --- | ---: | ---: | ---: | ---: |",
    metricsRow("All countries", "Baseline", globalBase),
    metricsRow("All countries", "Post", globalPost),
    metricsRow("Sri Lanka (LKA)", "Baseline", lkaBase),
    metricsRow("Sri Lanka (LKA)", "Post", lkaPost),
    "",
    "- All-country CTR change: " + (globalDelta.deltaPp === null ? "not available" : (globalDelta.deltaPp >= 0 ? "+" : "") + globalDelta.deltaPp.toFixed(2) + " percentage points") + (globalDelta.relativeChangePct === null ? "" : " (" + (globalDelta.relativeChangePct >= 0 ? "+" : "") + globalDelta.relativeChangePct.toFixed(1) + "% relative)") + ".",
    "- Sri Lanka CTR change: " + (lkaDelta.deltaPp === null ? "not available" : (lkaDelta.deltaPp >= 0 ? "+" : "") + lkaDelta.deltaPp.toFixed(2) + " percentage points") + (lkaDelta.relativeChangePct === null ? "" : " (" + (lkaDelta.relativeChangePct >= 0 ? "+" : "") + lkaDelta.relativeChangePct.toFixed(1) + "% relative)") + (lkaLowSample ? "; Sri Lanka sample is below " + MIN_SRI_LANKA_IMPRESSIONS + " impressions in at least one period, so treat that split as directional only." : "."),
    "- This is an observational before/after comparison, not proof the title change caused the difference and not a ranking guarantee. Seasonality, position changes, and other SERP factors can affect CTR.",
    "",
  ].join("\n");
}

export async function run() {
  const changelogPath = path.join(ROOT, "AI_CHANGELOG.md");
  const changelog = await readFile(changelogPath, "utf8");
  if (changelog.includes(REPORT_MARKER)) {
    const text = "## Post-recrawl homepage CTR comparison — already recorded\n- The result marker exists in AI_CHANGELOG.md; no repeat report or PR is needed.";
    await setOutput("ready", "false");
    await writeSummary(text);
    return { status: "already-recorded" };
  }
  const { client } = gscClient();
  const property = await resolveProperty(client);
  console.log("Reading GSC data for the configured property and homepage only; service-account credential values remain masked.");
  const inspection = await retry("Google URL Inspection", () => client.urlInspection.index.inspect({
    requestBody: { inspectionUrl: SITE_URL, siteUrl: property, languageCode: "si-LK" },
  }));
  const indexStatus = inspection.data.inspectionResult?.indexStatusResult || {};
  const lastCrawlTime = indexStatus.lastCrawlTime || null;
  const postWindow = getPostWindow(lastCrawlTime);
  if (!postWindow || indexStatus.verdict !== "PASS") {
    await setOutput("ready", "false");
    await writeSummary(pendingText("waiting for a post-release Google crawl and an indexed verdict.", "verdict=" + String(indexStatus.verdict || "unknown") + "; lastCrawlTime=" + String(lastCrawlTime || "unavailable")));
    return { status: "waiting-for-recrawl", verdict: indexStatus.verdict || null, lastCrawlTime };
  }
  const completeThrough = addDays(new Date().toISOString().slice(0, 10), -DATA_LAG_DAYS);
  if (completeThrough < postWindow.endDate) {
    await setOutput("ready", "false");
    await writeSummary(pendingText("the post-recrawl 28-day window is not yet complete in Search Console.", "confirmed crawl=" + lastCrawlTime + "; post window=" + postWindow.startDate + ".." + postWindow.endDate + "; complete data currently through=" + completeThrough));
    return { status: "waiting-for-data", lastCrawlTime, postWindow, completeThrough };
  }
  const [globalBase, globalPost, lkaBase, lkaPost] = await Promise.all([
    queryMetrics(client, property, BASELINE_WINDOW, null),
    queryMetrics(client, property, postWindow, null),
    queryMetrics(client, property, BASELINE_WINDOW, "lka"),
    queryMetrics(client, property, postWindow, "lka"),
  ]);
  if (!hasEnoughGlobalImpressions(globalBase, globalPost)) {
    const detail = "baseline=" + globalBase.impressions + "; post=" + globalPost.impressions + "; minimum=" + MIN_GLOBAL_IMPRESSIONS + "; period=" + postWindow.startDate + ".." + postWindow.endDate;
    await setOutput("ready", "false");
    await writeSummary(pendingText("waiting for at least " + MIN_GLOBAL_IMPRESSIONS + " global impressions in each 28-day window.", detail));
    return { status: "waiting-for-impressions", globalBase, globalPost, postWindow };
  }
  const report = buildReport(property, indexStatus, lastCrawlTime, postWindow, globalBase, globalPost, lkaBase, lkaPost);
  await appendFile(changelogPath, report, "utf8");
  await setOutput("ready", "true");
  await writeSummary(report.trim());
  return { status: "report-ready", postWindow, globalBase, globalPost, lkaBase, lkaPost };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch(async (error) => {
    const safeMessage = String(error?.message || error).replace(/\s+/g, " ").slice(0, 500);
    const text = "## Post-recrawl homepage CTR comparison — failed\n- " + safeMessage + "\n- No changelog or application files were changed by this failed run.";
    try { await writeSummary(text); } catch {}
    console.error("CTR follow-up failed: " + safeMessage);
    process.exitCode = 1;
  });
}
