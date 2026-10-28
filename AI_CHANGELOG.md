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

### Archive index

- archive/AI_CHANGELOG-2026-Q4.md — 66 earlier dated entries from 2026-10-14 through 2026-10-25; dated sections are retained verbatim.

## Recent entries

## 2026-10-28 — Complete story comments and colorless toast

### Request and changes

- Complete draft PR #105 with a rating-gated optional Sinhala comment, a separate accessible comments dialog, paginated top-level comments, one-level replies, and idempotent likes. The dialog uses the browser's modal layer and restores page scrolling/focus when closed.
- Add same-origin validation, strict request parsing, a 500-character limit, hashed anonymous voter/IP identities, the existing write rate limit, safe text rendering, and atomic D1 insertion for a rating with its optional review.
- Add the additive comments/likes migration matching the already-present Preview schema. Do not apply a migration, alter Production data/configuration, merge the PR, or deploy Production.
- Supersede “Correct story-rating success backdrop”: use a colorless transparent backdrop with blur, paired with the existing green thank-you toast.
- Add API/UI regression tests, including the comments dialog, likes/replies, scroll lock, toast appearance, and paired dismissal.

### Verification

- Focused Node tests passed 17/17; JavaScript syntax checks and SQLite migration/query smoke tests passed. CI run `40681302698` caught strict-null errors in the new comments widget, which were corrected in the follow-up commit. Cloudflare Preview deployment `2e1c3d65-dd5b-42d7-beca-d7e62d0977aa` deployed initial commit `bd18b2ddaaa12e5a70734d0edded8587768eb1c0`, but is not accepted as verification because CI failed. CI and a corrected Preview are pending. Local build dependencies and generated `dist/` assets are not present in this workspace.
- PR #105 remains an open draft. No merge, `main` update, or Production deployment was performed.

## 2026-10-28 — Correct story-rating success backdrop

### Correction and changes

- Correction to “Center and restyle story-rating feedback”: the user asked for a full-screen blue backdrop behind the original thank-you notice, not a blue notice.
- Restore the original dark-green toast appearance and keep it centered. Add a fixed blue-tinted, blurred viewport backdrop that appears and auto-dismisses together with the toast after 3.5 seconds.
- Update the isolated responsive Chromium test to verify full-viewport backdrop coverage, its blue color, the unchanged green toast, and the paired automatic dismissal.

### Verification

- `yarn test` passed 17/17; `yarn check`, `node --check scripts/verify-responsive-layout.mjs`, and `git diff --check` passed. `yarn check` reports the existing 20 dependency-resolution warnings and Node.js `url.parse()` deprecation warning.
- PR #105 branch update, GitHub CI, and Cloudflare Preview checks are pending. No Production branch update or deployment was performed.

## 2026-10-28 — Center and restyle story-rating feedback

### Request and changes

- Update PR #105's successful rating notice from a top-anchored green toast to a viewport-centered blue success toast, while retaining its accessible live region and 3.5-second auto-dismiss behavior.
- Refine the rating panel with restrained blue depth, clearer interactive star cards, more distinct summary/action styling, and a proper people icon in place of the unrelated pawn glyph.
- Extend the isolated responsive Chromium interaction test to assert the toast uses fixed positioning, is centered in the viewport, has a blue background, and still dismisses automatically. API requests remain stubbed in this interaction test.

### Verification

- `yarn test` passed 17/17; `yarn check`, `git diff --check`, and the production `yarn build` passed. The build generated all 51 pages and passed the configured PDF, featured-link, social-image, critical-CSS, homepage-performance, and sitemap checks.
- Local `node scripts/verify-responsive-layout.mjs` reached the homepage checks through 700px, then Chromium timed out on `Emulation.setDeviceMetricsOverride` at 768px. No assertion failed before that timeout; the isolated toast interaction was not reached locally. GitHub CI and a new Preview are pending the branch update.
- No Production branch update or deployment was performed.

## 2026-10-28 — Improve story-rating feedback and audit Google snippets

### Request and changes

