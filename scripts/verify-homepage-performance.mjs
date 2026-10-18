import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const dist = resolve(process.cwd(), "dist");
const homepage = readFileSync(resolve(dist, "index.html"), "utf8");
const readerToolsAsset = "/_astro/ReaderTools.astro";

function hasCommentsWarmup(html) {
  return html.split("<link").slice(1).some((part) => {
    const end = part.indexOf(">");
    if (end < 0) return false;
    const tag = part.slice(0, end).toLowerCase();
    return tag.includes("comments.wala-katha.workers.dev") &&
      (tag.includes('rel="preconnect"') || tag.includes("rel='preconnect'") ||
       tag.includes('rel="dns-prefetch"') || tag.includes("rel='dns-prefetch'"));
  });
}

function collectHtml(directory) {
  const found = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) found.push(...collectHtml(path));
    else if (entry.isFile() && entry.name.endsWith(".html")) found.push(path);
  }
  return found;
}

assert.ok(!homepage.includes("data-rt-root"), "Homepage must not render the article reader-tools panel");
assert.ok(!homepage.includes(readerToolsAsset), "Homepage must not download the article reader-tools JavaScript bundle");
assert.equal(hasCommentsWarmup(homepage), false, "Homepage must not preconnect to the article-only comments Worker");

const articlePages = collectHtml(resolve(dist, "blog")).map((path) => readFileSync(path, "utf8"));
assert.ok(articlePages.length > 0, "Build should generate article HTML pages");
assert.ok(articlePages.some((html) => html.includes("data-rt-root")), "Article pages must retain the reader-tools panel");
assert.ok(articlePages.some((html) => html.includes(readerToolsAsset)), "Article pages must retain the reader-tools JavaScript bundle");
assert.ok(articlePages.some(hasCommentsWarmup), "Article pages must retain comments Worker preconnect hints");

console.log("[homepage-performance] Reader tools and comments preconnect are excluded from the homepage and retained on article pages.");