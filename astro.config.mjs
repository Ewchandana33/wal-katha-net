import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { unified } from "@astrojs/markdown-remark";
import AutoImport from "astro-auto-import";
import gtm from "astro-gtm-lite";
import { defineConfig, fontProviders, sharpImageService } from "astro/config";
import config from "./src/config/config.json";
import theme from "./src/config/theme.json";
import remarkAutoInternalLinks from "./src/lib/remarkAutoInternalLinks.mjs";
import redirectFixer from "./src/integrations/redirect-fixer.mjs";
import earlyHintsPreload from "./src/integrations/early-hints-preload.mjs";
import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { slug as githubSlug } from "github-slugger";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = path.join(__dirname, "src/content");
const frontmatterCache = new Map();
function readFrontmatter(absFilePath) {
  if (frontmatterCache.has(absFilePath)) return frontmatterCache.get(absFilePath);
  let result = null;
  try {
    if (existsSync(absFilePath)) {
      const raw = readFileSync(absFilePath, "utf-8");
      const match = raw.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---/);
      if (match) result = match[1];
    }
  } catch {
    result = null;
  }
  frontmatterCache.set(absFilePath, result);
  return result;
}
function normalizeDateValue(value) {
  if (!value) return null;
  const cleaned = String(value)
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/^["']|["']$/g, "")
    .trim();
  if (!cleaned) return null;
  const parsed = new Date(cleaned);
  if (Number.isNaN(parsed.getTime())) return null;
  const year = parsed.getUTCFullYear();
  if (year < 1990 || year > 2100) return null;
  return parsed.toISOString();
}
function extractScalarField(frontmatter, fieldName) {
  if (!frontmatter) return null;
  const re = new RegExp(`^[ \\t]*${fieldName}[ \\t]*:[ \\t]*(.+)$`, "m");
  const m = frontmatter.match(re);
  return m ? m[1] : null;
}
const gitLastModCache = new Map();
function getGitLastMod(absFilePath) {
  if (gitLastModCache.has(absFilePath)) return gitLastModCache.get(absFilePath);
  let result = null;
  try {
    if (existsSync(absFilePath)) {
      const out = execSync(`git log -1 --format=%cI -- "${absFilePath}"`, {
        cwd: __dirname,
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
      if (out) result = out;
    }
  } catch {
    result = null;
  }
  gitLastModCache.set(absFilePath, result);
  return result;
}
const contentLastModCache = new Map();
function getContentLastMod(absFilePath) {
  if (!absFilePath) return null;
  if (contentLastModCache.has(absFilePath)) return contentLastModCache.get(absFilePath);
  const fm = readFrontmatter(absFilePath);
  const published = normalizeDateValue(extractScalarField(fm, "date"));
  const updated = normalizeDateValue(extractScalarField(fm, "updated"));
  let result = null;
  if (published && updated) {
    result = new Date(updated) > new Date(published) ? updated : published;
  } else {
    result = updated || published || null;
  }
  if (!result) result = getGitLastMod(absFilePath);
  contentLastModCache.set(absFilePath, result);
  return result;
}
function findContentFile(dir, slugValue) {
  for (const ext of [".md", ".mdx"]) {
    const p = path.join(dir, `${slugValue}${ext}`);
    if (existsSync(p)) return p;
  }
  return null;
}
let postsFileListCache = null;
function getAllPostFiles() {
  if (postsFileListCache) return postsFileListCache;
  const dir = path.join(CONTENT_DIR, "posts");
  postsFileListCache = [];
  try {
    for (const file of readdirSync(dir)) {
      if (!/\.(md|mdx)$/i.test(file)) continue;
      if (file.startsWith("-")) continue;
      postsFileListCache.push(path.join(dir, file));
    }
  } catch {
    postsFileListCache = [];
  }
  return postsFileListCache;
}
let siteWideLastModCache;
function getSiteWideLastMod() {
  if (siteWideLastModCache !== undefined) return siteWideLastModCache;
  let latest = null;
  for (const filePath of getAllPostFiles()) {
    const d = getContentLastMod(filePath);
    if (d && (!latest || new Date(d) > new Date(latest))) latest = d;
  }
  siteWideLastModCache = latest;
  return siteWideLastModCache;
}
function extractArrayField(content, fieldName) {
  const inlineMatch = content.match(new RegExp(fieldName + "\\s*:\\s*\\[([^\\]]*)\\]"));
  if (inlineMatch) {
    return inlineMatch[1]
      .split(",")
      .map((item) => item.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
  }
  const blockRegex = new RegExp(fieldName + "\\s*:\\s*\\n((?:[ \\t]*-[ \\t]*.+\\n?)+)");
  const blockMatch = content.match(blockRegex);
  if (blockMatch) {
    return blockMatch[1]
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("-"))
      .map((line) => line.replace(/^-\s*/, "").trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean);
  }
  return [];
}
const taxonomyLastModCache = new Map();
function getTaxonomyLastMod(fieldName, slugValue) {
  const cacheKey = `${fieldName}:${slugValue}`;
  if (taxonomyLastModCache.has(cacheKey)) return taxonomyLastModCache.get(cacheKey);
  let latest = null;
  for (const filePath of getAllPostFiles()) {
    try {
      const content = readFileSync(filePath, "utf-8");
      const values = extractArrayField(content, fieldName);
      const isMatch = values.some((v) => githubSlug(v) === slugValue);
      if (isMatch) {
        const d = getContentLastMod(filePath);
        if (d && (!latest || new Date(d) > new Date(latest))) {
          latest = d;
        }
      }
    } catch {
      // skip unreadable file
    }
  }
  const result = latest || getSiteWideLastMod();
  taxonomyLastModCache.set(cacheKey, result);
  return result;
}
function resolveLastModForUrl(pathname) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return getSiteWideLastMod();
  const EXCLUDED_FIRST_SEGMENTS = ["categories", "tags", "page", "search", "blog", "authors", "about", "contact"];
  if (segments[0] === "blog" && segments[1]) {
    const f = findContentFile(path.join(CONTENT_DIR, "posts"), segments[1]);
    if (f) {
      const d = getContentLastMod(f);
      if (d) return d;
    }
    return getSiteWideLastMod();
  }
  if (segments[0] === "authors" && segments[1] && segments[1] !== "page") {
    const f = findContentFile(path.join(CONTENT_DIR, "authors"), segments[1]);
    if (f) {
      const d = getContentLastMod(f);
      if (d) return d;
    }
    return getSiteWideLastMod();
  }
  if (segments[0] === "about") {
    const d = getContentLastMod(path.join(CONTENT_DIR, "about", "-index.md"));
    return d || getSiteWideLastMod();
  }
  if (segments[0] === "contact") {
    const d = getContentLastMod(path.join(CONTENT_DIR, "contact", "-index.md"));
    return d || getSiteWideLastMod();
  }
  if (segments[0] === "categories" && segments[1] && segments[1] !== "page") {
    return getTaxonomyLastMod("categories", segments[1]);
  }
  if (segments[0] === "tags" && segments[1] && segments[1] !== "page") {
    return getTaxonomyLastMod("tags", segments[1]);
  }
  if (segments.length === 1 && !EXCLUDED_FIRST_SEGMENTS.includes(segments[0])) {
    const f = findContentFile(path.join(CONTENT_DIR, "pages"), segments[0]);
    if (f) {
      const d = getContentLastMod(f);
      if (d) return d;
    }
  }
  return getSiteWideLastMod();
}
const LEGAL_PATHS = new Set([
  "privacy-policy",
  "terms-and-conditions",
  "copyright-credit-policy",
  "parental-control",
  "contact",
  "about",
]);
function resolveSitemapSignals(pathname) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return { priority: 1.0, changefreq: "daily" };
  if (segments[0] === "blog" && segments[1]) return { priority: 0.8, changefreq: "monthly" };
  if (segments[0] === "categories") return { priority: 0.6, changefreq: "weekly" };
  if (segments[0] === "tags") return { priority: 0.5, changefreq: "weekly" };
  if (segments[0] === "authors") return { priority: 0.5, changefreq: "monthly" };
  if (segments[0] === "page") return { priority: 0.4, changefreq: "weekly" };
  if (segments.length === 1 && LEGAL_PATHS.has(segments[0])) {
    return { priority: 0.3, changefreq: "yearly" };
  }
  return { priority: 0.6, changefreq: "monthly" };
}
function parseFontString(fontStr) {
  const [name, weightPart] = fontStr.split(":");
  let weights = [400];
  if (weightPart) {
    const weightMatch = weightPart.match(/wght@?([\d;]+)/);
    if (weightMatch) {
      weights = weightMatch[1].split(";").map((w) => parseInt(w, 10));
    }
  }
  const cleanName = name.replace(/\+/g, " ");
  return { name: cleanName, weights };
}
const fontsConfig = Object.entries(theme.fonts.font_family)
  .filter(([key]) => !key.includes("_type"))
  .map(([key, fontStr]) => {
    const { name, weights } = parseFontString(fontStr);
    const typeKey = `${key}_type`;
    const fallback = theme.fonts.font_family[typeKey] || "sans-serif";
    return {
      name,
      cssVariable: `--font-${key}`,
      provider: fontProviders.bunny(),
      weights,
      display: "swap",
      fallbacks: [fallback],
    };
  });
function ensureSitemapTrailingSlash(url) {
  if (url.endsWith("/")) return url;
  try {
    const urlObj = new URL(url);
    if (urlObj.pathname === "" || urlObj.pathname === "/") {
      urlObj.pathname = "/";
      return urlObj.toString();
    }
    const lastSegment = urlObj.pathname.split("/").filter(Boolean).pop() || "";
    if (/\.[a-z0-9]{2,5}$/i.test(lastSegment)) return url;
    urlObj.pathname = `${urlObj.pathname}/`;
    return urlObj.toString();
  } catch {
    const lastSegment = url.split("/").pop() || "";
    if (/\.[a-z0-9]{2,5}$/i.test(lastSegment)) return url;
    return `${url}/`;
  }
}
function isFrontmatterTrue(value) {
  return String(value ?? "")
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .toLowerCase() === "true";
}
function getThinTaxonomySitemapPaths(fieldName, routeSegment) {
  const postCounts = new Map();
  for (const filePath of getAllPostFiles()) {
    const frontmatter = readFrontmatter(filePath) || "";
    if (isFrontmatterTrue(extractScalarField(frontmatter, "draft"))) continue;
    const slugs = new Set(
      extractArrayField(frontmatter, fieldName)
        .map((value) => githubSlug(value))
        .filter(Boolean)
    );
    for (const slug of slugs) {
      postCounts.set(slug, (postCounts.get(slug) || 0) + 1);
    }
  }
  // Keep this threshold aligned with the category and tag page templates.
  return Array.from(postCounts.entries())
    .filter(([, postCount]) => postCount < 2)
    .map(([slug]) => "/" + routeSegment + "/" + slug);
}
function getNoindexPageSitemapPaths() {
  const pagesDir = path.join(CONTENT_DIR, "pages");
  let files = [];
  try {
    files = readdirSync(pagesDir).filter((file) => /^.+\.(md|mdx)$/i.test(file) && !file.startsWith("-"));
  } catch {
    return [];
  }
  return files
    .filter((file) => {
      const frontmatter = readFrontmatter(path.join(pagesDir, file));
      return (
        isFrontmatterTrue(extractScalarField(frontmatter, "noindex")) &&
        !isFrontmatterTrue(extractScalarField(frontmatter, "draft"))
      );
    })
    .map((file) => "/" + file.replace(/\.(md|mdx)$/i, ""));
}
const AUTOMATICALLY_EXCLUDED_SITEMAP_PATHS = [
  ...getThinTaxonomySitemapPaths("categories", "categories"),
  ...getThinTaxonomySitemapPaths("tags", "tags"),
  ...getNoindexPageSitemapPaths(),
];
const EXCLUDED_SITEMAP_PATHS = [
  "/elements",
  "/blog/bus-jack-wal-katha",
  "/page/1",
  "/search",
  "/downloads",
  // Story pages are an on-site format only for now. Keep them out of
  // Google's existing sitemap/indexing surface unless indexing is requested.
  "/stories",
  "/news-sitemap.xml",
  "/image-sitemap.xml",
  ...AUTOMATICALLY_EXCLUDED_SITEMAP_PATHS,
];

function findSitemapFiles(directory, found = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      findSitemapFiles(filePath, found);
    } else if (entry.isFile() && /sitemap.*\.xml$/i.test(entry.name)) {
      found.push(filePath);
    }
  }
  return found;
}
function verifySitemapIndexability({ dir }) {
  const distDir = fileURLToPath(dir);
  const sitemapFiles = findSitemapFiles(distDir);
  if (sitemapFiles.length === 0) {
    throw new Error("[sitemap-indexability] No XML sitemap files found in build output.");
  }
  const expectedOrigin = new URL(config.site.base_url || "https://www.walakatha.net").origin;
  const issues = [];
  let checked = 0;
  for (const sitemapFile of sitemapFiles) {
    const xml = readFileSync(sitemapFile, "utf-8");
    for (const match of xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)) {
      let pageUrl;
      try {
        pageUrl = new URL(match[1].trim());
      } catch {
        issues.push("Invalid sitemap URL: " + match[1].trim());
        continue;
      }
      if (/\.xml$/i.test(pageUrl.pathname)) continue;
      if (pageUrl.origin !== expectedOrigin) {
        issues.push("Unexpected sitemap host for " + pageUrl.href);
        continue;
      }
      let relativePath;
      try {
        relativePath = decodeURIComponent(pageUrl.pathname).replace(/^\/+/, "");
      } catch {
        issues.push("Invalid encoded sitemap path: " + pageUrl.href);
        continue;
      }
      if (relativePath.split("/").includes("..")) {
        issues.push("Unsafe sitemap path: " + pageUrl.href);
        continue;
      }
      const normalizedPath = relativePath.replace(/\/+$/, "");
      const candidates = [
        path.join(distDir, normalizedPath, "index.html"),
        path.join(distDir, normalizedPath + ".html"),
      ];
      const htmlPath = candidates.find((candidate) => existsSync(candidate));
      if (!htmlPath) {
        issues.push("No built HTML found for " + pageUrl.href);
        continue;
      }
      const html = readFileSync(htmlPath, "utf-8");
      const metaTags = html.match(/<meta\b[^>]*>/gi) || [];
      const robotsTag = metaTags.find((tag) => /\bname\s*=\s*["']robots["']/i.test(tag));
      const robotsContent = robotsTag && robotsTag.match(/\bcontent\s*=\s*["']([^"']*)["']/i);
      if (robotsContent && /(^|[\s,])noindex([\s,]|$)/i.test(robotsContent[1])) {
        issues.push("noindex URL included in sitemap: " + pageUrl.href);
      }
      const canonicalTag = html.match(/<link\b[^>]*\brel\s*=\s*["']canonical["'][^>]*>/i);
      const canonicalHref = canonicalTag && canonicalTag[0].match(/\bhref\s*=\s*["']([^"']+)["']/i);
      if (!canonicalHref) {
        issues.push("Missing canonical on sitemap URL: " + pageUrl.href);
      } else if (new URL(canonicalHref[1], pageUrl).href !== pageUrl.href) {
        issues.push("Canonical does not match sitemap URL: " + pageUrl.href);
      }
      checked += 1;
    }
  }
  if (issues.length > 0) {
    throw new Error(
      "[sitemap-indexability] Found " + issues.length + " issue(s):\n" + issues.join("\n")
    );
  }
  console.log("[sitemap-indexability] Checked " + checked + " page URL(s); all are indexable with matching canonicals.");
}
function sitemapIndexabilityGuard() {
  return {
    name: "sitemap-indexability-guard",
    hooks: {
      "astro:build:done": verifySitemapIndexability,
    },
  };
}
function isExcludedFromSitemap(url) {
  const pathname = url.replace(/^https?:\/\/[^/]+/, "").replace(/\/$/, "");
  return EXCLUDED_SITEMAP_PATHS.some(
    (excluded) => pathname === excluded || pathname.startsWith(`${excluded}/`)
  );
}
export default defineConfig({
  site: config.site.base_url ? config.site.base_url : "https://www.walakatha.net",
  base: config.site.base_path ? config.site.base_path : "/",
  trailingSlash: config.site.trailing_slash ? "always" : "never",
  build: {
    format: "directory",
    inlineStylesheets: "never",
  },
  compressHTML: true,
  image: {
    service: sharpImageService({
      jpeg: { quality: 75 },
      webp: { quality: 72 },
      png: { quality: 80 },
      avif: { quality: 65 },
    }),
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      cssCodeSplit: true,
    },
  },
  fonts: fontsConfig,
  integrations: [
    react(),
    redirectFixer(),
    earlyHintsPreload(),
    sitemap({
      changefreq: "weekly",
      priority: 0.7,
      serialize(item) {
        if (isExcludedFromSitemap(item.url)) {
          return undefined;
        }
        item.url = ensureSitemapTrailingSlash(item.url);
        try {
          const urlObj = new URL(item.url);
          const signals = resolveSitemapSignals(urlObj.pathname);
          item.priority = signals.priority;
          item.changefreq = signals.changefreq;
          const lastmod = resolveLastModForUrl(urlObj.pathname);
          if (lastmod) {
            item.lastmod = lastmod;
          } else {
            delete item.lastmod;
          }
        } catch {
          delete item.lastmod;
        }
        return item;
      },
    }),
    sitemapIndexabilityGuard(),
    AutoImport({
      imports: [
        "@/shortcodes/Button",
        "@/shortcodes/Accordion",
        "@/shortcodes/Notice",
        "@/shortcodes/Video",
        "@/shortcodes/Youtube",
        "@/shortcodes/Tabs",
        "@/shortcodes/Tab",
      ],
    }),
    mdx(),
    gtm({
      enable: config.google_tag_manager.enable,
      id: config.google_tag_manager.gtm_id,
      devMode: false,
    }),
  ],
  markdown: {
    processor: unified({ remarkPlugins: [remarkAutoInternalLinks] }),
    shikiConfig: { theme: "one-dark-pro", wrap: true },
  },
});