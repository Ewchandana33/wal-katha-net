# AI Change Log

## Instructions for future AI agents and maintainers

This file is the active changelog, operating guide, and index to archived history. Read these instructions and the status snapshot before editing. Check current GitHub and Cloudflare state for each task; historical notes are evidence of past state, not proof of current state. Read archived entries only when relevant.

For every AI-assisted code, SEO, automation, or deployment change, append a dated entry explaining why, what files or behavior changed, and which checks actually ran. Record exact PR, commit, and deployment identifiers with their outcomes. Treat GitHub checks and Cloudflare deployment logs as release truth; never infer production success from a commit or preview. Distinguish completed checks from pending work. Never store credentials or tokens, and never promise Google rankings.

### Archive and size policy

- Keep the five newest complete dated entries in this active file and aim to keep it at or below 20 KiB.
- When a sixth dated entry is added or the file exceeds 20 KiB, move the oldest complete dated sections to archive/AI_CHANGELOG-YYYY-QN.md, using the quarter of each entry (for example, archive/AI_CHANGELOG-2026-Q4.md). Move additional oldest sections if needed to meet both limits; never split a dated entry.
- Preserve archived entries verbatim and in chronological order. Do not delete evidence or silently rewrite earlier decisions. Add a short archive header with its date range and entry count, then update this index with the archive path, coverage, and count.
- Use one archive file per quarter and append later entries from that quarter to it. At quarter rollover, create the next quarter file. Verify each dated entry appears exactly once in the active log or an archive.
- If later evidence changes a conclusion, add a dated correction that names the superseded entry; retain the earlier note as historical context.

## Status snapshot — 2026-10-15

- Current production baseline verified before the Markdown-download change: main SHA `ef388186b546ada859542d1965bf8a5cfe709a78` from PR #49 (GSC query triage; documentation-only). Cloudflare Pages production deployment `d2e65e1c-5045-411b-96fe-250f6392b40d` was triggered by that exact SHA; all five stages succeeded. All 156 returned deployment-log entries (including container logs) were checked and none matched warning, deprecation, error, fatal, failure, or failed.
- The latest checked Sync GSC Keywords main run was 38700591415 (success). Its committed export was generated at 2026-10-15T07:42:57.643Z for 2026-07-15 through 2026-10-12: 500 global queries, 394 usable queries, 46 pages. This is workflow-export evidence, not a fresh post-release Search Console comparison.
- On homepage route /, query වැල් had 4,075 impressions, 90 clicks, calculated CTR 2.21%, and average position 5.2 in that export. The homepage snippet already targets the query. GSC post-recrawl follow-up run 38726508677 completed successfully, but its report-PR step was skipped because recrawl/data gates were not met; no post-release CTR or ranking effect is established.
- Keep the active comparison gates: Google indexed verdict and a crawl at or after the 2026-10-15 snippet release; at least seven days after deployment; a complete 28-day post-crawl window with the three-day data lag; at least 500 impressions in each global comparison window. Report Sri Lanka separately and label it directional below 100 impressions in either window.
## Archive index

- archive/AI_CHANGELOG-2026-Q4.md — 24 earlier dated entries from 2026-10-14 through 2026-10-15; dated sections are retained verbatim.

## Recent entries

## 2026-10-16 — Embed post cover images in article PDFs

### Why

- The earlier PDF release had watermarks and selectable Sinhala, but a live production sample at /downloads/akkai-nangi-wal-katha.pdf contained no embedded image object. That left out the requested post cover and weakened the book-like first page.

### Changes

- Pass each published post's local cover image and alt text into its PDF route. The generator validates that the asset is a local /images/posts file, normalizes it to a compact JPEG with Sharp, and places it inside a framed cover area before the title and source details.
- Extend the production PDF verifier to fail when any published article PDF has no embedded image XObject. Existing per-page watermark/footer, Sinhala text, source link, article CTA, attachment/noindex headers, and sitemap-exclusion checks remain.
- Keep PDF routes as noindex reader copies; the canonical HTML article remains the search result target.

### Verification status

- Before this change, the live lowercase sample PDF returned HTTP 200, was a valid nine-page PDF, and had zero /Subtype /Image objects. The sitemap listed lowercase article routes; an uppercase-slug probe returned 404 and was not used as evidence of a route failure.
- Required GitHub CI, Cloudflare preview/production logs, and post-deploy PDF image verification for this change are pending. Do not treat this entry or a successful commit as deployment evidence.
- Cloudflare Pages API execution is currently blocked by the connector's permission setting; inspect the deployment logs after API execution is enabled.

### SEO boundary

- The PDF remains non-indexable and excluded from sitemaps; no Google ranking or traffic improvement is promised.

## 2026-10-16 — PR #52 production release and live PDF verification

### Correction to pending release status

