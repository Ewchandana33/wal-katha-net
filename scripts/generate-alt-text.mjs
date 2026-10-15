#!/usr/bin/env node
import { appendFile, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { coverAltForTitle, isAcceptableCoverAlt, readFrontmatterScalar } from "./alt-text-policy.mjs";
const postsDir = path.join(process.cwd(), "src", "content", "posts");
const changelogPath = path.join(process.cwd(), "AI_CHANGELOG.md");
const frontmatterPattern = /^---\r?\n([\s\S]*?)\r?\n---/;
function setFrontmatterScalar(frontmatter, field, value) {
  const linePattern = new RegExp("^" + field + "\\s*:.*$", "m");
  const line = field + ": " + JSON.stringify(value);
  if (linePattern.test(frontmatter)) return frontmatter.replace(linePattern, line);
  const imageLine = /^image\s*:.*$/m;
  if (imageLine.test(frontmatter)) return frontmatter.replace(imageLine, (existing) => existing + "\n" + line);
  return frontmatter.replace(/\s*$/, "") + "\n" + line;
}
function replaceFrontmatter(content, frontmatter) {
  const match = content.match(frontmatterPattern);
  if (!match) return content;
  const eol = match[0].includes("\r\n") ? "\r\n" : "\n";
  const block = "---" + eol + frontmatter.replace(/\r?\n/g, eol) + eol + "---";
  return content.slice(0, match.index) + block + content.slice(match.index + match[0].length);
}
async function main() {
  const files = await listPostFiles(postsDir);
  const updated = [];
  let covers = 0;
  for (const name of files.sort()) {
    const file = path.join(postsDir, name);
    const original = await readFile(file, "utf8");
    const match = original.match(frontmatterPattern);
    if (!match) continue;
    const frontmatter = match[1];
    if (!readFrontmatterScalar(frontmatter, "image")) continue;
    covers++;
    const title = readFrontmatterScalar(frontmatter, "title");
    const existingAlt = readFrontmatterScalar(frontmatter, "image_alt");
    if (isAcceptableCoverAlt(existingAlt, title)) continue;
    const nextAlt = coverAltForTitle(title);
    const nextFrontmatter = setFrontmatterScalar(frontmatter, "image_alt", nextAlt);
    const nextContent = replaceFrontmatter(original, nextFrontmatter);
    if (nextContent !== original) {
      await writeFile(file, nextContent, "utf8");
      updated.push(name.replace(/\.mdx?$/i, ""));
    }
  }
  if (covers === 0) throw new Error("No post cover images were found; refusing a silent no-op.");
  if (updated.length) {
    const date = new Date().toISOString().slice(0, 10);
    const entry = ["", "", "## " + date + " — Automated deterministic cover-alt repair", "", "- Repaired " + updated.length + " cover alt value(s): " + updated.join(", ") + ".", "- Used neutral title-derived labels; age-sensitive or explicit titles receive a generic fallback. No image model, API key, GSC query, or keyword seed is used.", "- The workflow validates all cover labels, opens or updates a PR, dispatches required CI on the PR head, and leaves the PR in draft for review; production merge requires explicit approval.", ""].join("\n");
    await appendFile(changelogPath, entry, "utf8");
  }
  const report = ["## Deterministic cover alt text", "", "Verified covers: **" + covers + "** | Updated: **" + updated.length + "**", "", updated.length ? "Updated posts: " + updated.join(", ") : "All existing cover alt values already pass the policy.", "", "Labels are neutral and deterministic. Sensitive titles use the generic fallback; no visual details are inferred."].join("\n") + "\n";
  await writeFile("/tmp/alt-text-report.md", report, "utf8");
  console.log("Covers checked: " + covers + " | Updated: " + updated.length);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, report, "utf8");
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, "changed=" + (updated.length ? "true" : "false") + "\n", "utf8");
}
main().catch((error) => { console.error("FATAL: " + (error.stack || error)); process.exitCode = 1; });
