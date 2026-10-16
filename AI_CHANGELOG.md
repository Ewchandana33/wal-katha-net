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

- Current production application baseline is main commit bc8e0affffe86b5a9c318c780a483384d4e6aedb (PR #58). Cloudflare Pages project wala-katha serves walakatha.net and www.walakatha.net; both custom-domain records are active. Production deployment 289c58bd-091d-49f9-9d02-68249e3f68ff (https://289c58bd.wala-katha.pages.dev) targets that exact commit and all five stages succeeded. All 173 available deployment log entries, including container logs, were scanned; no warning, deprecation, error, fatal, failure, or exception matches were found.
- The last full live SEO and Sri Lanka locale audit run 38865509323 completed successfully on earlier production commit d68d1ace5c457f2949271f322378fb97442b2bc1; it is not an audit of bc8e0affffe86b5a9c318c780a483384d4e6aedb. Direct checks of the current homepage, robots.txt, and sitemap index returned HTTP 200. The automated audit checks the homepage, robots.txt, all declared sitemaps and sitemap-listed URLs, canonical links, Sinhala document language, si-LK/x-default alternates, descriptions, indexability, and si_LK Open Graph locale.
- On the earlier production baseline d68d1ace5c457f2949271f322378fb97442b2bc1, the required PDF build verifier passed for all 7 published articles across 60 PDF pages. It checked a cover image per PDF, Sinhala text, canonical source links, a visible article-end PDF link, central watermark plus footer on every page, attachment/noindex headers, and exclusion of reader PDFs from sitemaps. Direct live checks on that baseline confirmed six sitemap-listed articles plus the configured bus-jack-wal-katha noindex article each link to a SHA-256-versioned PDF; all seven returned HTTP 200 with a valid PDF signature, embedded image, application/pdf, attachment disposition, and X-Robots-Tag: noindex, nofollow. The bus-jack HTML page remains noindex,follow and absent from sitemaps.
- Latest verified Search Console keyword-sync run is `38700591415` (2026-10-15), before the 2026-10-16 PDF/cache release. Its export covers 2026-07-15–2026-10-12 (500 global queries, 394 usable queries, 46 pages); the homepage query `වැල්` had 4,075 impressions, 90 clicks, 2.21% calculated CTR, and average position 5.2 in that historical window. The post-recrawl follow-up run `38726508677` succeeded but skipped its report-PR step because its data gates were not met. These records do not demonstrate a post-release ranking or traffic effect.
- Keep the comparison gates for any later claim: Google-indexed verdict, a crawl at or after the snippet release, at least seven days after deployment, a complete 28-day post-crawl window plus three-day data lag, and at least 500 impressions in each global comparison window. Label Sri Lanka separately and directional when either window has fewer than 100 impressions.
## Archive index

- archive/AI_CHANGELOG-2026-Q4.md — 28 earlier dated entries from 2026-10-14 through 2026-10-16; dated sections are retained verbatim.

## Recent entries

## 2026-10-16 — Add 18+ notice to article PDF covers

### Why

- The published PDF covers show the story-start line but leave the remaining cover space without the requested age notice.
- The PDF renderer already uses equal 46-point left and right content margins; preserve that balanced layout and keep reader PDFs non-indexable.

### Changes

- Added a centered Sinhala 18+ notice card directly below the story-start panel on every article PDF cover.
- Added a cover-space guard and made the static PDF build verifier require the notice and under-18 warning on page one of every generated article PDF.

### Verification status

- Local Node.js unit/regression tests: 11 passed; the full PDF/static build verifier remains pending.
- Full static build, GitHub CI, Cloudflare preview/production deployment, and live PDF verification are pending; no release success is claimed yet.

## 2026-10-16 — Repair deterministic alt-text and changelog automation

### Why

- Scheduled GitHub Actions run 38878945840 failed with ReferenceError: listPostFiles is not defined in scripts/generate-alt-text.mjs. The generator called a helper absent from that file; the verifier had a separate copy, so ordinary CI had not caught the automation failure.
- The generated changelog was appended at the file end without the repository’s five-entry/20 KiB archive rotation, and generated SEO PRs remained drafts instead of using the repository’s protected, check-gated auto-merge flow.

### Changes

- Added scripts/post-files.mjs as the single recursive Markdown discovery helper used by both the alt-text generator and verifier; added nested-file and draft-exclusion tests and wired them into required CI.
- Added scripts/ai-changelog.mjs to prepend dated entries, retain the five newest entries and 20 KiB limit, archive complete older entries by quarter, and update archive coverage/index. Added retention and duplicate-entry tests.
- Updated the deterministic alt-text workflow’s path filters and staging to include the shared helpers and archive. It now opens or updates a ready bot PR, dispatches required CI, and queues protected squash auto-merge; it never writes directly to main.

### Verification

- Local Node.js 24 run: all 6 tests passed (the 4 existing policy tests and 2 new regression tests). A fixture run discovered and repaired 2 posts, then the full alt-text validator passed.
- GitHub PR #58 merged at 2026-10-16T10:52:01Z as commit bc8e0affffe86b5a9c318c780a483384d4e6aedb; head commit was de891202255ae09ee652836fdadc64abc16ebdf7. CI run 38889820710 and trusted auto-merge run 38889818253 succeeded. CI passed the new regression tests, post cover-alt verifier, static build, and homepage/pagination SEO verifiers.
- Cloudflare preview deployment da673f06-d5ab-4863-97c4-622b990c98c6 and production deployment 289c58bd-091d-49f9-9d02-68249e3f68ff both completed all five stages. All 173 log entries for each deployment, including container logs, were scanned; no warning, deprecation, error, fatal, failure, or exception matches were found.
- GitHub did not show a path-filtered push run for the GITHUB_TOKEN-authored auto-merge. I dispatched the deterministic alt-text workflow on the exact merged main commit; run 38890364296 succeeded, generation and validation steps passed, and the PR-opening step was skipped because no labels needed changes. The PR CI and Cloudflare preview had already validated the same source tree before merge.

## 2026-10-16 — Verify PR #57 reader-PDF release

### Correction to the pending status in “Book-style Sinhala reader PDFs and closing rights page”

- This entry supersedes that entry’s pending verification status; the earlier note remains as the record of the initial PR state.
- PR #57 merged to main as commit 08ba9be504162867f4ee6b6467159c6389a9806e. The first CI run, 38882638409, failed because the PDF verifier did not detect the final usage-rights page; follow-up run 38883150185 passed, and auto-merge run 38883146788 succeeded.
- Cloudflare PR preview deployment 0347a236-d929-41f8-b454-9a6e6f7c292f succeeded at https://0347a236.wala-katha.pages.dev. Production deployment 65e32337-7d59-4da5-8016-a95acd1243f9 targets the merge commit; all five stages succeeded. All 173 available production deployment log entries were scanned with no warning, deprecation, error, fatal, failure, or exception matches.
- Live homepage, robots.txt, and sitemap index returned HTTP 200. The live Wanamalee PDF returned HTTP 200 as application/pdf, is 450,228 bytes, has 23 pages, and is marked X-Robots-Tag: noindex, nofollow. Rendered pages 1, 2, and 23 were visually checked: cover, story layout, watermark/page numbering, and final rights notice are present.
- The last full SEO/locale audit remains run 38865509323 on the earlier d68d1ace5c457f2949271f322378fb97442b2bc1 release; no Google rank or traffic improvement is claimed.

## 2026-10-16 — Book-style Sinhala reader PDFs and closing rights page

### Why

- The existing PDF cover rendered portrait artwork as a short landscape strip, and PDFs had no separate closing-use notice. The reader edition needs a real cover, consistent dark book styling, and a final rights reminder without changing story text or existing watermarks/links.

### Changes

- Rebuilt `src/lib/articlePdf.ts` around a large, aspect-preserving cover frame, dynamic title/date/source metadata, dark pages and charcoal cards with red borders, red heading accents, justified Sinhala body text with 1.9-style leading, and quote/block-quote dialogue panels. Native JPEG/PNG cover bytes are embedded unchanged; other supported formats are converted losslessly without cropping or watermark removal.
- Added a dedicated final page explaining personal reading use and that reproduction, modification, republication, distribution, public posting, or sale needs prior written permission from the applicable rights holder. This is a notice, not DRM or a claim of ownership.
- Kept the exact site watermark and source URL, with center watermark and footer on every page. Footer numbering remains `n / total` and now counts the separate cover and final page.
- Extended `scripts/verify-post-downloads.mjs` to require the branded cover metadata, page numbering, per-page watermark/footer, and final notice on every generated article PDF.

### Verification status

- GitHub CI, Cloudflare preview, PDF visual review, and production deployment verification are pending for this PR; no release success is claimed yet.

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