- This entry supersedes the pending GitHub/Cloudflare status recorded in “2026-10-16 — Repair external CI dependency installation for article PDFs” and “2026-10-16 — Sinhala article PDFs with repeated site watermark”. Those entries remain as the chronological failure and implementation record.
- PR #52 merged at 2026-10-16T04:10:32Z as protected main commit `93a64c1a4e123c95eb062c5b5657c82d03a7de8c`. Required GitHub CI run `38849118469` passed: dependency install, Astro type-check, tests, static build, and pagination/homepage SEO output checks. The Cloudflare Pages check run `116806985615` also passed.

### Cloudflare and live verification

- Preview deployment `948bb1f7-2e21-4ee2-9f86-08484e9da4b9` for PR head `781e5d14044cf2e8d05461cfaa8f588128795d6a` passed all five stages. Production deployment `28a52960-2dfb-4756-aca6-100538bd5241` for the exact main merge commit passed all five stages. All 173 returned log entries for each deployment were checked; no warning, deprecation, error, fatal, or failure matches were found.
- The production build verifier confirmed 50 site pages and seven article PDFs spanning 57 PDF pages, with each page's centered watermark and footer, extractable Sinhala, source links, article CTA, attachment/noindex headers, and PDF sitemap exclusion.
- Live checks on `https://www.walakatha.net` returned HTTP 200 for all seven PDF routes. Each served `application/pdf`, an attachment disposition, and `X-Robots-Tag: noindex, nofollow`; a full sample download had the `%PDF-` signature. The article page linked to its PDF, and `sitemap-0.xml` contained no `/downloads/` URLs. Its canonical URL was the HTML article; locale metadata included `hreflang=si-LK` and `og:locale=si_LK`.

### SEO boundary

- Canonical article HTML remains the only index target; downloadable copies are noindex and omitted from sitemaps. This is technical SEO hygiene, not a ranking shortcut. No Google top-ranking, post-release indexing, or traffic increase is claimed; the existing Search Console comparison gates still apply.

## 2026-10-16 — Repair external CI dependency installation for article PDFs

### Why

- PR #52 initially failed at dependency installation because 26 new lockfile tarballs referenced the Replit-only `package-firewall.replit.internal` host. Cloudflare deployment `3102cf77-d753-4d75-a58e-aeee9d4013d9` and GitHub CI run `38845171391` recorded that failure.
- Registry correction commit `fb546901af26f727adbf7b8af8383aed928e5a6e` made Cloudflare preview deployment `6bcadf34-4e34-4351-9791-66af10ec2525` pass all five stages. Its 173 deployment-log entries had no warning/error/failure matches, and its build verifier checked seven article PDFs across 57 pages.
- GitHub CI run `38848017465` then reached `astro check` and failed with TypeScript `ts(7016)`: `pdfkit` has no bundled declarations, so the new PDF module lacked types. This was separate from the completed Cloudflare build.

### Changes

- Replaced the 26 Replit-only tarball URL prefixes with `https://registry.npmjs.org/`, preserving package versions, paths, and integrity hashes.
- Added `@types/pdfkit@0.17.6` as a dev dependency. Yarn 1.22.22 generated one exact lock entry using the existing `@types/node@*` resolution; no runtime dependency or PDF behavior changed.
- Moved the oldest complete dated log entry to `archive/AI_CHANGELOG-2026-Q4.md` to keep the active log at five entries (the archive now has 22).

### Verification status

- Yarn completed dependency resolution with `@types/pdfkit@0.17.6`; the generated lock diff is one package entry and contains no Replit-internal registry host. A local full Astro check was not treated as passing because that scratch install initially omitted optional platform bindings; the required GitHub CI is the authoritative type-check.
- Cloudflare preview commit `fb546901af26f727adbf7b8af8383aed928e5a6e` passed all five stages; its build verified 50 pages, 7 PDFs/57 PDF pages, watermarks, canonical source links, attachment/noindex headers, and sitemap exclusion. The new type-dependency commit's CI and preview checks are pending.
- Production remains on main SHA `c6bc1e9f92aab0032a387795e5c1d6533065ec35`, with successful deployment `b1a1202b-e756-4ed8-8cbd-ae6b533065b8`; no PR change has been reported as a production release.

## 2026-10-16 — Sinhala article PDFs with repeated site watermark

### Why

- The existing article-end download was Markdown; the requested reader copy is a downloadable PDF with the site URL repeated on every page.
- Keep canonical HTML as the only search landing page. Reader PDFs are a convenience, not an SEO ranking shortcut.

### Changes

