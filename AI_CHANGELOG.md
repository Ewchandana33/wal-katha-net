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

- Production main is commit 9390a592345afbfefb0a2af56df24e0bc6f0a08b (PR #74), with PR #71 article-only ReaderTools work also included. Cloudflare Pages project wala-katha is connected to Ewchandana33/wal-katha-net on main and serves walakatha.net and www.walakatha.net. Production deployment 9878e271-74d0-44ef-b9cd-00a58fff947b targets that commit; all five stages succeeded. All 174 returned logs were scanned for warning, deprecation, error, fatal, failure, and exception markers; none matched.
- A direct live SEO/locale audit on 2026-10-17 found the www homepage returns 200, the apex host redirects to www, and robots.txt plus the sitemap chain are available. All 26 URLs in sitemap-0.xml returned 200 and passed canonical, Sinhala-language, description, si-LK/x-default hreflang, and si_LK Open Graph checks; no noindex page was listed in that sitemap. The existing dedicated live verifier also checks the configured noindex article separately.
- PR #67 is the current released PDF renderer: all seven versioned production downloads returned HTTP 200 as application/pdf attachments with X-Robots-Tag noindex, nofollow. PDF.js verified the author-rights notice on each last story page, all requested rights sections on each final page, one centered URL watermark per interior page only, and footer/page numbers on all 74 pages. Production pages 12–13 of the 13-page Akkai Nangi PDF were rendered and reviewed.
- PR #62 expands the 18+ notice on every generated reader-PDF cover. Its PDF verifier passed for all seven published articles; live checks confirmed all seven SHA-256-versioned links return application/pdf attachments with X-Robots-Tag: noindex, nofollow, and the required first-page notice/story ordering. Reader PDFs remain excluded from sitemaps, and the configured bus-jack-wal-katha article remains noindex,follow.
- Latest verified Search Console keyword-sync run is `38700591415` (2026-10-15), before the 2026-10-16 PDF/cache release. Its export covers 2026-07-15–2026-10-12 (500 global queries, 394 usable queries, 46 pages); the homepage query `වැල්` had 4,075 impressions, 90 clicks, 2.21% calculated CTR, and average position 5.2 in that historical window. The post-recrawl follow-up run `38726508677` succeeded but skipped its report-PR step because its data gates were not met. These records do not demonstrate a post-release ranking or traffic effect.
- Keep the comparison gates for any later claim: Google-indexed verdict, a crawl at or after the snippet release, at least seven days after deployment, a complete 28-day post-crawl window plus three-day data lag, and at least 500 impressions in each global comparison window. Label Sri Lanka separately and directional when either window has fewer than 100 impressions.
- PageSpeed status: the 2026-10-17 mobile baseline scored 79; the distinct 2026-10-18 mobile snapshot scored Performance 87 and SEO/Accessibility/Best Practices 100, with lab LCP 3.5 s, TBT 0 ms, CLS 0. It attributed 586 ms forced reflow to Astro ClientRouter; PR #74 now excludes that asset from fresh homepage HTML. No post-PR #74 PageSpeed run is available, so a new score or measured reduction is unverified; desktop remains unverified. Prior PSI API reruns were quota-blocked with 429.
## Archive index

- archive/AI_CHANGELOG-2026-Q4.md — 39 earlier dated entries from 2026-10-14 through 2026-10-17; dated sections are retained verbatim.

## Recent entries

## 2026-10-18 — Exclude Astro ClientRouter from the initial homepage load

### Why

- The attached mobile PageSpeed snapshot attributed 586 ms of homepage forced reflow to ClientRouter. The user approved a targeted fix after the previous entry deferred this decision to avoid disrupting article-reader lifecycle behavior.

### Changes

- Base.astro now renders ClientRouter only off the homepage; article and other non-home routes keep it. The homepage build verifier now fails if the router asset appears on the homepage or is missing from an article.
- A fresh visit starting at the homepage uses native navigation; pages that load ClientRouter retain their SPA behavior. SEO markup, analytics, and Cloudflare settings are unchanged.

### Verification trail

- PR #74 auto-merged as main commit 9390a592345afbfefb0a2af56df24e0bc6f0a08b. GitHub type-check/build run 39094926581 and auto-merge run 39094926639 succeeded.
- Cloudflare preview 97fc5e49-d205-4bda-8c97-7b1d9c32e69f and production 9878e271-74d0-44ef-b9cd-00a58fff947b each completed all five stages. Each deployment returned 174 log entries; no warning, deprecation, error, fatal, failure, or exception markers matched. Both builds produced 50 pages and the homepage-performance check passed.
- Preview and live checks returned HTTP 200 for homepage and /blog/akkai-nangi-wal-katha/. Both confirm no ClientRouter asset on the homepage and ClientRouter plus data-rt-root on the article. Live robots.txt and sitemap-index.xml also returned 200.
- No PageSpeed/Lighthouse run was available after PR #74. Generated and live HTML confirm the runtime is absent from a fresh homepage response, but no new score or measured 586 ms reduction is claimed; desktop result remains unverified.

### SEO boundary

- Canonical, hreflang, metadata, robots rules, sitemap, and content were unchanged. No Google ranking outcome is claimed.
## 2026-10-18 — Re-check homepage PageSpeed after the production optimization

### Why

- The user supplied a saved PageSpeed Insights MHTML snapshot while the homepage performance optimization (PR #71) was already live. This follow-up records what that distinct snapshot verifies and which remaining diagnostics belong to other systems or have a navigation trade-off.

### Findings

- The attached snapshot URL is the mobile report ny10ywdw27; it was captured at 2026-10-18 08:14 GMT+5:30. It is not the js3jhb6qnu report ID in the URLs written in the request, so do not treat the attachment as the desktop result or as a matched rerun of the earlier 2026-10-17 report.
- Mobile Lighthouse scores are Performance 87, Accessibility 100, Best Practices 100, and SEO 100. Lab metrics: FCP 2.0 s, LCP 3.5 s, TBT 0 ms, CLS 0, and Speed Index 4.3 s.
- The report has insufficient URL-specific CrUX data. The separate origin-level 28-day data shows p75 LCP 3.7 s, INP 442 ms, and CLS 0.25 (Core Web Vitals assessment failed). These rolling origin metrics do not establish a post-release effect.
- Remaining Lighthouse diagnostics include 586 ms forced-reflow time attributed to Astro ClientRouter, a 1,001–1,051 ms critical request chain including the Cloudflare beacon and /cdn-cgi/rum, and an estimated 10 KiB of legacy JavaScript from Cloudflare utility. These are diagnostics, not failed SEO/accessibility checks. The Cloudflare utility is outside the generated app bundle; removing it may give up analytics. Removing ClientRouter would change soft navigation to full-page loads and remove route transitions, so neither change is made without an explicit product decision.
- PR #71 already removes the article-only ReaderTools bundle and comments Worker connection hints from the homepage, keeps them on article pages, and adds a build-time regression verifier. This snapshot is not a controlled before/after test; no causal score increase or Google ranking result is claimed.

### Verification status

- GitHub PR #71 is merged as production-source commit f1c7500c8c1f7c0aaf0dd76629c1a6c63eb71129. Its CI run 39090192157 and Cloudflare PR deployment 102e6bc4-5bcc-4bca-8308-7b9f52050d0c succeeded.
- Production deployment 49a9b25a-ad76-46d8-8a9b-4c46174be58b built that source commit; all five stages succeeded. All 174 log entries, including container logs, were checked for warning, deprecation, error, fatal, failure, and exception markers; none matched.
- The current homepage returns HTTP 200; the apex host redirects to the www host, and the robots and sitemap-index endpoints return HTTP 200. Live homepage HTML has the expected canonical, si-LK/x-default hreflang, si_LK Open Graph locale, and Sinhala description; it omits the ReaderTools root/bundle and comments Worker preconnect. The PR build verifier confirms article pages retain those reader/comment features.
- The most recent production Pages deployment is documentation-only deployment 434f4af7-a176-45ab-a1ba-00e82b23ff4f from main commit 2e0ca757c6a5de5ea1e4bed55f06410674e1b63e; all five stages succeeded and all 174 returned log entries had no warning/error markers.

### SEO and measurement boundary

- No app source or Cloudflare analytics setting changed in this follow-up. Search ranking cannot be guaranteed. Use a new, matching mobile/desktop PageSpeed run and a later 28-day CrUX window before attributing a performance change to PR #71.

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
- The forced-reflow finding is left unchanged to preserve client-side navigation; this change targets the measured unused article script and preconnect without changing route behavior.
- PR #71 merged automatically after GitHub Type-check and production build and Cloudflare Pages checks both completed successfully. Preview deployment 102e6bc4-5bcc-4bca-8308-7b9f52050d0c completed all five stages successfully; all 174 returned log entries, including container logs, had no warning, deprecation, error, fatal, failure, or exception markers.
- Production deployment 49a9b25a-ad76-46d8-8a9b-4c46174be58b built and deployed commit f1c7500c8c1f7c0aaf0dd76629c1a6c63eb71129; all five stages succeeded and none of its 174 returned log entries matched those markers. Live homepage and a sitemap-selected article route both returned HTTP 200. Raw HTML checks confirmed the homepage omits the reader-tools root, its JavaScript bundle, and comments preconnect, while the article retains all three.
- PageSpeed API reruns remain blocked by HTTP 429 (daily quota zero); the desktop fetcher returned the mobile-emulated report. No independent desktop score or post-release PageSpeed/CrUX change is verified.

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

