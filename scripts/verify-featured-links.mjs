import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const distDirectory = path.resolve("dist");
const homePagePath = path.join(distDirectory, "index.html");
const standaloneFeatureRoute = "/online-wal-katha-audio-pdf/";
const standaloneFeatureDesktopImage = "/images/slider/online-wal-katha-audio-pdf.webp";
const standaloneFeatureMobileImage = "/images/slider/online-wal-katha-audio-pdf-mobile.webp";

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

const featuredLinkElements = [...homePage.matchAll(/<a\b[^>]*>/gi)]
  .filter((match) => hasClass(match[0], "slide-link"))
  .map((match) => {
    const closingTag = homePage.indexOf("</a>", match.index);
    return closingTag < 0 ? match[0] : homePage.slice(match.index, closingTag + 4);
  });

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

  const isStandaloneFeature = target.pathname === standaloneFeatureRoute;
  if (isStandaloneFeature && index !== 0) {
    failures.push("The standalone online/audio/PDF page must be the first slider slide.");
  } else if (!isStandaloneFeature && (!target.pathname.startsWith("/blog/") || !target.pathname.endsWith("/"))) {
    failures.push(`Slider link ${index + 1} is not a canonical blog or approved standalone route: ${href}`);
    continue;
  }

  const routePath = decodeURIComponent(target.pathname).replace(/^\/+/, "");
  const generatedPage = path.resolve(distDirectory, routePath, "index.html");
  if (!generatedPage.startsWith(`${distDirectory}${path.sep}`) || !existsSync(generatedPage)) {
    failures.push(`Slider link ${index + 1} has no generated page: ${href}`);
  }
}

const standaloneIndexes = featuredLinks.flatMap((anchor, index) => {
  const href = anchor.match(/\bhref="([^"]+)"/i)?.[1];
  if (!href) return [];
  try {
    return new URL(href, "https://www.walakatha.net").pathname === standaloneFeatureRoute ? [index] : [];
  } catch {
    return [];
  }
});
if (standaloneIndexes.length !== 1 || standaloneIndexes[0] !== 0) {
  failures.push("Exactly one standalone feature link must appear as the first slider slide.");
}

const h1Position = homePage.indexOf('id="speakable-home-heading"');
const sliderPosition = homePage.indexOf('id="astro-featured-slider"');
if (h1Position < 0 || sliderPosition < 0 || h1Position > sliderPosition) {
  failures.push("The homepage slider must render below the Sinhala title.");
}

const firstSlide = featuredLinkElements[0] ?? "";
const firstImageSrc = firstSlide.match(/<img\b[^>]*\bsrc="([^"]+)"/i)?.[1];
const firstImagePath = firstImageSrc ? new URL(firstImageSrc, "https://www.walakatha.net").pathname : "";
if (firstImagePath !== standaloneFeatureDesktopImage) {
  failures.push("The first slider image must use the dedicated homepage banner desktop asset.");
}
const mobileImageSrc = firstSlide.match(/<source\b[^>]*\bsrcset="([^"]+)"/i)?.[1];
const mobileImagePath = mobileImageSrc ? new URL(mobileImageSrc, "https://www.walakatha.net").pathname : "";
if (mobileImagePath !== standaloneFeatureMobileImage) {
  failures.push("The first slide must use the dedicated homepage banner mobile asset.");
}
if (!existsSync(path.resolve(distDirectory, "images/slider/online-wal-katha-audio-pdf.webp"))) {
  failures.push("The first slide's desktop banner asset is missing from the build output.");
}
if (!existsSync(path.resolve(distDirectory, "images/slider/online-wal-katha-audio-pdf-mobile.webp"))) {
  failures.push("The first slide's mobile banner asset is missing from the build output.");
}

if (failures.length > 0) {
  console.error("[featured-links] FAIL: homepage slider targets must resolve to generated pages.");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `[featured-links] PASS: ${featuredLinks.length} slider links (one standalone feature page and ${featuredLinks.length - 1} story pages) resolve to generated pages; the feature banner is first and panels, dots, and widths align.`
);
