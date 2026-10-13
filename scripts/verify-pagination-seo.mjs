import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const pagePath = resolve(process.cwd(), "dist/page/2/index.html");
const html = readFileSync(pagePath, "utf8");
const headings = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
assert.equal(headings.length, 1, `Expected one H1 on page 2; found ${headings.length}`);
assert.match(headings[0][1], /පිටුව\s*2/, "Page 2 H1 should identify its page number");

const linkTags = html.match(/<link\b[^>]*>/gi) || [];
const canonicalTag = linkTags.find((tag) => /\brel=["']canonical["']/i.test(tag));
const canonicalHref = canonicalTag?.match(/\bhref=["']([^"']+)["']/i)?.[1];
assert.equal(canonicalHref, "https://www.walakatha.net/page/2/", "Page 2 should self-canonicalize");

const metaTags = html.match(/<meta\b[^>]*>/gi) || [];
const robotsTag = metaTags.find((tag) => /\bname=["']robots["']/i.test(tag));
assert.ok(robotsTag, "Page 2 should emit a robots directive");
assert.doesNotMatch(robotsTag, /\bnoindex\b/i, "Page 2 should remain indexable");
console.log("[pagination-seo] Page 2 has one numbered H1, a self-canonical, and no noindex directive.");
