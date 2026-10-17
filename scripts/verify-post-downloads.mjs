import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const root = process.cwd();
const WATERMARK = "https://www.walakatha.net";
const CENTER_WATERMARK_FONT_SIZE = 22;
const FOOTER_WATERMARK_FONT_SIZE = 8;
const PAGE_MARGIN = 46;
const AUTHOR_NOTICE_MARKERS = [
  { label: "author-rights notice label", markers: ["විෙශ්ෂසටහන", "විශේෂසටහන"] },
  { label: "complete-work rights", markers: ["සම්පූර්ණඅයිතිය"] },
  { label: "author royalties", markers: ["කර්තෘභාගය"] },
  { label: "original author attribution", markers: ["මුල්රචකයාටහිමි", "මුල්රචකයා"] },
];
const AUTHOR_NOTICE_COUNT_MARKER = "සම්පූර්ණඅයිතිය";

const RIGHTS_PAGE_MARKERS = [
  { label: "private-use heading", markers: ["ද්ගලිකභාවිතය"] },
  { label: "private reading only", markers: ["ෙපෟද්ගලිකකියවීම"] },
  { label: "commercial-use prohibition", markers: ["වාණිජඅරමුණු"] },
  { label: "ownership heading", markers: ["හිමිකම"] },
  { label: "ownership of content", markers: ["අන්තර්ගතෙය්හිමිකම්"] },
  { label: "no rights transfer", markers: ["කිසිදුහිමිකමක්ඔබට"] },
  { label: "prohibited-actions heading", markers: ["තහනම්කරනකි්රයා"] },
  { label: "prior written permission", markers: ["පූර්වලිඛිතඅවසරයකින්"] },
  { label: "copying prohibition", markers: ["පිටපත්කිරීම"] },
  { label: "editing prohibition", markers: ["වෙනස්කිරීම", "සංස්කරණයකිරීම"] },
  { label: "republication prohibition", markers: ["පළකිරීම"] },
  { label: "public-sharing prohibition", markers: ["ප්රකාශකිරීම", "ප්‍රකාශකිරීම"] },
  { label: "distribution prohibition", markers: ["ෙබදාහැරීම", "ෙබදාහුරීම"] },
  { label: "commercial-sale prohibition", markers: ["විකිණීම", "වාණිජලාභයක්"] },
  { label: "attribution and watermark protections", markers: ["attribution", "watermark"] },
  { label: "legal-action warning", markers: ["නීතිමය"] },
  { label: "reader acknowledgment", markers: ["කියවාතේරුම්ගෙන", "එකඟවනබව"] },
];
const dist = resolve(root, "dist");
const blogDir = join(dist, "blog");
const downloadsDir = join(dist, "downloads");
if (!existsSync(blogDir)) throw new Error("[post-downloads] Built blog directory is missing.");
if (!existsSync(downloadsDir)) throw new Error("[post-downloads] No article download directory was generated.");

const articleSlugs = readdirSync(blogDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(join(blogDir, entry.name, "index.html")))
  .map((entry) => entry.name)
  .sort();
const downloadSlugs = readdirSync(downloadsDir)
  .filter((name) => name.endsWith(".pdf"))
  .map((name) => name.slice(0, -4))
  .sort();
if (articleSlugs.length === 0) throw new Error("[post-downloads] No built article routes were found.");
if (JSON.stringify(articleSlugs) !== JSON.stringify(downloadSlugs)) {
  throw new Error(`[post-downloads] Article/PDF mismatch. Articles: ${articleSlugs.length}; PDFs: ${downloadSlugs.length}.`);
}

