was reported.
- The Search Console snapshot currently in `src/data/gsc-keywords.json` was generated at `2026-10-15T07:42:57Z` for `2026-07-15` through `2026-10-12` (three-day data lag). It predates the homepage snippet release on `2026-10-15`; therefore there is not yet a valid post-release CTR comparison or evidence of a ranking change.
- `Sync GSC Keywords` already runs on a weekly schedule (Mondays at 04:00 UTC). Allow later snapshots and Google recrawl data to mature before evaluating the `වැල්` homepage query; technical-audit success is not a ranking or CTR guarantee. This audit found no verified issue requiring another source-code or metadata change.




## 2026-10-15 — Automated post-recrawl homepage CTR measurement

### Scope and safeguards
- The existing weekly `Sync GSC Keywords` workflow remains scheduled for Mondays at 04:00 UTC. This adds a separate homepage experiment follow-up at 05:00 UTC, avoiding duplicate keyword-sync work.
- The monitor is scoped to the homepage query `වැල්` and the snippet release on 2026-10-15. Its pre-release baseline is 2026-09-15 through 2026-10-12. It uses Google URL Inspection to require an indexed verdict and a crawl at or after release, waits at least seven days after deployment, then measures a 28-day post-crawl window with a three-day Search Console data lag.
- A report is written only when the comparison is complete and each global window has at least 500 impressions. A Sri Lanka (`LKA`) segment is reported separately and labeled directional below 100 impressions in either window. Until then, the action writes only a pending status to its job summary and leaves the changelog untouched.
- The action uses the existing `GOOGLE_INDEXING_KEY` / `GSC_SERVICE_ACCOUNT_JSON` secret and optional `GSC_SITE_URL` repository variable; no credential values are read, printed, or changed.

### Automation and validation design
- A ready report is committed on `bot/gsc-ctr-followup`, submitted as a PR, and queued for squash auto-merge. Protected `main` is never directly pushed. The existing keyword-sync workflow now explicitly dispatches the CI workflow on its bot PR head because a `GITHUB_TOKEN`-created PR does not itself trigger `pull_request` workflows; Cloudflare Pages continues to build the preview independently.
- The focused date-window and metric tests are added to the required CI workflow. CTR percentage-point values are rounded to two decimals and relative changes to one decimal to keep reports stable across Node versions; this also fixes an exact floating-point assertion that failed under Node 24.
- The monitor records Search Console observations only; it does not auto-edit titles/content and does not claim that an observed CTR or position change was caused by the snippet change. Rankings cannot be guaranteed.

### Current status
- The latest verified Search Console snapshot still ends 2026-10-12, before the 2026-10-15 release. No post-release recrawl or comparable post-window result is claimed. The weekly action will keep checking and create a report PR only when Google crawl and data-volume conditions are satisfied.

## 2026-10-15 — PR #46 merged and production verification

- GitHub PR #46 (deterministic, safe cover-alt automation) was merged into `main` as merge commit `8e6fedb39f6ce0d71753a9a91358ecc757a86613`. The PR-head CI run `38741039658` completed successfully; its Type-check and production build job passed. The Cloudflare Pages preview check on PR head `37e3a4686a6051df24599dea36aed1029337a240` also succeeded.
- Cloudflare Pages production deployment `2fac97fa-c54e-4e49-ac24-b1004394aeac` was triggered by that exact `main` merge commit. All five stages (queued, initialize, clone_repo, build, deploy) succeeded. All 156 fetched deployment-log entries, including container logs, were scanned for warning, deprecation, error, fatal, failure, and failed terms; none matched.
- Direct live checks returned HTTP 200 for the homepage, `/robots.txt`, `/sitemap-index.xml`, `/sitemap-0.xml`, and `/rss.xml`. A live crawl of all 26 URLs in the current sitemap returned HTTP 200 for every page; each had a canonical URL, `lang=si`, and `hreflang=si-LK`, and no rendered image had an empty/missing alt attribute.
- This post-merge record supersedes the earlier pre-merge/draft status above; that historical note is retained to preserve the decision timeline. Technical crawl and accessibility checks do not guarantee Google indexing, rankings, or a top position. No post-release Search Console ranking/CTR change is claimed here.

## 2026-10-15 — AI changelog archive policy and Q4 history cleanup

### Why

