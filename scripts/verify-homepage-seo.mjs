import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const html = readFileSync(resolve(process.cwd(), "dist/index.html"), "utf8");
const expectedTitle = "සිංහල වල් කතා සහ වැල් කතා | Wal Katha";
const expectedH1 = "සිංහල වල් කතා සහ වැල් කතා";

const decodeHtml = (value) =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1];
assert.ok(title, "Homepage should have a title element");
assert.equal(decodeHtml(title.trim()), expectedTitle, "Homepage title should lead with the Sinhala query wording");

const headings = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)];
assert.equal(headings.length, 1, `Expected one homepage H1; found ${headings.length}`);
const headingText = decodeHtml(headings[0][1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
assert.equal(headingText, expectedH1, "Homepage H1 should match the Sinhala-first page topic");

const metaTags = html.match(/<meta\b[^>]*>/gi) || [];
const descriptions = metaTags.filter((tag) => /\bname=["']description["']/i.test(tag));
assert.equal(descriptions.length, 1, `Expected one homepage description; found ${descriptions.length}`);
const description = descriptions[0].match(/\bcontent=["']([^"']*)["']/i)?.[1];
assert.ok(description, "Homepage description should have content");
assert.match(decodeHtml(description), /සිංහල වැල් කතා/, "Description should include the evidenced Sinhala වැල් query wording");

console.log("[homepage-seo] Sinhala-first title and H1, one H1, and the Search Console-aligned description verified.");
