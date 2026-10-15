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

- At this snapshot, main is commit 00138773ecf824d50878dee04d11adada8af9424; PR #46 contains the deterministic cover-alt SEO repair, and PR #47 records its post-merge verification. The matching Cloudflare production deployment succeeded.
- The GSC post-recrawl homepage CTR workflow is active. Its latest completed run checked here was 38726508677 on pre-release commit 5c56696583bbdea46978eb0988190395724bacfb; its report-PR step was skipped, so there is no post-release Search Console result in this snapshot.
- Do not claim a post-release CTR/ranking change until Google reports an indexed verdict and a crawl at or after the snippet release, at least seven days have elapsed after deployment, a complete 28-day post-crawl window is available with the three-day data lag, and each global comparison window has at least 500 impressions. Report Sri Lanka separately and label it directional if either window has fewer than 100 impressions. The scheduled workflow creates a report PR only after these gates pass.

## Archive index

- archive/AI_CHANGELOG-2026-Q4.md — 18 earlier dated entries from 2026-10-14 through 2026-10-15, moved verbatim during the cleanup below.

## Recent entries
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
