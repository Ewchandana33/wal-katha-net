import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const html = readFileSync(resolve(process.cwd(), "dist/index.html"), "utf8");
const expectedTitle = "සිංහල වැල් කතා කියවන්න | Wal Katha";
const expectedDescription = "සිංහල වැල් කතා කියවීමට Wal Katha එකතුව බලන්න. කාණ්ඩ අනුව පිරික්සා හෝ සෙවුමෙන් ඔබ කැමති කතාව තෝරාගෙන නොමිලේ කියවන්න. ඔබට ගැළපෙන කතාව මෙතැනින් සොයාගන්න.";
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
assert.equal(
  headingText,
  expectedH1,
  "Homepage H1 should match the Sinhala-first page topic",
);
assert.match(
  headings[0][1],
  /<span\b[^>]*class="home-title__text"[^>]*>/i,
  "Homepage H1 should retain real, visible text",
);
const titleOrnament = headings[0][1].match(
  /<svg\b[^>]*class="home-title__ornament"[^>]*>/i,
)?.[0];
assert.ok(
  titleOrnament,
  "Homepage H1 should include its inline SVG vine ornament",
);
assert.equal(
  attribute(titleOrnament, "aria-hidden"),
  "true",
  "Decorative title vines should be hidden from assistive technology",
);
assert.doesNotMatch(
  headings[0][1],
  /<img\b/i,
  "Homepage title styling should not depend on a picture or logo image",
);

const titleStyles = readFileSync(
  resolve(process.cwd(), "src/styles/index-overrides.css"),
  "utf8",
);
for (const color of ["#0a3818", "#1e5c2b", "#a2e088"]) {
  assert.ok(
    titleStyles.toLowerCase().includes(color),
    `Homepage title style should include ${color}`,
  );
}
assert.match(
  titleStyles,
  /\.home-title\s*\{[^}]*background:\s*transparent/s,
  "Homepage title area should have a transparent background",
);
assert.match(
  titleStyles,
  /\.home-title__text\s*\{[^}]*white-space:\s*nowrap/s,
  "Homepage title should stay on one line",
);
assert.match(
  titleStyles,
  /@media\s*\(max-width:\s*380px\)/,
  "Homepage title should adapt on narrow mobile screens",
);

const metaTags = html.match(/<meta\b[^>]*>/gi) || [];
const descriptions = metaTags.filter((tag) => /\bname=["']description["']/i.test(tag));
assert.equal(descriptions.length, 1, `Expected one homepage description; found ${descriptions.length}`);
const description = descriptions[0].match(/\bcontent=["']([^"']*)["']/i)?.[1];
assert.ok(description, "Homepage description should have content");
assert.equal(decodeHtml(description), expectedDescription, "Homepage description should match the Search Console-led, human-first snippet");



function attribute(tag, name) {
  for (const match of tag.matchAll(/(?:^|\s)([^\s=]+)\s*=\s*("[^"]*"|'[^']*')/g)) {
    if (match[1].toLowerCase() === name.toLowerCase()) return match[2].slice(1, -1);
  }
  return "";
}

const htmlTag = html.match(/<html\b[^>]*>/i)?.[0] ?? "";
assert.equal(attribute(htmlTag, "lang"), "si", "Homepage should declare Sinhala as its document language");
const linkTags = html.match(/<link\b[^>]*>/gi) || [];
const canonicalTag = linkTags.find((tag) => attribute(tag, "rel").toLowerCase() === "canonical");
assert.equal(attribute(canonicalTag || "", "href"), "https://www.walakatha.net/", "Homepage canonical should use the HTTPS www host");
const alternateTags = linkTags.filter((tag) => attribute(tag, "rel").toLowerCase() === "alternate");
for (const locale of ["si-LK", "x-default"]) {
  assert.ok(alternateTags.some((tag) => attribute(tag, "hreflang").toLowerCase() === locale.toLowerCase() && attribute(tag, "href") === "https://www.walakatha.net/"), "Homepage should expose " + locale + " hreflang to its canonical URL");
}
const localeMeta = (html.match(/<meta\b[^>]*>/gi) || []).find((tag) => attribute(tag, "property").toLowerCase() === "og:locale");
assert.equal(attribute(localeMeta || "", "content"), "si_LK", "Homepage Open Graph locale should target Sinhala in Sri Lanka");

console.log(
  "[homepage-seo] Sinhala-first title, one-line live-text H1, transparent styling, SVG vine ornament, locale metadata, and description verified.",
);
