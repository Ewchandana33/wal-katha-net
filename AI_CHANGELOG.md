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

- Current production application commit is a5f03e34d99794603897ad40509516889c03762b (PR #62). Cloudflare Pages project wala-katha serves walakatha.net and www.walakatha.net; both custom-domain records are active. Production deployment ceba01ac-4184-4de0-b9e1-7dc5c5256080 targets that exact commit and all five stages succeeded. All 173 available deployment log entries, including container logs, were scanned; no warning, deprecation, error, fatal, failure, or exception matches were found.
- The live SEO/Sri Lanka locale verifier passed on 2026-10-16 after this release: homepage, robots.txt, the sitemap chain, and 26 indexable URLs passed canonical, Sinhala-language, si-LK/x-default hreflang, description, indexability, and si_LK Open Graph checks. It also confirmed that the configured noindex article is excluded from feeds and marked noindex,follow.
- PR #62 expands the 18+ notice on every generated reader-PDF cover. Its PDF verifier passed for all seven published articles; live checks confirmed all seven SHA-256-versioned links return application/pdf attachments with X-Robots-Tag: noindex, nofollow, and the required first-page notice/story ordering. Reader PDFs remain excluded from sitemaps, and the configured bus-jack-wal-katha article remains noindex,follow.
- Latest verified Search Console keyword-sync run is `38700591415` (2026-10-15), before the 2026-10-16 PDF/cache release. Its export covers 2026-07-15–2026-10-12 (500 global queries, 394 usable queries, 46 pages); the homepage query `වැල්` had 4,075 impressions, 90 clicks, 2.21% calculated CTR, and average position 5.2 in that historical window. The post-recrawl follow-up run `38726508677` succeeded but skipped its report-PR step because its data gates were not met. These records do not demonstrate a post-release ranking or traffic effect.
- Keep the comparison gates for any later claim: Google-indexed verdict, a crawl at or after the snippet release, at least seven days after deployment, a complete 28-day post-crawl window plus three-day data lag, and at least 500 impressions in each global comparison window. Label Sri Lanka separately and directional when either window has fewer than 100 impressions.
## Archive index

- archive/AI_CHANGELOG-2026-Q4.md — 33 earlier dated entries from 2026-10-14 through 2026-10-16; dated sections are retained verbatim.

## Recent entries

## 2026-10-17 — Restrict the centered PDF watermark to story pages

### Why

- The user clarified the original requirement: the cover-image page and final rights page must not have the large centered URL watermark, while every story page between them must retain it. PR #64 raised the interior watermark to 30% but left a faint 18% centered watermark on the cover and final page.
- The live PDF review confirmed this mismatch in three production PDFs (13, 5, and 23 pages; 41 pages total). The existing cover artwork, source attribution, and repeated footer URL are separate elements and should remain intact.

### Changes

- Draw the centered URL watermark only on pages tracked as story/content pages, at the existing 30% opacity. Do not draw it on the cover or final rights page.
- Strengthen the build-time PDF verifier to require exactly one centered watermark on every interior page, none on the first/final page, and the existing footer URL on every page.
- Preserve PR #64's historical entry; apply the active-log five-entry/20 KiB rotation policy.

### Verification status

- Before this follow-up, the live sample PDFs returned HTTP 200 as application/pdf and X-Robots-Tag: noindex, nofollow. The 13-page, 5-page, and 23-page files were checked across all 41 pages: the centered watermark appeared on every page at 18% on the cover/final page and 30% on interior pages. Pages 1, 7, and 13 of the 13-page PDF were rendered and visually reviewed.
- PR #65 merged at 2026-10-17T03:28:45Z as commit 098d654405032ad3c4ba7eb03e3b8a98bde955b9. The Type-check and production build check (GitHub Actions run 38998719644) and Cloudflare Pages PR check succeeded.
- Cloudflare preview deployment 806aac5e-d3d9-40fe-b364-b4ed5d055579 and production deployment a3dbc699-120c-4fb5-8ac7-31711abdaf53 completed all five stages successfully. All 173 returned log entries for each deployment, including container logs, were scanned; no warning, deprecation, error, fatal, failure, or exception matches were found.
- The post-deploy Akkai Nangi production PDF (13 pages) returned HTTP 200 as application/pdf with X-Robots-Tag: noindex, nofollow. PDF.js checks confirmed zero centered 22pt URL watermarks on pages 1 and 13, exactly one on pages 2–12, and the 8pt footer URL plus page number on all 13 pages. PyMuPDF confirmed 30% opacity on every interior centered watermark.
- Production pages 1, 7, and 13 were rendered and visually reviewed; the requested cover/final-page removal and interior-page watermark are confirmed.

### SEO boundary

- This changes PDF rendering and its build verifier only. HTML metadata, canonical URLs, sitemap, and indexing rules are unchanged; no Google ranking outcome is claimed.

## 2026-10-16 — Improve interior-page PDF watermark visibility

### Why

- A live 13-page article PDF showed that the center watermark was generated on every page, but story pages used only 18% opacity and the watermark sat over dense text. The cover and final rights page also contain separate, fully opaque URL text, making the middle-page watermark look absent by comparison.

### Changes

- Track each generated page role and render the centered watermark at 30% opacity on story/content pages while preserving 18% on the cover and final rights page.
- Keep the page footer, page numbering, exact site URL, existing PDF noindex behavior, and the all-pages watermark verification unchanged.

### Verification status

- Baseline live PDF returned HTTP 200 as application/pdf. Rendered pages 1, 7, and 13: the centered watermark exists on all three, but content pages were visibly much fainter than the extra cover/rights URL labels.
- Local diff and build checks, PR CI, Cloudflare preview/production deployment, deployment-log review, and post-release PDF rendering are pending.

### SEO boundary

- No canonical HTML, metadata, sitemap, or indexing behavior changes are intended. Reader PDFs remain noindex and excluded from sitemaps; no Google ranking result is guaranteed.

## 2026-10-16 — Verify expanded first-page age notice production release

### Correction to the pending status in “Expand the first-page PDF age notice”

- This entry supersedes that entry’s pending verification status while preserving its implementation notes and initial failures as historical context.
- The first three PDF extraction assertions exposed Sinhala font-mapping differences rather than missing visible notice content: PDF.js/Poppler reorder vowel signs or substitute glyph text, including in the adult-audience phrase and story-start line. The verifier now uses stable Sinhala anchors and still requires every notice section plus story-start-after-notice ordering. Rendered page one was visually checked.

### Verification

- PR #62 merged to protected main as a5f03e34d99794603897ad40509516889c03762b; feature head was 678495955875ded2bd06d036499d93079b49ffe2. GitHub CI run 38912470940 passed type-check, regressions, all seven generated-PDF notice/fit checks, static build, pagination SEO, and homepage SEO.
- Cloudflare preview deployment ee740317-8d6e-4965-aa48-9682581a59cb and production deployment ceba01ac-4184-4de0-b9e1-7dc5c5256080 each passed all five stages. All 173 log entries per deployment, including container logs, were scanned with zero warning, deprecation, error, fatal, failure, or exception matches.
- Post-release node scripts/verify-live-seo.mjs passed: 26 indexable pages, sitemap/feeds, canonicals, Sinhala language, si-LK locale metadata, and the configured noindex article checks.
- All seven live SHA-256-versioned article-PDF links, including the configured noindex article, returned HTTP 200 application/pdf attachments with X-Robots-Tag: noindex, nofollow. Page-one 18+ title, under-18 and avoid-reading notices, legal confirmation, and story-start-after-notice ordering passed. One live A4 cover was raster-rendered and visually checked for the warning icon, notice layout, ordering, and fit.
- Local node --check, git diff --check, and the AI changelog retention test passed. The retention utility archived the oldest dated entry without splitting or rewriting it.

### SEO boundary

- The PDF change does not alter indexable HTML. Technical SEO/locale checks pass, but Google rankings are not guaranteed. No new Search Console performance window was available; the latest repository snapshot remains the 2026-10-15 run covering data through 2026-10-12.

## 2026-10-16 — Expand the first-page PDF age notice

### Why

- The prior PDF release includes only a short 18+ warning, while the requested notice must identify the fictional adult nature of the work, warn minors, clarify parental responsibility and fictionality, and confirm lawful adult access.
- The story-start marker currently appears above the notice. It must follow the complete notice at the bottom of the first page.

### Changes

- Replaced the short warning with the requested Sinhala title and all four full paragraphs in a high-contrast, bordered notice card. A vector warning icon keeps the symbol legible with the embedded Sinhala font.
- Reserved cover space for the larger notice, added a first-page fit guard, and moved “මෙතැන් සිට කතාව නිල වශයෙන් ආරම්භ වේ” immediately below the notice.
- Extended the production PDF verifier to check representative text from every requested paragraph and the ordering of the story-start marker after the complete notice.

### Verification status

- Baseline before this change: main commit 8256791c79fc922aa702b97d954613bdaf453fa9; Cloudflare production deployment 41fa8fc0-febc-469f-bc1e-9475e593056b passed all five stages. All 173 returned logs, including container logs, were scanned with no warning, deprecation, error, fatal, failure, or exception matches.
- The live SEO/Sri Lanka locale audit passed on the pre-change baseline: 26 indexable URLs, one sitemap chain, canonical and locale metadata, and the configured noindex article checks.
- This entry’s pending verification status is superseded by the dated “Verify expanded first-page age notice production release” entry below. The first strict PDF-extraction checks exposed Sinhala font-mapping variants; the final CI verifier accepts the verified stable anchors while preserving first-page and notice/story order checks.

### SEO boundary

- This change affects downloadable reader PDFs, which remain noindex and excluded from sitemaps. Canonical HTML and Sri Lankan locale metadata are unchanged. No Google ranking improvement is promised.

## 2026-10-16 — Verify 18+ PDF notice production release

### Why

- The implementation entry stayed pending while CI, Cloudflare Pages, and the live-PDF checks were running. This entry records the final evidence and supersedes that pending status.

### Verification

- PR #60 merged as bfcc113db0c8643cf19626f24d2b8669ba7ebfae from feature commit 5c12e332d0cccce556dfa706ff4f7f3dbae05e5c.
- GitHub CI run 38902226065 passed: type-check, regression tests, complete static build, post-download verifier, and homepage/pagination SEO checks.
- Cloudflare preview deployment 85ac0f0d-244e-4b01-be64-1132b4b30105 and production deployment a08e9deb-0637-44ae-9705-19b56bb16f52 each passed all five stages. Each deployment returned 173 logs (including container logs) with zero warning/error/fatal/failure/exception matches.
- Verified all seven production PDFs and their article-page SHA-256-versioned links. Each PDF returned HTTP 200 as an attachment with application/pdf and X-Robots-Tag: noindex, nofollow; page one contains the 18+ label, under-18 marker, and “avoid reading” warning.
- Purged only the seven stable unversioned PDF URLs from Cloudflare after a warm edge served an old Wanamalee file. Rechecked all seven stable URLs; they now return the updated PDF with the notice.
- The PDF renderer keeps equal 46-point left and right story margins; the new notice card stays within the first-page cover area.
