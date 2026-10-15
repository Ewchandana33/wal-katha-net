import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const root = process.cwd();
const dist = resolve(root, "dist");
const blogDir = join(dist, "blog");
const downloadsDir = join(dist, "downloads");
if (!existsSync(blogDir)) throw new Error("[post-downloads] Built blog directory is missing.");
if (!existsSync(downloadsDir)) throw new Error("[post-downloads] No Markdown download directory was generated.");

const articleSlugs = readdirSync(blogDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(join(blogDir, entry.name, "index.html")))
  .map((entry) => entry.name)
  .sort();
const downloadSlugs = readdirSync(downloadsDir)
  .filter((name) => name.endsWith(".md"))
  .map((name) => name.slice(0, -3))
  .sort();
if (articleSlugs.length === 0) throw new Error("[post-downloads] No built article routes were found.");
if (JSON.stringify(articleSlugs) !== JSON.stringify(downloadSlugs)) {
  throw new Error(`[post-downloads] Article/download mismatch. Articles: ${articleSlugs.length}; downloads: ${downloadSlugs.length}.`);
}

const config = JSON.parse(readFileSync(join(root, "src/config/config.json"), "utf8"));
const baseUrl = String(config.site.base_url).replace(/\/$/, "");
for (const slug of articleSlugs) {
  const page = readFileSync(join(blogDir, slug, "index.html"), "utf8");
  const markdown = readFileSync(join(downloadsDir, `${slug}.md`), "utf8");
  const sourceUrl = new URL(`/blog/${encodeURIComponent(slug)}/`, baseUrl).href;
  if (!page.includes(`/downloads/${slug}.md`)) throw new Error(`[post-downloads] Missing article-end download link on /blog/${slug}/.`);
  if (!markdown.startsWith("# ") || markdown.length < 80 || !markdown.includes(sourceUrl)) {
    throw new Error(`[post-downloads] ${slug}.md is empty, malformed, or missing its canonical source link.`);
  }
}

const headers = readFileSync(join(dist, "_headers"), "utf8");
const headerStart = headers.indexOf("/downloads/*.md");
if (headerStart < 0) throw new Error("[post-downloads] Missing Cloudflare Pages download header rule.");
const headerRule = headers.slice(headerStart);
for (const required of [
  /Content-Type:\s*text\/markdown;\s*charset=utf-8/i,
  /Content-Disposition:\s*attachment/i,
  /X-Robots-Tag:\s*noindex,\s*nofollow/i,
]) {
  if (!required.test(headerRule)) throw new Error(`[post-downloads] Missing required download header: ${required}.`);
}
const sitemapFiles = readdirSync(dist).filter((name) => name.endsWith(".xml"));
for (const name of sitemapFiles) {
  if (readFileSync(join(dist, name), "utf8").includes("/downloads/")) {
    throw new Error(`[post-downloads] Reader copies must not appear in sitemap ${name}.`);
  }
}
console.log(`[post-downloads] Verified ${articleSlugs.length} published articles have UTF-8 Markdown downloads, article-end links, noindex headers, and no sitemap entries.`);
