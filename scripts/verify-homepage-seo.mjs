import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const html = readFileSync(resolve(process.cwd(), "dist/index.html"), "utf8");
const expectedTitle = "සිංහල වැල් කතා කියවන්න | Wal Katha";
const expectedDescription = "සිංහල වැල් කතා කියවීමට Wal Katha එකතුව බලන්න. කාණ්ඩ අනුව පිරික්සා හෝ සෙවුමෙන් ඔබ කැමති කතාව තෝරාගෙන නොමිලේ කියවන්න. ඔබට ගැළපෙන කතාව මෙතැනින් සොයාගන්න.";
const expectedH1 = "සිංහල වැල් කතා සහ වැල් කතා";

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
const imageStart = headings[0][1].indexOf("<img");
const imageEnd = headings[0][1].indexOf(">", imageStart);
const headingImage = imageStart >= 0 && imageEnd >= imageStart ? headings[0][1].slice(imageStart, imageEnd + 1) : "";
const headingText = decodeHtml(attribute(headingImage, "alt")).trim();
assert.equal(
  headingText,
  expectedH1,
  "Homepage H1 should match the Sinhala-first page topic",
);
assert.equal(attribute(headings[0][0], "aria-label"), expectedH1, "Heading accessibility label should preserve the exact Sinhala title");
assert.ok(headingImage, "Homepage H1 should contain the reference artwork");
assert.equal(attribute(headingImage, "class"), "home-title__image", "H1 artwork should use its dedicated responsive selector");
assert.equal(attribute(headingImage, "src"), "/images/home-title-reference.webp", "Homepage title should load the supplied reference asset");
assert.equal(attribute(headingImage, "width"), "2048", "Reference artwork should declare its intrinsic width");
assert.equal(attribute(headingImage, "height"), "280", "Reference artwork should declare its intrinsic height");
const titleStyles = readFileSync(
  resolve(process.cwd(), "src/styles/index-overrides.css"),
  "utf8",
);
const titleRegion = html.match(/<div class="home-title-stage[^"]*"[^>]*>([\s\S]*?)<\/div>/i)?.[1];
assert.ok(titleRegion, "Homepage should render the title region");
assert.ok(titleRegion.includes("class=\"home-title__image\""), "Title region should render the supplied reference image");
assert.ok(!titleRegion.includes("home-title__gold") && !titleRegion.includes("home-title__ivory"), "Approximate CSS text layers should not remain alongside the exact image");
assert.ok(!html.includes("class=\"home-title-stage mb-2\""), "The title stage should not leave an oversized bottom margin");

const titleStyleStart = titleStyles.indexOf("/* Pixel-accurate homepage title artwork from the supplied reference. */");
const mobileTitleStyles = titleStyles.indexOf("@media (max-width: 480px)", titleStyleStart);
assert.ok(titleStyleStart >= 0, "Homepage title styles should exist");
assert.ok(mobileTitleStyles > titleStyleStart, "Homepage mobile title styles should follow desktop rules");
const homeTitleStyles = titleStyles.slice(titleStyleStart, mobileTitleStyles);
const mobileTitleBlock = titleStyles.slice(mobileTitleStyles);
assert.ok(homeTitleStyles.includes(".home-title-stage {"), "Homepage title stage styles should exist");
assert.ok(homeTitleStyles.includes("background-color: #000;"), "Reference artwork should sit on its matching black background");
assert.ok(homeTitleStyles.includes(".home-title__image {"), "Title artwork should have a dedicated style block");
assert.ok(homeTitleStyles.includes("display: block;") && homeTitleStyles.includes("width: 100%;"), "Title artwork should scale as a responsive block image");
assert.ok(homeTitleStyles.includes("max-width: 64rem;") && homeTitleStyles.includes("height: auto;"), "Title artwork should retain its reference scale and aspect ratio");
assert.ok(mobileTitleBlock.includes("padding: 0.45rem 0.25rem 0.7rem;"), "Mobile title spacing should remain compact");
assert.ok(titleStyles.includes("@media (max-width: 480px)"), "Homepage title should adapt on narrow mobile screens");
assert.ok(!titleStyles.includes(".home-title__gold") && !titleStyles.includes(".home-title__ivory"), "Superseded CSS-only title styling should be removed");
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
  "[homepage-seo] Reference title artwork, accessible H1 text, responsive sizing, locale metadata, and description verified.",
);
