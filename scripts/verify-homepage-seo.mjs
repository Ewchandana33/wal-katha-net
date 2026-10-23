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
const headingText = decodeHtml(
  headings[0][1]
    .replace(/<span\b[^>]*class="home-title__badge"[^>]*>[\s\S]*?<\/span>/i, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim(),
);
assert.equal(
  headingText,
  expectedH1,
  "Homepage H1 should match the Sinhala-first page topic",
);
assert.equal(attribute(headings[0][0], "aria-label"), expectedH1, "Heading accessibility label should preserve the exact Sinhala title");
assert.match(
  headings[0][1],
  /<span\b[^>]*class="home-title__text"[^>]*>/i,
  "Homepage H1 should retain real, visible text",
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
const titleRegion = html.match(/<div class="home-title-stage[^"]*"[^>]*>([\s\S]*?)<\/div>/i)?.[1];
assert.ok(titleRegion, "Homepage should render the title region");
assert.match(titleRegion, /class="home-title__text"/i, "Homepage H1 should remain visible Sinhala text");
assert.match(titleRegion, /class="home-title__gold"/i, "First Sinhala title phrase should be gold");
assert.match(titleRegion, /class="home-title__ivory"/i, "Second Sinhala title phrase should be ivory");
assert.match(titleRegion, /<span\b[^>]*class="home-title__badge"[^>]*aria-hidden="true"[^>]*>18\+<\/span>/i, "Reference age badge should remain visible and decorative");
assert.ok(titleRegion.indexOf("home-title__gold") < titleRegion.indexOf("home-title__ivory"), "Gold phrase should precede the ivory phrase");
assert.doesNotMatch(html, /class="home-title-stage[^"]*\bmb-2\b/i, "The title stage should not leave a bottom margin gap");
assert.doesNotMatch(titleRegion, /home-title__figure|<(?:img|svg|picture|canvas)\b|WAL KATHA/i, "Homepage title should contain no decorative figure, image, vector, or subtitle");

const titleStyleStart = titleStyles.indexOf(".home-title-stage {");
const mobileTitleStyles = titleStyles.indexOf("@media (max-width: 480px)", titleStyleStart);
assert.ok(titleStyleStart >= 0, "Homepage title styles should exist");
assert.ok(mobileTitleStyles > titleStyleStart, "Homepage mobile title styles should follow desktop rules");
const homeTitleStyles = titleStyles.slice(titleStyleStart, mobileTitleStyles);
const mobileTitleBlock = titleStyles.slice(mobileTitleStyles);
assert.match(homeTitleStyles, /\.home-title-stage\s*\{[^}]*display:\s*flex/s, "Homepage title should use a clean single-column layout");
assert.match(homeTitleStyles, /\.home-title-stage\s*\{[^}]*justify-content:\s*center/s, "Homepage title should be centered");
assert.match(homeTitleStyles, /\.home-title-stage\s*\{[^}]*background:\s*transparent/s, "Homepage title region should have no card background");
assert.match(homeTitleStyles, /\.home-title-stage\s*\{[^}]*border:\s*0/s, "Homepage title region should have no border");
assert.match(homeTitleStyles, /\.home-title-stage\s*\{[^}]*box-shadow:\s*none/s, "Homepage title region should have no card shadow");
assert.match(homeTitleStyles, /\.home-title__gold\s*\{[^}]*color:\s*#ffd45a/i, "Gold title phrase should retain a readable fallback color");
assert.match(homeTitleStyles, /\.home-title__gold\s*\{[^}]*background-image:\s*linear-gradient/i, "Gold title phrase should use a metallic gradient");
assert.match(homeTitleStyles, /\.home-title__ivory\s*\{[^}]*color:\s*#fffdf7/i, "Ivory title phrase should retain a readable fallback color");
assert.match(homeTitleStyles, /\.home-title__ivory\s*\{[^}]*background-image:\s*linear-gradient/i, "Ivory title phrase should use a subtle silver gradient");
assert.match(homeTitleStyles, /\.home-title__badge\s*\{[^}]*border:\s*2px solid #ff2347/i, "18+ badge should use a compact red neon outline");
assert.match(homeTitleStyles, /\.home-title__gold\s*\{[^}]*filter:\s*drop-shadow\(/s, "Gold title should render layered depth and glow");
assert.match(homeTitleStyles, /\.home-title__text\s*\{[^}]*font-size:\s*clamp\(/s, "Sinhala title size should scale responsively");
assert.match(homeTitleStyles, /\.home-title__text::after\s*\{[^}]*background:\s*linear-gradient\([^;]*#ff2947[^;]*#ffd95e/s, "The title should have a fine red underline with a centered gold highlight");
assert.doesNotMatch(titleStyles, /home-title__figure|clip-path:/i, "No CSS silhouette or graphic should remain in the title styles");
assert.match(homeTitleStyles, /\.home-title-stage\s*\{[^}]*padding:\s*clamp\(/s, "Desktop title stage should use compact spacing");
assert.match(mobileTitleBlock, /\.home-title-stage\s*\{[^}]*padding:\s*0\.65rem 0\.35rem 1\.1rem/s, "Mobile title spacing should remain compact");
assert.match(mobileTitleBlock, /\.home-title__text\s*\{[^}]*font-size:\s*clamp\(/s, "Mobile Sinhala title should use responsive type size");
assert.match(titleStyles, /@media\s*\(max-width:\s*480px\)/, "Homepage title should adapt on narrow mobile screens");

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
  "[homepage-seo] Centered gold-and-ivory Sinhala title, outlined 18+ badge, red-gold underline, locale metadata, and description verified.",
);
