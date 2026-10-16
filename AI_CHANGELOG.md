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

## Status snapshot — 2026-10-16

- Current production baseline is main commit `d68d1ace5c457f2949271f322378fb97442b2bc1` (PR #55). Cloudflare Pages project `wala-katha` serves `walakatha.net` and `www.walakatha.net`; both custom-domain records are active. Production deployment `e6dba80d-92ba-4449-9a9f-7af8c2ed0d80` targets that exact commit and all five stages succeeded. All 173 available deployment log entries, including container logs, were scanned; no warning, deprecation, error, fatal, failure, or exception matches were found.
- GitHub's live SEO and Sri Lanka locale audit run `38865509323` completed successfully on the production commit. The automated audit checks the homepage, robots.txt, all declared sitemaps and sitemap-listed URLs, canonical links, Sinhala document language, `si-LK`/`x-default` alternates, descriptions, indexability, and `si_LK` Open Graph locale.
- Production's required PDF build verifier passed for all 7 published articles across 60 PDF pages. It checked a cover image per PDF, Sinhala text, canonical source links, a visible article-end PDF link, central watermark plus footer on every page, attachment/noindex headers, and exclusion of reader PDFs from sitemaps. Direct live checks confirmed six sitemap-listed articles plus the configured `bus-jack-wal-katha` noindex article each link to a SHA-256-versioned PDF; all seven returned HTTP 200 with a valid PDF signature, embedded image, `application/pdf`, attachment disposition, and `X-Robots-Tag: noindex, nofollow`. The `bus-jack` HTML page remains `noindex,follow` and absent from sitemaps.
- Latest verified Search Console keyword-sync run is `38700591415` (2026-10-15), before the 2026-10-16 PDF/cache release. Its export covers 2026-07-15–2026-10-12 (500 global queries, 394 usable queries, 46 pages); the homepage query `වැල්` had 4,075 impressions, 90 clicks, 2.21% calculated CTR, and average position 5.2 in that historical window. The post-recrawl follow-up run `38726508677` succeeded but skipped its report-PR step because its data gates were not met. These records do not demonstrate a post-release ranking or traffic effect.
- Keep the comparison gates for any later claim: Google-indexed verdict, a crawl at or after the snippet release, at least seven days after deployment, a complete 28-day post-crawl window plus three-day data lag, and at least 500 impressions in each global comparison window. Label Sri Lanka separately and directional when either window has fewer than 100 impressions.
## Archive index

- archive/AI_CHANGELOG-2026-Q4.md — 25 earlier dated entries from 2026-10-14 through 2026-10-15; dated sections are retained verbatim.

## Recent entries

## 2026-10-16 — Correct stale article-PDF cache and version download URLs

### Correction to Embed post cover images in article PDFs

- This entry supersedes that earlier entry’s pending release-verification status while retaining it as the record of the implementation decision. PR #54 merged into main as 8e9bd33c08fccde800d463cef52b36c951436661; GitHub CI run 38852608136 and the Cloudflare Pages PR check passed.
- Preview deployment 2955a436-8103-4b4b-b480-2a7a7d04979a and production deployment b555c637-b415-434d-892f-8f24786b9fc8 for the cover-image change passed all five Cloudflare stages. All 173 available log entries for each deployment were checked; neither contained warning, deprecation, error, fatal, or failure matches.
- The unique production deployment served all seven new cover-image PDFs, but the custom domain intermittently returned older cached bytes for stable PDF URLs. Those responses were Cloudflare cache hits with a one-year Cache-Control max-age; changing query strings returned the new output. A first exact-file purge of three stale paths was followed by another stale bus-jack response, so the final purge covered all seven PDF URLs.
- After the seven-URL purge, live checks returned HTTP 200 for all seven PDFs; each had a %PDF- signature and one embedded cover-image object. This is direct live-output verification, not merely a deployment-build result.

### Durable cache-version fix

- The article-end PDF link now receives a SHA-256 query version derived from the exact article title/body/date/source URL, cover-image path and bytes, PDF generator and route sources, Sinhala font, and locked dependencies. Updating a story, image, generator, font, or dependency automatically produces a different URL, avoiding reuse of an old long-lived cache key.
- The build verifier now fails if any published article is missing its 64-character versioned PDF link; existing PDF image, watermark/footer, Sinhala text, source URL, attachment/noindex, and sitemap checks remain.
- This does not change canonical HTML, PDF noindex policy, or sitemap inclusion. No Google ranking or traffic increase is claimed.

### Cache-version change release status

- PR #55's initial CI and preview attempt failed in the post-build SHA-256 link verifier because its regular-expression escaping was lost inside a template literal. The verifier was corrected to use a literal URL-prefix check plus a 64-hex SHA-256 assertion.
- The correction head `d1d7e37ed05e24bc425bd97979d5a52b6e26c21d` passed GitHub CI run `38854295284`; PR #55 merged at 2026-10-16T05:10:59Z as main commit `d68d1ace5c457f2949271f322378fb97442b2bc1`. The previous failed run is retained here as history, not the current status.
- Cloudflare Pages production deployment `e6dba80d-92ba-4449-9a9f-7af8c2ed0d80` for that main commit completed successfully: queued, initialize, clone_repo, build, and deploy all succeeded. All 173 available logs, including container logs, were checked; no warning, deprecation, error, fatal, failure, or exception matches were found.
- The deployed build verifier passed 7 published articles across 60 PDF pages, confirming embedded cover images, extractable Sinhala text, canonical source links, versioned article-end links, central watermark plus footer on every page, attachment/noindex headers, and sitemap exclusion. Live verification then passed all 7 article PDFs on the custom domain: six indexable routes from the sitemap and the configured `bus-jack-wal-katha` noindex route. Every page linked to a SHA-256-versioned PDF; all downloads returned HTTP 200, valid PDF signatures, an embedded image, `application/pdf`, attachment disposition, and `X-Robots-Tag: noindex, nofollow`.
- The live SEO/Sri Lanka locale workflow run `38865509323` also completed successfully against the deployed main commit. These checks establish build, deployment, download, and technical metadata status; they do not guarantee or claim a Google ranking improvement.## 2026-10-16 — Embed post cover images in article PDFs

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
