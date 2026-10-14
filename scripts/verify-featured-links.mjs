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

if (featuredLinks.length === 0) {
  failures.push("No featured slider links were found on the generated homepage.");
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
  `[featured-links] PASS: ${featuredLinks.length} homepage slider links resolve to generated pages.`
);
