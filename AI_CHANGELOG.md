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

- archive/AI_CHANGELOG-2026-Q4.md — 20 earlier dated entries from 2026-10-14 through 2026-10-15; dated sections are retained verbatim.

## Recent entries

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

## 2026-10-15 — Automated deterministic cover-alt repair

- Repaired 11 cover alt value(s): Akkai-Nangi-wal-katha, Bus-jack-wal-katha, Mage-Nangi-wal-katha, Nimali-saha-boss, School-Wal-Katha, gedara-driver-wal-katha, methsala-akka-wal-katha, nandage-duwa-wal-katha, nethuge-wal-katha, thaththa-duwa-wal-katha, wanamalee-wal-katha.
- Used neutral title-derived labels; age-sensitive or explicit titles receive a generic fallback. No image model, API key, GSC query, or keyword seed is used.
- The workflow validates all cover labels, opens or updates a PR, dispatches required CI on the PR head, and leaves the PR in draft for review; production merge requires explicit approval.


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

## 2026-10-15 — PR #46 merged and production verification

- GitHub PR #46 (deterministic, safe cover-alt automation) was merged into `main` as merge commit `8e6fedb39f6ce0d71753a9a91358ecc757a86613`. The PR-head CI run `38741039658` completed successfully; its Type-check and production build job passed. The Cloudflare Pages preview check on PR head `37e3a4686a6051df24599dea36aed1029337a240` also succeeded.
- Cloudflare Pages production deployment `2fac97fa-c54e-4e49-ac24-b1004394aeac` was triggered by that exact `main` merge commit. All five stages (queued, initialize, clone_repo, build, deploy) succeeded. All 156 fetched log entries, including container logs, were scanned for warning, deprecation, error, fatal, failure, and failed terms; none matched.
- Direct live checks returned HTTP 200 for the homepage, `/robots.txt`, `/sitemap-index.xml`, `/sitemap-0.xml`, and `/rss.xml`. A live crawl of all 26 URLs in the current sitemap returned HTTP 200 for every page; each had a canonical URL, `lang=si`, and `hreflang=si-LK`, and no rendered image had an empty/missing alt attribute.
- This post-merge record supersedes the earlier pre-merge/draft status above; that historical note is retained to preserve the decision timeline. Technical crawl and accessibility checks do not guarantee Google indexing, rankings, or a top position. No post-release Search Console ranking/CTR change is claimed here.