const config = JSON.parse(readFileSync(join(root, "src/config/config.json"), "utf8"));
const baseUrl = String(config.site.base_url).replace(/\/$/, "");
let verifiedPdfPages = 0;
for (const slug of articleSlugs) {
  const page = readFileSync(join(blogDir, slug, "index.html"), "utf8");
  const pdf = readFileSync(join(downloadsDir, `${slug}.pdf`));
  const sourceUrl = new URL(`/blog/${encodeURIComponent(slug)}/`, baseUrl).href;
  const versionedPdfPrefix = `/downloads/${slug}.pdf?v=`;
  const versionedPdfOffset = page.indexOf(versionedPdfPrefix);
  const versionedPdfVersion = versionedPdfOffset < 0
    ? ""
    : page.slice(versionedPdfOffset + versionedPdfPrefix.length);
  if (!/^[a-f0-9]{64}/.test(versionedPdfVersion)) {
    throw new Error(`[post-downloads] Missing article-end PDF link with a SHA-256 cache version on /blog/${slug}/.`);
  }
  if (pdf.length < 1_000 || pdf.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new Error(`[post-downloads] ${slug}.pdf is empty or not a valid PDF.`);
  }
  if (!/\/Subtype\s*\/Image\b/.test(pdf.toString("latin1"))) {
    throw new Error(`[post-downloads] ${slug}.pdf is missing its embedded cover image.`);
  }
  const document = await getDocument({
    data: new Uint8Array(pdf),
    isEvalSupported: false,
    verbosity: 0,
  }).promise;
  const pageCount = document.numPages;
  if (pageCount < 1) throw new Error(`[post-downloads] ${slug}.pdf has no pages.`);
  if (pageCount < 3) throw new Error(`[post-downloads] ${slug}.pdf needs a cover, story, and final rights page.`);
  verifiedPdfPages += pageCount;
  let containsSinhalaText = false;
  let rightsNoticePage = 0;
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item) => ("str" in item ? item.str : "")).join(" ");
    if (pageNumber === 1 && !pageText.includes("SINHALA READER EDITION")) {
      throw new Error(`[post-downloads] ${slug}.pdf is missing its branded cover metadata.`);
    }
    const expectedPageNumber = String(pageNumber) + " / " + String(pageCount);
    if (!pageText.includes(expectedPageNumber)) {
      throw new Error(`[post-downloads] ${slug}.pdf page ${pageNumber}/${pageCount} is missing its footer page number.`);
    }
    const compactPageText = pageText
      .normalize("NFKC")
      .replace(/[\s\p{Cf}\p{P}]+/gu, "")
      .toUpperCase();
    if (compactPageText.includes("PERSONALREADINGCOPY")) rightsNoticePage = pageNumber;
    if (pageNumber === pageCount - 1) {
      const missingAuthorNotice = AUTHOR_NOTICE_MARKERS.filter(
        (check) => !check.markers.some((marker) => comp      const authorNoticeCount =
        compactPageText.split(AUTHOR_NOTICE_COUNT_MARKER.toUpperCase()).length - 1;
      const visibleAuthorNotice = textContent.items.some(
        (item) =>
          "str" in item &&
          item.str.includes("කර්තෘභාගය") &&
          Math.abs(item.height - 9) < 0.5 &&
          item.transform[5] > 50 &&
          item.transform[5] < page.getViewport({ scale: 1 }).height - 50,
      );
      const authorNoticeProblems = [
        ...missingAuthorNotice.map((check) => check.label),
        ...(!visibleAuthorNotice ? ["visible 9pt banner text"] : []),
        ...(authorNoticeCount !== 1
          ? ["exactly one complete rights statement (found " + authorNoticeCount + ")"]
          : []),
      ];
      if (authorNoticeProblems.length > 0) {
        throw new Error(
          "[post-downloads] " +
            slug +
            ".pdf page " +
            pageNumber +
            "/" +
            pageCount +
            " has an invalid highlighted end-of-story author notice: " +
            authorNoticeProblems.join(", ") +
            ".",
        );
      }banner text"] : [])].join(", ")}.`,
        );
      }
    }
    if (pageNumber === pageCount) {
      const missingRightsSections = RIGHTS_PAGE_MARKERS.filter(
        (check) => !check.markers.some((marker) => compactPageText.includes(marker.toUpperCase())),
      );
      if (
        !compactPageText.includes("අයිතිවාසිකම්සහභාවිතෙකාන්ෙද්සි".toUpperCase()) ||
        missingRightsSections.length > 0
      ) {
        throw new Error(
          `[post-downloads] ${slug}.pdf final page is missing requested rights/usage terms: ${missingRightsSections.map((check) => check.label).join(", ") || "rights-page heading"}.`,
        );
      }
    }
    if (pageNumber === 1) {
      const requiredAgeNoticeChecks = [
        { label: "adult audience", markers: ["වැඩිහිටි", "ඩිහිටි"] },
        { label: "sexual themes", markers: ["ලිංගික", "තේමා"] },
        { label: "under-18 warning", markers: ["18ටඅඩු"] },
        { label: "avoid-reading warning", markers: ["වළකින්න"] },
        { label: "parental responsibility", markers: ["දෙමාපිය", "වගකීම"] },
        { label: "fiction disclaimer", markers: ["චරිත"] },
        { label: "real-person disclaimer", markers: ["සැබෑ", "පුද්ගල", "සම්බන්ධ"] },
        { label: "lawful adult confirmation", markers: ["නීතිය", "අවසර", "තහවුරුකරයි"] },
      ];
      const matchesForCheck = requiredAgeNoticeChecks.map((check) => ({
        ...check,
        matches: check.markers.filter((marker) => compactPageText.includes(marker.toUpperCase())),
      }));
      const missingAgeNoticeChecks = matchesForCheck.filter((check) => check.matches.length === 0);
      // PDF.js can reorder Sinhala vowel signs in extracted glyph text; this anchor stays stable.
      const storyStartMarker = "සිටකතාවනිල";
      const lastNoticeMarkerPosition = Math.max(
        ...matchesForCheck.map((check) =>
          Math.max(...check.matches.map((marker) => compactPageText.indexOf(marker.toUpperCase()))),
        ),
      );
      const storyStartPosition = compactPageText.indexOf(storyStartMarker.toUpperCase());
      if (
        !/18\+?සඳහාපමණි/u.test(compactPageText) ||
        missingAgeNoticeChecks.length > 0 ||
        storyStartPosition <= lastNoticeMarkerPosition
      ) {
        const titlePosition = compactPageText.search(/18\+?සඳහාපමණි/u);
        const noticeStart = titlePosition >= 0 ? titlePosition : compactPageText.lastIndexOf("18");
        const noticeEnd = storyStartPosition > noticeStart ? storyStartPosition : undefined;
        const extractedNotice = compactPageText.slice(Math.max(0, noticeStart), noticeEnd);
        const missingLabels = missingAgeNoticeChecks.map((check) => check.label);
        throw new Error(
          `[post-downloads] ${slug}.pdf is missing a first-page 18+ notice anchor or has the story-start marker before it. Missing anchors: ${missingLabels.join(", ") || "none"}. Extracted notice: ${extractedNotice}`,
        );
      }
    }
    if (/[\u0D80-\u0DFF]/u.test(pageText)) containsSinhalaText = true;
    const viewport = page.getViewport({ scale: 1 });
    const centeredWatermarkCount = textContent.items.filter((item) => {
      if (!("str" in item) || item.str !== WATERMARK) return false;
      const fontSize = Math.abs(item.transform[0]);
      const centerX = item.transform[4] + item.width / 2;
      return (
        Math.abs(fontSize - CENTER_WATERMARK_FONT_SIZE) < 0.5 &&
        Math.abs(centerX - viewport.width / 2) < 2 &&
        Math.abs(item.transform[5] - viewport.height / 2) <= CENTER_WATERMARK_FONT_SIZE
      );
    }).length;
    const shouldHaveCenteredWatermark = pageNumber > 1 && pageNumber < pageCount;
    const expectedCenteredWatermarkCount = shouldHaveCenteredWatermark ? 1 : 0;
    if (centeredWatermarkCount !== expectedCenteredWatermarkCount) {
      throw new Error(
        "[post-downloads] " + slug + ".pdf page " + pageNumber + "/" + pageCount + " expected " + expectedCenteredWatermarkCount + " centered URL watermark(s), found " + centeredWatermarkCount + ".",
      );
    }
    const hasFooterUrl = textContent.items.some(
      (item) =>
        "str" in item &&
        item.str === WATERMARK &&
        Math.abs(item.height - FOOTER_WATERMARK_FONT_SIZE) < 0.5 &&
        Math.abs(item.transform[4] - PAGE_MARGIN) < 1 &&
        item.transform[5] >= 0 &&
        item.transform[5] < 50,
    );
    if (!hasFooterUrl) {
      throw new Error("[post-downloads] " + slug + ".pdf page " + pageNumber + "/" + pageCount + " is missing its repeated URL footer.");
    }
    if (pageNumber === 1 && !pageText.includes(sourceUrl)) {
      throw new Error(`[post-downloads] ${slug}.pdf is missing its canonical source URL.`);
    }
  }
  if (rightsNoticePage !== pageCount) {
    throw new Error("[post-downloads] " + slug + ".pdf has its final rights notice on page " + (rightsNoticePage || "none") + " instead of its last page (" + pageCount + ").");
  }
  if (!containsSinhalaText) throw new Error(`[post-downloads] ${slug}.pdf does not contain extractable Sinhala text.`);
  await document.destroy();
}