AI_CHANGELOG.md had grown to nearly 50 KiB, with 22 dated records. A shorter active file makes current instructions and status easier for future AI agents to find without losing release evidence.

### Changes

- Added explicit AI-maintainer instructions for reading current state, recording verified changes, handling superseded notes, protecting credentials, and avoiding ranking guarantees.
- Defined a retention policy: keep the newest five dated entries and target no more than 20 KiB in the active log; move older whole entries to a quarter-based archive, preserving their text and updating the archive index.
- Moved 18 complete older records dated 2026-10-14 through 2026-10-15 verbatim to archive/AI_CHANGELOG-2026-Q4.md; retained the four newest prior records and this new entry in the active log.
- Recorded the current GSC follow-up gates and noted that a post-release comparison is not yet available. The latest checked workflow run was pre-release and skipped its report-PR step.

### Verification

- Source log was split at dated section headings; 18 older entries were moved and four prior newest entries retained without editing their text.
- Pre-write validation counted 22 dated entries, preserved the newest four complete records, and verified the 18 older sections without modifying their text.
- The documentation PR must pass the repository-required Type-check and production build and Cloudflare Pages preview checks before merge; their final outcomes are verified from GitHub and Cloudflare.

## 2026-10-15 — Replace credential-dependent alt-text workflow

### Findings
- The previous scheduled alt-text run (GitHub Actions run 38712121159) was marked successful but logged zero Gemini keys and skipped generated-content validation and PR creation. It was a successful no-op, not an alt-text repair.
- The repository currently has 11 post cover images: 9 existing alt labels were keyword/brand-stuffed or unsafe for their titles, and 2 were missing. No post supplies an image_keyword seed.
- The production baseline before this change is Cloudflare Pages deployment d32c12de-0636-4171-9cf8-ccf736b6d1ea for main SHA 5c56696583bbdea46978eb0988190395724bacfb. Its five deployment stages succeeded; the 156 fetched log entries contained no warning/error/failure matches. This does not verify the pending change.

### Changes
- Replaced the Gemini-dependent generator with a deterministic, Node built-in-only policy. It reads only post title/image frontmatter, does not call an image model or Search Console, does not consume keyword seeds, and does not infer unseen image details.
- All 11 current cover labels are normalized. Age-sensitive or explicit/age-uncertain titles receive the neutral generic label; other safe titles get concise title-derived labels. The policy rejects missing, branded, sensitive, or overlong values.
- Removed the unused image_keyword content-schema seed and added unit tests plus a recursive cover-alt validator to required CI.
- Reworked the scheduled/on-content workflow to use Node 24 and current repository action versions, validate before publishing, push only to the automation-owned bot/deterministic-alt-text branch, open/update a draft PR, and dispatch required CI on the PR head.
- Pinned required CI to ubuntu-24.04 after GitHub's runner-migration notice so builds do not silently change runner generation.

