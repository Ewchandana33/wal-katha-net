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

## Status snapshot — 2026-10-18

- Production source is main commit 9b8f9441a2c2be666dc7293b854f37ac76fa5066 (PR #70). Cloudflare Pages project wala-katha is connected to Ewchandana33/wal-katha-net on main and serves walakatha.net and www.walakatha.net. Production deployment 711052b7-5f73-40c3-848e-ec6cbde32c40 targets that exact commit; queued, initialize, clone, build, and deploy stages succeeded. All 173 returned deployment-log entries were scanned for warning, deprecation, error, fatal, failure, and exception markers; none matched.
- A direct live SEO/locale audit on 2026-10-17 found the www homepage returns 200, the apex host redirects to www, and robots.txt plus the sitemap chain are available. All 26 URLs in sitemap-0.xml returned 200 and passed canonical, Sinhala-language, description, si-LK/x-default hreflang, and si_LK Open Graph checks; no noindex page was listed in that sitemap. The existing dedicated live verifier also checks the configured noindex article separately.
- PR #67 is the current released PDF renderer: all seven versioned production downloads returned HTTP 200 as application/pdf attachments with X-Robots-Tag noindex, nofollow. PDF.js verified the author-rights notice on each last story page, all requested rights sections on each final page, one centered URL watermark per interior page only, and footer/page numbers on all 74 pages. Production pages 12–13 of the 13-page Akkai Nangi PDF were rendered and reviewed.
- PR #62 expands the 18+ notice on every generated reader-PDF cover. Its PDF verifier passed for all seven published articles; live checks confirmed all seven SHA-256-versioned links return application/pdf attachments with X-Robots-Tag: noindex, nofollow, and the required first-page notice/story ordering. Reader PDFs remain excluded from sitemaps, and the configured bus-jack-wal-katha article remains noindex,follow.
- Latest verified Search Console keyword-sync run is `38700591415` (2026-10-15), before the 2026-10-16 PDF/cache release. Its export covers 2026-07-15–2026-10-12 (500 global queries, 394 usable queries, 46 pages); the homepage query `වැල්` had 4,075 impressions, 90 clicks, 2.21% calculated CTR, and average position 5.2 in that historical window. The post-recrawl follow-up run `38726508677` succeeded but skipped its report-PR step because its data gates were not met. These records do not demonstrate a post-release ranking or traffic effect.
- Keep the comparison gates for any later claim: Google-indexed verdict, a crawl at or after the snippet release, at least seven days after deployment, a complete 28-day post-crawl window plus three-day data lag, and at least 500 impressions in each global comparison window. Label Sri Lanka separately and directional when either window has fewer than 100 impressions.
- Performance baseline from the supplied 2026-10-17 PageSpeed report: mobile lab score 79; field p75 LCP 3.7 s, INP 442 ms, CLS 0.25. The report extractor returned the same mobile-emulated snapshot for the desktop URL, and direct PageSpeed API reruns were quota-blocked (429); no independent desktop score or post-change result is verified.
## Archive index

- archive/AI_CHANGELOG-2026-Q4.md — 37 earlier dated entries from 2026-10-14 through 2026-10-16; dated sections are retained verbatim.

## Recent entries

## 2026-10-18 — Scope reader tools and comment warm-up to article pages

### Why

- The PageSpeed Insights report supplied for the homepage (captured 2026-10-17) shows a mobile Lighthouse performance score of 79, with SEO, accessibility, and best practices at 100; total network transfer is 556 KiB. Its critical request chain includes the 17.50 KiB ReaderTools module, and the homepage has an unused preconnect to the comments Worker. The report also attributes 575 ms of forced reflow to Astro ClientRouter.
- Reader tools and the comments/likes API are article features, but Base.astro emitted their script and DNS/TLS hints on every route.

### Changes

- Render ReaderToolsHead and ReaderTools only when the shared layout receives isArticle=true; article reading preferences and controls remain available.
- Emit the comments Worker preconnect and dns-prefetch only on article pages, where comments and likes use that origin.
- Add scripts/verify-homepage-performance.mjs to the production build. It checks that generated homepage HTML does not render/download the reader panel or preconnect to comments, while generated article pages retain all three.
- Keep Astro ClientRouter, age gate, ad behavior, HTML content, canonical/hreflang/robots metadata, and sitemap rules unchanged. No Google ranking outcome is claimed.

### Verification status

- Baseline production Pages deployment 711052b7-5f73-40c3-848e-ec6cbde32c40 from commit 9b8f9441a2c2be666dc7293b854f37ac76fa5066 was checked; all five deployment stages succeeded. All 173 returned log entries, including container logs, were checked; no warning, deprecation, error, fatal, failure, or exception marker was found.
- The supplied mobile snapshot reports lab LCP 3.6 s, FCP 2.0 s, TBT 300 ms, CLS 0, and Speed Index 4.7 s; field-data p75 values are LCP 3.7 s, INP 442 ms, and CLS 0.25 for 2026-09-17 through 2026-10-14. These 28-day field metrics cannot confirm a new release's effect.
- Fetching the supplied desktop report URL exposed the same mobile-emulated result rather than an independent desktop run. Fresh PageSpeed API requests returned HTTP 429 because that API project's daily quota is zero. Desktop score and post-change Lighthouse/CrUX measurements therefore remain unverified.
- The forced-reflow finding is left unchanged to preserve client-side navigation; this change targets the measured unused article script and preconnect without changing route behavior. PR CI, Cloudflare preview, and production checks remain pending until they run.

## 2026-10-17 — Remove the duplicate author-rights note from story PDFs

### Root cause

- The supplied PDF screenshot shows the rights statement twice at the story ending: the Markdown blockquote is rendered as a dialogue callout, and the PDF renderer adds its own black banner. The earlier release check confirmed the banner was present but did not count duplicate statements.
- A scan of all ten story Markdown files on main found one matching end-of-story note in each source file.

### Changes

- Keep the Markdown note intact for the article's HTML; skip only the standalone Sinhala rights-note line when converting Markdown into PDF story blocks. Retain the generator-owned single black banner with white text.
- Extend the generated-PDF verifier to require exactly one complete-rights marker on the final story page for every published article PDF.
- The existing PDF cache version hashes the renderer source, so generated links automatically get a new version. No HTML metadata, canonical URLs, sitemap, or indexing rules change; reader PDFs remain noindex.

### Verification status

### Verification

- PR #69 merged to protected main as `0b8d3267ffe903c1ae2e24973af3a3ceac33dc0c` from corrected feature head `7501160af5bab4d33d1c91a15faeef0c5f7d3c10`. The first verifier draft at `9dfe175f98c249950a96c1f77fe841d8e92453e5` failed its build with `SyntaxError: missing ) after argument list`; it was repaired before merge, and that failed draft was not deployed to production.
- GitHub CI run `39025636464` passed type-check, regression and changelog tests, static build (including generated-PDF verification), pagination SEO, and homepage SEO checks.
- Cloudflare preview deployment `5c14e350-031a-4693-af53-85f90e462740` and production deployment `9f1a995a-ab69-4ea1-a38e-22a61a69831f` both completed queued, initialize, clone, build, and deploy stages successfully. All 173 log entries from each deployment, including container logs, were reviewed; neither had warning, deprecation, error, fatal, failure, or exception matches.
- The production Bus Jack article retains its Markdown rights note. Its versioned live PDF returned HTTP 200 as `application/pdf` with `X-Robots-Tag: noindex, nofollow`; text extraction found exactly one full rights marker on page 4 of 5. PyMuPDF rendering visually confirmed a single dark/black banner with white 9pt text.
- No individual story Markdown files were changed. The shared renderer automatically filters the recognized standalone Sinhala rights-note variants for current and future article PDFs; the generated-PDF verifier fails when the final story page contains anything other than exactly one complete rights marker.
- SEO boundary: this is a PDF-only correction. HTML metadata, canonical URLs, sitemap, and indexing behavior were not changed, and no Google ranking result is claimed.

## 2026-10-17 — Verify author-rights PDF release in production

### Correction and outcome

- This follow-up supersedes the pending CI/Cloudflare/live-verification status in “Add author-rights banner and complete usage terms to reader PDFs” above. The change is now merged and released; the earlier entry remains as the implementation record.

### GitHub and Cloudflare release evidence

- PR #67 merged on 2026-10-17T04:35:13Z as squash commit 858b65e81dfc9a8a14b4d8b790b3dca73165071b from feature commit 0f223e632772076ebc55da928b23961abc5465f9.
- GitHub CI run 39002856576 succeeded, including Astro type-check, regression/SEO tests, and production build. Trusted auto-merge run 39002856560 succeeded after required checks.
- Cloudflare preview deployment a615005d-bb5a-4fbe-8be5-e69df370c7b0 and production deployment 45816c70-c0fb-4109-b583-0a68a4fef204 both targeted the expected commits and completed all five stages. Each returned 173 log entries; scans found zero warning, deprecation, error, fatal, failure, or exception markers.

### Live PDF verification

- All seven live article pages link to their current SHA-256-versioned PDF; all seven downloads returned HTTP 200, application/pdf, Content-Disposition attachment, and X-Robots-Tag noindex, nofollow.
- PDF.js verified all seven released PDFs (74 pages total): the author notice is present on the last story page, every requested rights section and all six prohibited actions are on the final page, the centered watermark appears exactly once on each interior story page and not on cover/final pages, and every page retains its footer, page number, source/article links, and extractable Sinhala text.
- Production pages 12–13 of the 13-page Akkai Nangi PDF were rendered and visually reviewed; the black-and-white author banner and complete final legal page are visible, without clipping, and page numbering is intact.

### Live SEO verification

- scripts/verify-live-seo.mjs passed after deployment: homepage, sitemap chain, 26 indexable pages, corrected-article discovery in XML/image/RSS, and the configured noindex article excluded and marked noindex,follow; canonical URLs, Sinhala lang, si-LK/x-default hreflang, descriptions, and si_LK Open Graph locale all passed.
- Latest verified GSC keyword sync is still run 38700591415 (2026-10-15); the post-recrawl follow-up run 38726508677 also predates this release. There is no post-release Search Console ranking evidence, and no Google position is claimed.

## 2026-10-17 — Add author-rights banner and complete usage terms to reader PDFs

### Why

- The attached request asks for a high-contrast author-rights notice at the end of every story and a complete replacement of the final PDF rights page. The existing renderer only had a short legal summary and no highlighted end-of-story notice.

### Changes

- Add a white-text author notice in a black, white-outlined banner after the story body and before the final rights page. If the story's last page has insufficient room, place the notice on a new story page rather than clipping it.
- Replace the old final-page legal paragraphs with the requested Sinhala private-use, ownership, prohibited-actions, attribution/watermark, warning, and acknowledgment sections, including all six prohibited actions.
- Extend the generated-PDF verifier to check the notice on the last story page, required rights-section text on the final page, and that legal text and source links fit without creating an extra page. Existing watermark, footer, page numbering, noindex, attachment, source-link, and sitemap exclusion checks remain in force. The PDF cache version automatically changes because the renderer source is already part of its SHA-256 inputs.

### Verification status

- Local production build succeeded for all seven published articles; the verifier checked 74 PDF pages for the new notice and rights terms plus existing watermark/footer/page-number/header/sitemap rules.
- Local pagination SEO and homepage SEO verifiers passed. Existing unit/regression suites passed (5 + 12 tests), and cover-alt verification passed for 11 posts.
- Rendered and visually reviewed the last story page and final rights page of the 13-page Akkai Nangi PDF; the black banner is legible, the complete legal page fits, and page numbering remains intact.
- Local Astro diagnostics did not finish in the constrained sandbox and timed out while collecting diagnostics. GitHub CI type-check and PR Cloudflare preview/production deployment verification are pending; no production success is claimed yet.

### SEO boundary

- This changes generated reader PDFs only; HTML metadata, canonical URLs, robots rules, and sitemaps are not edited. The existing build verifier continues to require PDF attachment/noindex headers and exclusion from XML sitemaps. No Google ranking outcome is promised.

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
