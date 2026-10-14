import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const origin = "https://www.walakatha.net";
const noindexPostIds = JSON.parse(readFileSync(resolve(process.cwd(), "src/config/noindex-post-ids.json"), "utf8"));
expect(Array.isArray(noindexPostIds), "noindex post configuration must be an array");
const agent = "Mozilla/5.0 (compatible; WalKathaTechnicalAudit/1.0; +https://www.walakatha.net/)";

function expect(condition, message) {
  if (!condition) throw new Error(message);
}

function attribute(tag, name) {
  for (const match of tag.matchAll(/(?:^|\s)([^\s=]+)\s*=\s*("[^"]*"|'[^']*')/g)) {
    if (match[1].toLowerCase() === name.toLowerCase()) return match[2].slice(1, -1);
  }
  return "";
}

function decodeXml(value) {
  return value.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, String.fromCharCode(34)).replace(/&apos;/g, "'");
}

function locations(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((match) => decodeXml(match[1].trim()));
}

async function fetchText(url, label, expectsXml = false) {
  const response = await fetch(url, {
    redirect: "follow",
    headers: { "user-agent": agent },
    signal: AbortSignal.timeout(20000),
  });
  const text = await response.text();
  expect(response.status === 200, label + " returned HTTP " + response.status + " at " + response.url);
  if (expectsXml) {
    expect(/xml/i.test(response.headers.get("content-type") || ""), label + " did not return an XML content type");
    expect(/<\?xml|<(sitemapindex|urlset)\b/i.test(text), label + " did not contain a sitemap document");
  }
  return { response, text };
}

function verifyHtml(html, expectedUrl, label) {
  const htmlTag = html.match(/<html\b[^>]*>/i)?.[0] ?? "";
  expect(attribute(htmlTag, "lang").toLowerCase() === "si", label + " must declare Sinhala as the document language");

  const links = html.match(/<link\b[^>]*>/gi) || [];
  const canonicalTag = links.find((tag) => attribute(tag, "rel").toLowerCase() === "canonical");
  expect(canonicalTag, label + " is missing a canonical link");
  expect(new URL(attribute(canonicalTag, "href"), expectedUrl).href === expectedUrl, label + " canonical does not match its sitemap URL");

  const alternateTags = links.filter((tag) => attribute(tag, "rel").toLowerCase() === "alternate");
  for (const locale of ["si-LK", "x-default"]) {
    const alternate = alternateTags.find((tag) => attribute(tag, "hreflang").toLowerCase() === locale.toLowerCase());
    expect(alternate, label + " is missing hreflang=" + locale);
    expect(new URL(attribute(alternate, "href"), expectedUrl).href === expectedUrl, label + " " + locale + " alternate does not match its canonical URL");
  }

  const metas = html.match(/<meta\b[^>]*>/gi) || [];
  const metaValue = (name, key = "name") => {
    const tag = metas.find((item) => attribute(item, key).toLowerCase() === name.toLowerCase());
    return tag ? attribute(tag, "content") : "";
  };
  expect(metaValue("description").trim().length >= 20, label + " is missing a useful meta description");
  expect(metaValue("og:locale", "property") === "si_LK", label + " must emit Open Graph locale si_LK");
  const robots = metaValue("robots").toLowerCase();
  expect(robots && /\bindex\b/.test(robots) && !/\bnoindex\b/.test(robots), label + " must be indexable");
}

const home = await fetchText(origin + "/", "Homepage");
verifyHtml(home.text, origin + "/", "Homepage");

const robots = await fetchText(origin + "/robots.txt", "robots.txt");
const robotLines = robots.text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
expect(robotLines.some((line) => /^User-agent:\s*\*$/i.test(line)), "robots.txt is missing the default user-agent group");
expect(robotLines.some((line) => /^Allow:\s*\/$/i.test(line)), "robots.txt must allow crawlable pages");
expect(robotLines.some((line) => /^Disallow:\s*\/api\/\*$/i.test(line)), "robots.txt must keep API routes out of crawl");
const declaredSitemaps = robotLines.filter((line) => /^Sitemap:/i.test(line)).map((line) => line.replace(/^Sitemap:\s*/i, ""));
for (const path of ["/sitemap-index.xml", "/news-sitemap.xml", "/image-sitemap.xml"]) {
  expect(declaredSitemaps.includes(origin + path), "robots.txt must declare " + path);
  await fetchText(origin + path, path, true);
}

