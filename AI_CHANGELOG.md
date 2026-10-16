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

- archive/AI_CHANGELOG-2026-Q4.md — 29 earlier dated entries from 2026-10-14 through 2026-10-16; dated sections are retained verbatim.

## Recent entries

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

## 2026-10-16 — Add 18+ notice to article PDF covers

### Why

- The published PDF covers show the story-start line but leave the remaining cover space without the requested age notice.
- The PDF renderer already uses equal 46-point left and right content margins; preserve that balanced layout and keep reader PDFs non-indexable.

### Changes

- Added a centered Sinhala 18+ notice card directly below the story-start panel on every article PDF cover.
- Added a cover-space guard and made the static PDF build verifier require the notice and under-18 warning on page one of every generated article PDF. The verifier normalizes Unicode and strips whitespace, punctuation, and format separators to tolerate PDF text-extraction boundaries.

### Verification status

- Local Node.js unit/regression tests: 11 passed before the verifier matcher adjustment; rerun is pending.
- The first PR CI run 38900845384 and Cloudflare preview deployment e5a6e3af-f203-4f4e-acc4-00771cf8a7b5 failed at the new page-one notice assertion for akkai-nangi-wal-katha.pdf. The build log confirmed a verifier matching failure; no preview assets were deployed and auto-merge remained blocked.
- A local reproduction with the locked PDFKit/PDF.js versions showed that PDF.js keeps `+` as a symbol and maps some Sinhala vowel sequences differently from their source spelling. The matcher now allows the optional `+` and checks the stable 18-underage and “avoid reading” markers instead of requiring a verbatim extracted sentence.
- A local re-render using PDFKit 0.20.2 and PDF.js 5.4.149 verified the 18+ label, under-18 marker, and “avoid reading” marker on page one of all seven published PDFs; all seven also passed the cover-space guard.
- The second CI run 38901368489 still failed the earlier strict assertion; this follow-up is based on the reproduced first-page extraction. CI and preview verification are pending on the next commit; production deployment and live PDF checks remain pending, so no release success is claimed yet.

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