const headers = readFileSync(join(dist, "_headers"), "utf8");
const headerStart = headers.indexOf("/downloads/*.pdf");
if (headerStart < 0) throw new Error("[post-downloads] Missing Cloudflare Pages PDF header rule.");
const headerRule = headers.slice(headerStart, headers.indexOf("\n\n", headerStart) < 0 ? undefined : headers.indexOf("\n\n", headerStart));
for (const required of [
  /Content-Type:\s*application\/pdf/i,
  /Content-Disposition:\s*attachment/i,
  /X-Robots-Tag:\s*noindex,\s*nofollow/i,
]) {
  if (!required.test(headerRule)) throw new Error(`[post-downloads] Missing required PDF header: ${required}.`);
}
const sitemapFiles = readdirSync(dist).filter((name) => name.endsWith(".xml"));
for (const name of sitemapFiles) {
  if (readFileSync(join(dist, name), "utf8").includes("/downloads/")) {
    throw new Error(`[post-downloads] Reader copies must not appear in sitemap ${name}.`);
  }
}
console.log(`[post-downloads] Verified ${articleSlugs.length} published articles across ${verifiedPdfPages} PDF page(s); the final story page has the highlighted author-rights notice, final rights pages include all requested usage terms, every interior page has one centered watermark, cover and final rights pages omit it, and every page has a footer and page number; PDFs retain source/article links, attachment/noindex headers, and stay out of sitemaps.`);