- Make a successful story rating show a brief, accessible thank-you toast that dismisses itself; highlight the selected rating tile green while keeping its star gold; remove the duplicate-vote privacy footnote from the widget.
- Extend the responsive Chromium test to verify the selected color, gold star, success toast, automatic dismissal, and removal of the footnote. The test stubs rating API requests, so it does not write votes to the Preview or Production database.
- Audited the added request for Google Search stars against Google's current review-snippet guidance. The story page is an Article/BlogPosting; that generic type is not listed as eligible for Google's review-snippet star feature. Do not emit misleading AggregateRating markup or relabel a story as a Book/Episode to try to qualify. Revisit only if a page genuinely represents a Google-supported type and the rating is visible and real; valid markup still does not guarantee a rich result.

### Verification

- `yarn test` passed all 17 tests; `yarn check` passed; the changelog/archive retention tests passed 2/2. Dependencies were installed from the checked-in frozen lockfile. Both full builds attempted in this local 1.6 GiB cgroup were killed with exit 137, including the capped-heap retry.
- GitHub Actions CI run `40636663470` passed for commit `f50d9ca0725062aab42fdf73caeaa89ad07ae691`: type-check, CI test steps, static production build, responsive Chromium, SEO output, Preview route, and age-gate checks all succeeded.
- Cloudflare Pages Preview deployment `61ce2c40-7232-44cd-b95f-183b9aebcdf2` completed all five stages successfully for that exact commit: https://61ce2c40.wala-katha.pages.dev. The article and read-only rating API GET returned HTTP 200; the aggregate remained at 0 votes. Direct Preview Chromium checked the article at 280, 320, 390, 461, 640, 700, 768, 1024, 1440, 1920, and 2560px with no horizontal overflow; all five choices and the toast were present, and the removed footnote was absent. CI's isolated mocked interaction also passed the green selected tile, gold star, success toast, and auto-dismiss assertions. No live POST was sent.
- PR #105 remains open as a draft. No merge, `main` update, or Production deployment occurred.

## 2026-10-27 — Complete the story-rating Preview integration

### Root causes and changes

- Resolved the two strict-null Astro type-check errors in StoryRating.astro by capturing the story ID and submit button only after validating both values.
- The story routes and Astro content IDs use lowercase slugs, while the generated API allowlist preserved filename capitalization. Lowercase the generated IDs, regenerate the seven-story allowlist, and add regression coverage for canonical route IDs and case mismatches.
- The Preview D1 database existed and its tables were migrated, but the Pages runtime did not receive the DB binding from Wrangler configuration. Add the existing walakatha-rating-preview database binding under env.preview only; keep Production unbound.
- Extend the Preview smoke test to read the real route-derived rating API and validate its totals, buckets, and average without submitting test votes. Extend Chromium coverage to assert the rating widget, matching route ID, five accessible choices, summary, breakdown, live status, and viewport fit at all 11 widths. Keep the age gate untouched and make the local Astro preview test server stay in the foreground in Replit Agent.

### Verification

- Local yarn test passed 17/17; yarn check passed; yarn build completed all 51 pages and the PDF, featured-link, social-image, critical-CSS, homepage-performance, and sitemap-indexability verifiers. The built article rendered five choices with the canonical lowercase slug. Local Chromium runs were unreliable in this Replit sandbox with about 204 MB available memory; the hosted CI browser test below passed on the same implementation commit.
- GitHub Actions CI run 40541834937 passed every step for implementation commit 95d67f701035ed2ab91e7b3a5ddb0cd1f1d611b0 in draft PR #105: Astro type-check, tests, build, responsive Chromium at 280, 320, 390, 461, 640, 700, 768, 1024, 1440, 1920, and 2560px, SEO checks, and Preview route/API/noindex/age-gate verification. The API smoke returned HTTP 200 for methsala-akka-wal-katha with 0 votes and average 0. Existing dependency/action deprecation notices and Astro hints in unrelated files remain.
- Cloudflare Pages Preview deployment 62f5df25-1a99-401d-93a4-8a503dc3c7e9 completed all five stages successfully for that exact commit: https://62f5df25.wala-katha.pages.dev. A separate read-only smoke returned HTTP 200 for /blog/akkai-nangi-wal-katha/ and /api/rating?story=akkai-nangi-wal-katha; the article contained the widget and five inputs, and the API returned all five zero-count buckets, 0 votes, and average 0. No POST or demo vote was submitted.
- After the Preview deploy, Cloudflare still reported Production deployment 6e110384-5552-454c-bc87-8970f98a2305 on main commit 05d5ded3cce4a1084c6cba334cac19b7e696c31b; Production D1 binding is null while Preview is bound to the existing rating database. PR #105 remains a draft; no merge or Production deployment occurred.