- Added a build-time PDF endpoint for every published article, using PDFKit and an embedded Noto Sans Sinhala font (SIL Open Font License). The PDF keeps selectable/extractable Sinhala text, the article title/date, and a link to the canonical HTML article.
- Changed the article-end button to download `.pdf`. Existing Markdown download URLs remain available for backward compatibility but are no longer the article-page CTA.
- Added `https://www.walakatha.net` as centered page content and as a footer on every PDF page. It is embedded in the page content, not an optional annotation/layer; PDF editing/rasterization can still remove or obscure any watermark, so absolute removal prevention is not claimed.
- Added PDF attachment, MIME, one-day cache, and `X-Robots-Tag: noindex, nofollow` headers. PDFs are excluded from sitemaps; canonical article HTML remains authoritative.
- Extended the required build verifier with PDF.js to check every published article has a valid PDF, extractable Sinhala text, the canonical source URL, at least two URL watermarks on every page, a visible PDF download link, attachment/noindex headers, and no sitemap entry.

### Local verification

- `yarn check` completed successfully and `yarn test` passed all five tests. `yarn check` reported 20 dependency-resolution/deduplication notices; Yarn 1 also emitted Node's `DEP0169` `url.parse()` deprecation warning. These are environment/dependency-tree notices, not PDF/build failures; no unrelated lockfile resolutions were changed to hide them.
- `yarn build` completed successfully: 50 site pages, seven article PDFs across 57 PDF pages, and the PDF.js build verifier confirmed per-page center/footer watermarks, extractable Sinhala, and source URLs. The build also passed sitemap-indexability, featured-link, social-image, and critical-CSS checks.
- GitHub PR checks and Cloudflare preview/production deployment verification are pending; do not treat local build success as a release.

### SEO and release boundary

- PDF downloads remain noindex and out of sitemaps; the HTML article's canonical URL, Sri Lankan locale metadata, and existing SEO text are unchanged. No ranking or traffic increase is claimed.
- A PDF watermark is deterrence, not DRM; no method can make a user-editable PDF watermark literally impossible to remove.

## 2026-10-15 — Article-end Markdown downloads with duplicate-index safeguards

### Why

- The site already serves canonical, structured HTML articles. Publishing full duplicate files as indexable search bait would not guarantee rankings and could create duplicate-content ambiguity; downloads are implemented as a reader convenience instead.
- Keep the original HTML article authoritative and prevent generated copies from appearing in search results or XML sitemaps.

### Changes

- Added a build-time `/downloads/{slug}.md` endpoint for every published post, sourced from the same non-draft collection as article pages. Each UTF-8 file carries its title, original-article link, publication date when valid, and the existing Markdown body.
- Added an accessible Markdown download link after article content, tags, and sharing controls.
- Added Cloudflare Pages headers for Markdown MIME type, attachment download, one-day cache, and `X-Robots-Tag: noindex, nofollow`; excluded `/downloads/` from the sitemap.
- Added a production-build verifier that checks every published article has one non-empty download and visible link, validates header configuration, and fails if reader copies enter the sitemap. No dependency or lockfile change.

### SEO and release boundary

- Canonical HTML remains the sole index target; no ranking or traffic increase is claimed. This avoids treating duplicate exports as a ranking shortcut.
- Pre-change production baseline: main SHA `ef388186b546ada859542d1965bf8a5cfe709a78`, Pages deployment `d2e65e1c-5045-411b-96fe-250f6392b40d`; all five stages succeeded. All 156 returned deployment-log entries were checked and none matched warning, deprecation, error, fatal, failure, or failed terms.
- GitHub PR #50 was auto-merged on 2026-10-15 from feature head `bbf19364ae76ec5d5a901e1106b5439d4e12b7cc` as main squash commit `dce850669c6de8ace67161cfec2fe70e69e4b50d`. CI run `38781056981` completed successfully; the required `Type-check and production build` and `Cloudflare Pages` checks both succeeded. The same-repository auto-merge workflow run `38781056500` also succeeded.
- Cloudflare Pages preview deployment `871e4dd5-6792-4c72-8e4f-ed5a5a0c8f6e` for the feature commit passed all five stages. Its 166 returned log entries, including container logs, had no matches for warning, deprecation, error, fatal, failure, or failed terms. The build verifier reported seven published articles with downloads and no sitemap entries.
- Cloudflare Pages production deployment `90189349-695c-4042-9d43-0a8112f5d7fe` for main commit `dce850669c6de8ace67161cfec2fe70e69e4b50d` passed all five stages. Its 164 returned log entries, including container logs, had no matches for warning, deprecation, error, fatal, failure, or failed terms.
- Live verification on `https://www.walakatha.net`: all seven published article routes and their seven Markdown downloads returned HTTP 200. Every download had `text/markdown; charset=utf-8`, attachment disposition, `X-Robots-Tag: noindex, nofollow`, a link back to its canonical HTML article, and an article-end download link. `sitemap-index.xml` and `sitemap-0.xml` returned HTTP 200; the sitemap contained no `/downloads/` URLs.


