import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const distDirectory = path.resolve("dist");
const homePagePath = path.join(distDirectory, "index.html");

if (!existsSync(homePagePath)) {
  console.error("[featured-links] FAIL: dist/index.html was not generated.");
  process.exit(1);
}

const homePage = readFileSync(homePagePath, "utf8");
const anchors = [...homePage.matchAll(/<a\b[^>]*>/gi)].map((match) => match[0]);
const featuredLinks = anchors.filter((anchor) => {
  const classAttribute = anchor.match(/\bclass="([^"]*)"/i)?.[1] ?? "";
  return classAttribute.split(/\s+/).includes("slide-link");
});
const failures = [];
const hasClass = (tag, className) => {
  const classAttribute = tag.match(/\bclass="([^"]*)"/i)?.[1] ?? "";
  return classAttribute.split(/\s+/).includes(className);
};

if (featuredLinks.length === 0) {
  failures.push("No featured slider links were found on the generated homepage.");
}

const wrapper = homePage.match(/<div\b[^>]*\bid="slider-wrapper"[^>]*>/i)?.[0];
const wrapperWidth = wrapper?.match(/\bstyle="[^"]*\bwidth:\s*([\d.]+)%/i)?.[1];
if (!wrapper || !wrapperWidth) {
  failures.push("The slider wrapper or its generated width is missing.");
} else if (Math.abs(Number(wrapperWidth) - featuredLinks.length * 100) > 0.01) {
  failures.push(
    `Slider wrapper width is ${wrapperWidth}%; expected ${featuredLinks.length * 100}% for ${featuredLinks.length} slides.`
  );
}

const slidePanels = [...homePage.matchAll(/<div\b[^>]*>/gi)]
  .map((match) => match[0])
  .filter((tag) => hasClass(tag, "flex-shrink-0"));
const expectedPanelWidth = featuredLinks.length > 0 ? 100 / featuredLinks.length : 0;
if (slidePanels.length !== featuredLinks.length) {
  failures.push(
    `Found ${slidePanels.length} slide panels but ${featuredLinks.length} slider links.`
  );
}
for (const [index, panel] of slidePanels.entries()) {
  const panelWidth = panel.match(/\bstyle="[^"]*\bwidth:\s*([\d.]+)%/i)?.[1];
  if (!panelWidth || Math.abs(Number(panelWidth) - expectedPanelWidth) > 0.01) {
    failures.push(
      `Slide panel ${index + 1} width is ${panelWidth ?? "missing"}%; expected ${expectedPanelWidth}%.`
    );
  }
}

const sliderDots = [...homePage.matchAll(/<button\b[^>]*>/gi)]
  .map((match) => match[0])
  .filter((tag) => hasClass(tag, "slider-dot"));
if (sliderDots.length !== featuredLinks.length) {
  failures.push(
    `Found ${sliderDots.length} slider navigation dots but ${featuredLinks.length} slider links.`
  );
}

for (const [index, anchor] of featuredLinks.entries()) {
  const href = anchor.match(/\bhref="([^"]+)"/i)?.[1];
  if (!href) {
    failures.push(`Slider link ${index + 1} has no href.`);
    continue;
  }

  let target;
  try {
    target = new URL(href, "https://www.walakatha.net");
  } catch {
    failures.push(`Slider link ${index + 1} has an invalid URL: ${href}`);
    continue;
  }

  if (target.origin !== "https://www.walakatha.net") {
    failures.push(`Slider link ${index + 1} is not a same-site URL: ${href}`);
    continue;
  }

  if (!target.pathname.startsWith("/blog/") || !target.pathname.endsWith("/")) {
    failures.push(`Slider link ${index + 1} is not a canonical blog route: ${href}`);
    continue;
  }

  const routePath = decodeURIComponent(target.pathname).replace(/^\/+/, "");
  const generatedPage = path.resolve(distDirectory, routePath, "index.html");
  if (!generatedPage.startsWith(`${distDirectory}${path.sep}`) || !existsSync(generatedPage)) {
    failures.push(`Slider link ${index + 1} has no generated page: ${href}`);
  }
}

if (failures.length > 0) {
  console.error("[featured-links] FAIL: homepage slider targets must resolve to generated pages.");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `[featured-links] PASS: ${featuredLinks.length} slider links resolve to generated pages; panels, dots, and widths align.`
);