const legacySitemap = await fetchText(origin + "/sitemap.xml", "legacy sitemap.xml", true);
expect(legacySitemap.response.url === origin + "/sitemap-index.xml", "/sitemap.xml must redirect to the sitemap index");
const index = await fetchText(origin + "/sitemap-index.xml", "sitemap index", true);
const queue = locations(index.text);
expect(queue.length > 0, "sitemap index must list at least one child sitemap");
const seenSitemaps = new Set();
const pageUrls = new Set();
while (queue.length) {
  const sitemapUrl = queue.shift();
  expect(new URL(sitemapUrl).origin === origin, "Sitemap URL points outside the canonical host: " + sitemapUrl);
  if (seenSitemaps.has(sitemapUrl)) continue;
  seenSitemaps.add(sitemapUrl);
  expect(seenSitemaps.size <= 100, "Sitemap index exceeds the 100-file safety limit");
  const child = await fetchText(sitemapUrl, "child sitemap", true);
  if (/<sitemapindex\b/i.test(child.text)) {
    queue.push(...locations(child.text));
  } else {
    const urlBlocks = [...child.text.matchAll(/<url\b[^>]*>([\s\S]*?)<\/url>/gi)];
    for (const block of urlBlocks) {
      const pageUrl = locations(block[1])[0];
      if (pageUrl) pageUrls.add(pageUrl);
    }
  }
}
expect(pageUrls.size > 0, "Sitemaps must include at least one page URL");

const pages = [...pageUrls];
const correctedPostUrl = new URL("/blog/akkai-nangi-wal-katha/", origin).href;
expect(pageUrls.has(correctedPostUrl), "Corrected article is missing from the XML sitemap");

const imageSitemap = await fetchText(origin + "/image-sitemap.xml", "image sitemap", true);
const imageUrls = new Set(locations(imageSitemap.text));
expect(imageUrls.has(correctedPostUrl), "Corrected article is missing from the image sitemap");

const rss = await fetchText(origin + "/rss.xml", "RSS feed");
expect(/xml/i.test(rss.response.headers.get("content-type") || ""), "RSS feed did not return an XML content type");
const rssUrls = new Set(
  [...rss.text.matchAll(/<link>\s*([^<]+?)\s*<\/link>/gi)].map((match) => decodeXml(match[1].trim()))
);
expect(rssUrls.has(correctedPostUrl), "Corrected article is missing from the RSS feed");

for (const postId of noindexPostIds) {
  const noindexUrl = new URL("/blog/" + postId + "/", origin).href;
  expect(!pageUrls.has(noindexUrl), "noindex article is present in the XML sitemap: " + noindexUrl);
  expect(!imageUrls.has(noindexUrl), "noindex article is present in the image sitemap: " + noindexUrl);
  expect(!rssUrls.has(noindexUrl), "noindex article is present in the RSS feed: " + noindexUrl);

  const response = await fetchText(noindexUrl, "noindex article " + noindexUrl);
  expect(response.response.url === noindexUrl, "noindex article redirected away from its canonical URL: " + noindexUrl);
  const metas = response.text.match(/<meta\b[^>]*>/gi) || [];
  const robotsTag = metas.find((tag) => attribute(tag, "name").toLowerCase() === "robots");
  const robotsContent = robotsTag ? attribute(robotsTag, "content").toLowerCase() : "";
  expect(/(^|[\s,])noindex([\s,]|$)/.test(robotsContent), "Configured noindex article is missing noindex: " + noindexUrl);
  expect(/(^|[\s,])follow([\s,]|$)/.test(robotsContent), "Configured noindex article should remain followable: " + noindexUrl);
  const links = response.text.match(/<link\b[^>]*>/gi) || [];
  const canonicalTag = links.find((tag) => attribute(tag, "rel").toLowerCase() === "canonical");
  expect(canonicalTag && new URL(attribute(canonicalTag, "href"), noindexUrl).href === noindexUrl, "Configured noindex article has a mismatched canonical: " + noindexUrl);
}

const failures = [];
let cursor = 0;
const workers = Array.from({ length: Math.min(5, pages.length) }, async () => {
  while (cursor < pages.length) {
    const current = pages[cursor++];
    try {
      expect(new URL(current).origin === origin, "Sitemap page is outside the canonical host: " + current);
      const page = await fetchText(current, "Sitemap page " + current);
      expect(page.response.url === current, "Sitemap page redirects away from its canonical URL: " + current);
      verifyHtml(page.text, current, current);
    } catch (error) {
      failures.push(current + ": " + (error instanceof Error ? error.message : String(error)));
    }
  }
});
await Promise.all(workers);
assert.equal(failures.length, 0, "Live sitemap pages failed SEO/locale checks:\n" + failures.slice(0, 25).join("\n"));
console.log("[live-seo-geo] PASS: homepage, " + seenSitemaps.size + " sitemap(s), " + pages.length + " indexable pages, corrected article discovery in XML/image/RSS, and " + noindexPostIds.length + " configured noindex article(s) excluded and tagged noindex,follow; canonical, si-LK hreflang, Sinhala language, and si_LK locale verified.");