### Review and deployment boundary
- Verification of the initial code commit 2aef04fa6f6a52f54fb0350fb28886e2687f8c37 passed in both GitHub CI runs 38739689207 and 38739666097, including type-check/build, alt-policy tests, and the 11-cover validator. Cloudflare preview deployment 25f5c40c-3f0c-4975-a47f-a41af300a917 (https://25f5c40c.wala-katha.pages.dev) passed all five stages; its 158 fetched log lines had no warning/error/failure/deprecation matches. Seven rendered post routes returned HTTP 200 and their own cover labels matched the expected safe values; CI validated all 11 cover entries. GitHub also emitted one notice on this prior head: the CI workflow used ubuntu-latest, scheduled to move to Ubuntu 26 on 2026-10-19. This follow-up pins CI to ubuntu-24.04 to eliminate that implicit runner migration; its new checks/preview are re-run before approval.
- The PR remains draft. This automation does not merge or deploy production; protected main and the live site remain unchanged until explicit approval.
- Technical metadata hygiene can improve accessibility and crawl quality but cannot guarantee Google rankings. Historical notes are retained; this entry supersedes prior Gemini-based alt-workflow status.

## 2026-10-15 — Automated deterministic cover-alt repair

- Repaired 11 cover alt value(s): Akkai-Nangi-wal-katha, Bus-jack-wal-katha, Mage-Nangi-wal-katha, Nimali-saha-boss, School-Wal-Katha, gedara-driver-wal-katha, methsala-akka-wal-katha, nandage-duwa-wal-katha, nethuge-wal-katha, thaththa-duwa-wal-katha, wanamalee-wal-katha.
- Used neutral title-derived labels; age-sensitive or explicit titles receive a generic fallback. No image model, API key, GSC query, or keyword seed is used.
- The workflow validates all cover labels, opens or updates a PR, dispatches required CI on the PR head, and leaves the PR in draft for review; production merge requires explicit approval.

## 2026-10-15 — GSC query triage and production-state refresh

### Search Console query evidence

- Read the repository's generated Search Analytics export for sc-domain:walakatha.net (generated 2026-10-15T07:42:57.643Z; 2026-07-15–2026-10-12; 500 global queries, 394 usable, 46 pages). Global rows may combine web and image search; do not treat blended average positions as web-only rankings.
- Highest-volume Sinhala query rows in the global export: වල් කතා — 21,880 impressions, 5,172 clicks, 23.64% CTR, average position 3.3; වැල කතා — 7,926 impressions, 2,476 clicks, 31.24% CTR, average position 1.9; සිංහල වැල් — 5,074 impressions, 303 clicks, 5.97% CTR, average position 4.1. These are observed query metrics, not ranking guarantees.
- Page-level evidence for homepage query වැල් is 4,075 impressions, 90 clicks, 2.21% calculated CTR, average position 5.2 (web source). For සිංහල වැල්, the export assigns 4,468 impressions / 267 clicks / position 28.9 to / and 658 impressions / 35 clicks / position 4.8 to /page/2/; both include web and image sources. This mixed page mapping is not sufficient evidence to retarget the homepage or rewrite pagination metadata.

### Decision and scope

- src/pages/index.astro already contains the GSC-informed homepage title and description for the වැල් query. The existing post-recrawl monitor checks whether Google re-crawls the released snippet and waits for comparable data; another title edit now would reset the measurement start and weaken the comparison.
- No application source, metadata, or keyword seed was changed in this audit. Keep the existing monitor and use the next query export to choose any route-specific action after separating web from image search and checking page-level intent. No Search Console credentials were read or changed.

### Verified state before this changelog update

- PR #48 merged as main commit 2b3278653ef307e0bd8d3282094efddde3e9f8b8. Its CI run 38749000165 and trusted auto-merge run 38749000658 both completed successfully.
- Cloudflare Pages production deployment 8a08ed45-d61f-4595-af42-2bcce4d83c2b corresponds to that exact commit. All five stages succeeded; all 158 returned deployment-log entries were checked and none matched warning, deprecation, error, fatal, or failure terms.
- Sync GSC Keywords run 38700591415 succeeded on main and committed the export described above. The post-recrawl monitor run 38726508677 succeeded, but the report-PR step was skipped while its recrawl and sample-size gates were unmet. The latest Live SEO and Sri Lanka locale audit run checked was 38725657543 and completed successfully.
- Earlier same-day GSC sync attempts did include failures; they are not represented as successes. The later successful main-branch sync and committed export establish the current data state, not that every historical run passed.

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

## 2026-10-16 — Verify PR #57 reader-PDF release

### Correction to the pending status in “Book-style Sinhala reader PDFs and closing rights page”

- This entry supersedes that entry’s pending verification status; the earlier note remains as the record of the initial PR state.
- PR #57 merged to main as commit 08ba9be504162867f4ee6b6467159c6389a9806e. The first CI run, 38882638409, failed because the PDF verifier did not detect the final usage-rights page; follow-up run 38883150185 passed, and auto-merge run 38883146788 succeeded.
- Cloudflare PR preview deployment 0347a236-d929-41f8-b454-9a6e6f7c292f succeeded at https://0347a236.wala-katha.pages.dev. Production deployment 65e32337-7d59-4da5-8016-a95acd1243f9 targets the merge commit; all five stages succeeded. All 173 available production deployment log entries were scanned with no warning, deprecation, error, fatal, failure, or exception matches.
- Live homepage, robots.txt, and sitemap index returned HTTP 200. The live Wanamalee PDF returned HTTP 200 as application/pdf, is 450,228 bytes, has 23 pages, and is marked X-Robots-Tag: noindex, nofollow. Rendered pages 1, 2, and 23 were visually checked: cover, story layout, watermark/page numbering, and final rights notice are present.
- The last full SEO/locale audit remains run 38865509323 on the earlier d68d1ace5c457f2949271f322378fb97442b2bc1 release; no Google rank or traffic improvement is claimed.

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

## 2026-10-17 — Verify author-rights PDF release in production

### Correction and outcome

- This follow-up supersedes the pending CI/Cloudflare/live-verification status in “Add author-rights banner and complete usage terms to reader PDFs” above. The change is now merged and released; the earlier entry remains as the implementation record.

### GitHub and Cloudflare release evidence

- PR #67 merged on 2026-10-17T04:35:13Z as squash commit 858b65e81dfc9a8a14b4d8b790b3dca73165071b from feature commit 0f223e632772076ebc55da928b23961abc5465f9.
- GitHub CI run 39002856576 succeeded, including Astro type-check, regression/SEO tests, and production build. Trusted auto-merge run 39002856560 succeeded after required checks.
- Cloudflare preview deployment a615005d-bb5a-4fbe-8be5-e69df370c7b0 and production deployment 45816c70-c0fb-4109-b583-0a68a4fef204 both targeted the expected commits and completed all five stages. Each returned 173 log entries; scans found zero warning, deprecation, error, fatal, failure, or exception matches.

### Live PDF verification

- All seven live article pages link to their current SHA-256-versioned PDF; all seven downloads returned HTTP 200, application/pdf, Content-Disposition attachment, and X-Robots-Tag noindex, nofollow.
- PDF.js verified all seven released PDFs (74 pages total): the author notice is present on the last story page, every requested rights section and all six prohibited actions are on the final page, the centered watermark appears exactly once on each interior page and not on cover/final pages, and every page retains its footer, page number, source/article links, and extractable Sinhala text.
- Production pages 12–13 of the 13-page Akkai Nangi PDF were rendered and visually reviewed; the black-and-white author banner and complete final legal page are visible, without clipping, and page numbering is intact.

### Live SEO verification

- scripts/verify-live-seo.mjs passed after deployment: homepage, sitemap chain, 26 indexable pages, corrected-article discovery in XML/image/RSS, and the configured noindex article excluded and marked noindex,follow; canonical URLs, Sinhala lang, si-LK/x-default hreflang, descriptions, and si_LK Open Graph locale all passed.
- Latest verified GSC keyword sync is still run 38700591415 (2026-10-15); the post-recrawl follow-up run 38726508677 also predates this release. There is no post-release Search Console ranking evidence, and no Google position is claimed.

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
- PR #71 merged automatically after GitHub Type-check and production build and Cloudflare Pages checks both completed successfully. Preview deployment 102e6bc4-5bcc-4bca-8308-7b9f52050d0c completed all five stages successfully; all 174 log entries, including container logs, had no warning, deprecation, error, fatal, failure, or exception markers.
- Production deployment 49a9b25a-ad76-46d8-8a9b-4c46174be58b built and deployed commit f1c7500c8c1f7c0aaf0dd76629c1a6c63eb71129; all five stages succeeded and none of its 174 log entries matched those markers. Live homepage and a sitemap-selected article route both returned HTTP 200. Raw HTML checks confirmed the homepage omits the reader-tools root, its JavaScript bundle, and comments preconnect, while the article retains all three.
- PageSpeed API reruns remain blocked by HTTP 429 (daily quota zero); the desktop fetcher returned the mobile-emulated report. No independent desktop score or post-release PageSpeed/CrUX change is verified.

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

## 2026-10-18 — Restore the copy-protection notice styles

### Root cause

- Commit `4988719ab06c769a2c7aa1abf409b1370f82503f` removed the global content-protection toast styles and text-selection/drag protections from `Base.astro`; the deferred JavaScript still blocks normal copy/context-menu attempts and schedules the notice to hide after 2.6 seconds.
- The live page still serves the handler script, but the production stylesheets contain no toast selector, so the notice loses its centered popup presentation.

### Changes

- Restore the centered, initially hidden toast and its visible state, icon/text styling, reduced-motion behavior, and casual text-selection/image-drag protections. Editable fields and the explicitly allowed reader-tools root remain selectable.
- Add `scripts/content-protection.test.mjs` to exercise blocked copy/context-menu events, editable-target exemptions, and timed dismissal; include it in `yarn test`.

### Verification status

- Baseline `yarn test`: PASS (5 tests). Updated `yarn test`: PASS (8 tests). `git diff --check`: PASS.
- PR #76 is a draft on `fix/copy-protection-notice-20261018`; implementation commit `6fd197909c32dfcdcb6d3c8817468d81c3c9c2d4`. GitHub Actions CI run `39098866567` passed Astro type-check, `yarn test`, static build, and SEO verifiers. Auto-merge workflow run `39098866580` was skipped because the PR is a draft.
- Cloudflare preview deployment `7469a8e2-333b-468c-a99f-9762a890c33f` completed all five stages successfully. Its preview URL returned HTTP 200; the built Base stylesheet contains the centered, hidden/shown toast rules, and the deployed deferred script returns HTTP 200 with the copy/context-menu handlers and 2.6-second timeout.
- Production remains on main commit `38aff5fa5cddb2f6b86d64634248fa0c0ff40f06`, Cloudflare deployment `413a198e-40cf-477d-8f13-c1392c22cb7a`; no production deployment was made for this fix.

### Scope and limitation

- The change restores browser-side deterrents and the notice; it cannot guarantee that publicly served content or files cannot be saved through browser tools, direct URLs, or other means.

## 2026-10-19 — Style the homepage Sinhala title to match the supplied reference

### Request

- The user asked to style the existing homepage title like the supplied ornamental green reference, not to place the reference image or a logo in the page. Keep the live title text and navigation logo unchanged.

### Changes

- Keep the exact H1 as live, selectable Sinhala text and style it with a transparent background, a layered green metallic gradient/bevel, and an aria-hidden inline SVG vine-and-leaf ornament. No image asset or additional font download is used; the navigation logo, page title, metadata, canonical URLs, hreflang, and content remain unchanged.
- Extend the homepage verifier to check the unchanged H1 text, real text content, decorative SVG accessibility, no image inside the title, transparent background, single-line title, and narrow-screen styling.

### Verification status

- Local `yarn test`: PASS (8 tests). Local `yarn build`: PASS (50 static pages; PDF, featured-link, social metadata, critical CSS, and homepage-performance verifiers passed). `node scripts/verify-homepage-seo.mjs`: PASS. `git diff --check`: PASS.
- The default Prettier check cannot resolve the Astro parser from the existing configuration. With the Astro plugin loaded explicitly, the same three files already fail the check at the pristine base commit; the added sections match Prettier output, and no unrelated formatting was applied.
- GitHub Actions CI run `39187074164` passed Astro type-checking, regression-test steps, the static production build, and pagination/homepage SEO verifiers for commit `f648c1c9e1e57dc62f3e7df44070a2dd3575c0cb`; the Cloudflare Pages check also passed.
- Cloudflare preview deployment `d52ec353-b722-4f12-9ab6-fe2693aacc8e` built that same branch commit and completed all five stages successfully. All 174 returned deployment-log entries, including container logs, were checked; none contained warning, deprecation, error, fatal, failure, or exception markers. The deployment URL and stable branch-preview URL returned HTTP 200. Preview HTML retained the exact text H1 and decorative, `aria-hidden` SVG; title, description, canonical URL, `si-LK` hreflang, and `x-default` hreflang matched production.
- PR #77 was squash-merged as `997d359fa5565c3faa4e800f16a4b649ff00f705`; `main` and Cloudflare production now target that commit. Production deployment `146f296d-41bb-4330-98b4-4d427e9f2b25` completed all five stages successfully. All 174 deployment-log entries, including container logs, were checked; none contained warning, deprecation, error, fatal, failure, or exception markers. The live homepage returned HTTP 200 and serves the exact H1 with its decorative, `aria-hidden` SVG; title, description, canonical URL, `si-LK` and `x-default` hreflang remain unchanged. No Search Console ranking or AI-citation impact is claimed.
- SEO/GEO boundary: this change is visual-only around the live heading; no page metadata, canonical/hreflang, structured data, or content was changed. No search-ranking or AI citation outcome is claimed.

## 2026-10-19 — Improve readability of the homepage Sinhala title

### Cause

- The supplied mobile screenshot shows the live homepage title as small and hard to read. PR #77 already added the green bevel and vine ornament, so this is a refinement of the deployed treatment rather than a duplicate implementation.
- The title's layered pseudo-text strokes and `white-space: nowrap` make the small-screen heading busier and less adaptable.

### Changes

- Keep the exact Sinhala H1 text, accessible inline SVG leaves, navigation logo, and all page metadata unchanged.
- Remove the stacked bevel text and heavy shadows; use high-contrast warm-white text, a restrained emerald halo/rule, subdued leaves, and balanced wrapping at narrow widths.
- Do not load the repository's 1.18 MB Sinhala TTF as a new homepage asset; this visual correction adds no font or image request.
- Update the homepage verifier to enforce responsive wrapping and the simpler, high-contrast text treatment.

### Verification status

- Baseline at `a1183c38b510a6bada150514af64fd32783ce9cb`: `yarn test` passed (8/8), `yarn check` and `yarn build` passed; the build generated 50 pages.
- After the change: `yarn test` passed (8/8), `yarn check` passed, `yarn build` passed (50 pages and existing content/PDF/link/metadata/performance checks), `node scripts/verify-homepage-seo.mjs` passed, and `git diff --check` passed. Existing dependency-resolution and Node deprecation warnings also appeared in the baseline; no lockfile or dependency was changed.
- GitHub Actions CI run `39200122901` (run 122) completed successfully for commit `c75c2f477a90c88bbf51d40613c6c23bbeece5ec`; the required “Type-check and production build” check passed.
- Cloudflare preview deployment `f6cca663-fe36-4584-a49d-c211b035290e` for that commit completed successfully. Both `https://f6cca663.wala-katha.pages.dev` and the stable branch preview `https://fix-homepage-sinhala-title-c.wala-katha.pages.dev` returned HTTP 200. All 174 deployment-log records, including container logs, were checked; none matched warning, deprecation, error, fatal, failure, or exception markers.
- The live preview HTML was compared with production: the H1 text, title, description, canonical URL, and `si-LK`/`x-default` hreflang values are unchanged. The preview serves a live-text H1 with an accessible decorative SVG, no `data-title` bevel source, and the new title color in its compiled CSS. The production homepage also returned HTTP 200.
- Final PR-head audit at `18f9984120f130da2fee8883e81ea1cba3242940`: GitHub Actions run `39200819703` passed the required Type-check and production-build check. Cloudflare preview deployment `33744822-03e4-48b3-ac7f-63c36b120c95` completed all five stages successfully; both `https://33744822.wala-katha.pages.dev` and `https://fix-homepage-sinhala-title-c.wala-katha.pages.dev` returned HTTP 200. Direct live checks found the preview H1, title, description, canonical URL, and `si-LK`/`x-default` hreflang equal to production; the bevel `data-title` source is absent from preview HTML. The Cloudflare logs API reports 174 total entries but returned 173 entries; all 173 returned entries were scanned and none matched warning, deprecation, error, fatal, failure, or exception markers. One entry was not returned and remains unverified. Production remained on commit `a1183c38b510a6bada150514af64fd32783ce9cb` (deployment `be27a7f1-3390-4249-a329-772985b723a1`); PR #79 was not merged or deployed to production.
- PR #79 remains open as a draft; this change has not been merged or deployed to production.
- This is a presentation-only change; no ranking or traffic result is claimed.

## 2026-10-23 — Replace the title subtitle with a CSS-drawn feminine accent

### Request and changes

- Removed the small white “WAL KATHA” line and added a restrained red line-art feminine silhouette inspired by the supplied reference. The illustration is built from HTML spans and CSS borders/curves only; no picture, inline SVG, canvas, or external asset is used.
- Kept the Sinhala H1 as live text, the open/no-card layout, existing metadata, and the responsive red title treatment.
- Updated the homepage verifier to require the CSS ornament and no subtitle or image markup.

### Verification status

- Implementation commit `b719ac0feadab16e69f7a614aac0772ddd8f242e` is in draft PR #89. GitHub Actions CI run `39898274324` completed successfully.
- Cloudflare Pages preview deployment `dbedd595-8f71-41d5-8774-9a80dcfcd033` completed all five stages successfully for that commit. Preview URL: https://dbedd595.wala-katha.pages.dev; branch alias: https://design-homepage-title-text-o.wala-katha.pages.dev.
- Direct HTTP GET of the preview returned 200. The rendered title region kept the exact Sinhala H1, included the CSS-drawn figure, omitted “WAL KATHA”, and contained no img/svg/picture/canvas markup. The downloaded compiled CSS contains the figure selectors, red title rule, and the responsive 480px media rule.
- PR #89 remains a draft; no merge or production deployment was performed.


## 2026-10-23 — Replace the abstract title ornament with a white side silhouette

### Request and changes

- Replaced the ambiguous red line-art ornament with a clear, solid white full-body feminine silhouette positioned beside the live Sinhala title, inspired by the supplied black-background reference.
- Draw the silhouette with CSS clip-path geometry and a polygon fallback; no picture, SVG, canvas, font, or external asset is added.
- Keep the subtitle removed, the H1 and SEO metadata unchanged, and the layout responsive. Extend the verifier to check the white CSS silhouette and side-by-side layout.

### Verification status

- Implementation commit `d2cc6a2d104849b64f10e8c68a86f625e76cbf9f` is in draft PR #89. GitHub Actions CI run `39899734051` completed successfully.
- Cloudflare Pages preview deployment `906e66ec-5649-43d5-9d1d-eb342e5e1a64` completed all five stages successfully for that commit. Preview URL: https://906e66ec.wala-katha.pages.dev; branch alias: https://design-homepage-title-text-o.wala-katha.pages.dev.
- Direct HTTP GET of the preview returned 200. The rendered title kept the exact Sinhala H1, included the solid white CSS silhouette beside it, omitted “WAL KATHA”, and contained no img/svg/picture/canvas markup in the title region. The downloaded compiled CSS contains the white gradient silhouette, CSS path clip, right-side title column, and responsive 480px rule.
- PR #89 remains a draft; no merge or production deployment was performed.


## 2026-10-23 — Tighten the homepage title layout and redraw its feminine silhouette

### Request and changes

- Review of the supplied phone screenshot found the title stage reserved 8.5rem of mobile height while the figure itself reserved 128px; this pushed the featured story down and left unnecessary space.
- Reduced the title stage, then browser screenshot review caught CSS grid auto-placement putting the H1 under the figure; explicitly anchored both to row 1 and increased the mobile figure to 110px for a clearer, more legible side-by-side layout.
- Trimmed the title-to-slider gap and changed the neon red heading to restrained warm ivory on black.
- Redrew the decorative white figure as a CSS-only silhouette with flowing hair, a defined waist/hips, and a fitted full-length shape. No photo, image file, inline SVG, canvas, font, or external asset is added. The live Sinhala H1 and SEO metadata stay unchanged.
- Strengthened the homepage regression verifier for the no-image design, compact mobile spacing, and silhouette geometry.

### Verification status

- Implementation and preview verification are pending. This change is on the existing draft PR #89; no merge or production deployment has been performed.

## 2026-10-23 — Add the reference's red title accent

### Request and changes

- The current preview had the live Sinhala heading and white CSS silhouette aligned, but the black-and-red reference was not yet reflected in the title treatment.
- Add a dimensional red X behind the existing figure and a restrained red rule beneath the live heading using CSS only. Keep the Sinhala H1, SEO metadata, responsive layout, and no-image design unchanged.
- Extend the homepage verifier to check both accents.

### Verification status

- Implementation commit `a125567a215875042aefc753bf61f7cca7898560` on draft PR #89 passed GitHub Actions CI run `39920047946`.
- Cloudflare Pages preview deployment `332d6b5a-cfdd-41ca-9210-927191135742` completed all five stages successfully for that same commit. Preview: https://332d6b5a.wala-katha.pages.dev (branch alias: https://design-homepage-title-text-o.wala-katha.pages.dev). The preview homepage returned HTTP 200; all 174/174 available deployment log records, including container logs, were inspected and none matched error, fatal, failure, exception, or warning markers.
- Rendered HTML retains the Sinhala H1 `සිංහල වල් කතා සහ වැල් කතා` and contains no image/vector/canvas markup in the title region. Compiled CSS contains the red X and underline accents. Cloudflare Browser Rendering screenshots at 462×900 mobile and 1280×900 desktop confirmed the title, underline, and CSS silhouette layout.
- The PR remains a draft; no merge or production deployment has been performed.
