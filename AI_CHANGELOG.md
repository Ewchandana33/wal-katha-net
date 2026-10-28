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

- archive/AI_CHANGELOG-2026-Q4.md — 63 earlier dated entries from 2026-10-14 through 2026-10-25; dated sections are retained verbatim.

## Recent entries

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

## 2026-10-25 — Make the homepage banner fill its frame

### Request and change

- Follow-up to “Remove black gutters from the homepage featured banner”: the brighter blurred backdrop still left the original artwork visually inset on the supplied mobile screenshot.
- Change only the first featured image from `object-contain` to a top-aligned `object-cover`. This removes the side gutters while keeping the embedded Sinhala heading, 18+ badge, and PDF/audio icons in view; it crops some lower bedding. Other slides, assets, routes, and frame dimensions remain unchanged.
- Update the responsive Chromium assertions to require the cover fit, top crop, working image decode, and equal slide heights at all 11 viewport widths.

### Verification status

- Local `git diff --check`, `node --check scripts/verify-responsive-layout.mjs`, and `yarn check` passed; `yarn test` passed (8/8). The local `yarn build` timed out during static route generation, but GitHub Actions CI run `40213794263` passed the Type-check and production-build job for code commit `ab40138288791f7243bb050803aaaed8c35a0f5e` in draft PR #102.
- Cloudflare Pages Preview deployment `83aea326-5994-492c-8d9d-0b70adc9aa62` completed successfully for that exact commit: https://83aea326.wala-katha.pages.dev. The responsive Chromium test passed at 280, 320, 390, 461, 640, 700, 768, 1024, 1440, 1920, and 2560px: the banner image decoded from the expected mobile/desktop sources, used `object-fit: cover` and `object-position: 50% 0%`, retained equal slide heights, and the homepage/article checks found no horizontal overflow. The age gate was not interacted with.
- All 175 returned Cloudflare deployment-log entries, including container logs, were checked; no warning, error, failed, failure, fatal, or exception markers were found.
- Production remains on deployment `543a827d-6f9d-44df-a19c-9f346558de18`, commit `d92b2a507bfc920fd6bb7c36eb824e308390a878`. PR #102 remains a draft; no merge or Production deployment was performed.

## 2026-10-25 — Repair the homepage banner desktop WebP

### Correction and root cause

- Follow-up to “Remove black gutters from the homepage featured banner”: a separate desktop-only image-decoding failure was not covered by the earlier CSS-only diagnosis.
- The desktop asset returned HTTP 200 and `Content-Type: image/webp`, but its 61,414 bytes lacked the `RIFF/WEBP` signature and ImageMagick could not decode them. The page’s `?v=391572ab64` version matched the SHA-256 of those bad bytes, so cache-busting was working; the committed asset itself was invalid. Both Production and PR Preview served those same bytes.
- The original JPEG is intact at 2400×1219, and its `.jpg.hash` matches the source plus the optimizer’s configured version. Re-encoded it to a valid 1200×610 WebP (62,794 bytes) without enlarging the mobile asset; the existing 700×356 mobile WebP remains unchanged.
- Extend the Chromium responsive test to await image decoding and verify selected image path plus intrinsic dimensions at all 11 viewport widths (mobile through 767px; desktop from 768px). The prior object-fit, backdrop, slide-height, and page-overflow checks remain.
- This correction is included in PR #101 only. Production remains unchanged; merge and release still require the user’s explicit approval.

### Verification status

- Before the change, confirmed the live PR Preview and Production both returned HTTP 200 for the invalid 61,414-byte desktop asset; `file` identified it only as generic data. The source JPEG and its optimizer sidecar were verified, and the replacement candidate decoded as 1200×610 WebP.
- GitHub Actions CI run #221 (`40191654568`) passed for implementation commit `501cd93670f0a03446bc829c024a7a885ebe679b`: type-check, tests, Astro production build, responsive Chromium at all 11 widths, SEO verifiers, and Cloudflare Preview route/noindex/age-gate checks. The new browser assertions verified the expected desktop/mobile source selection and natural dimensions after `img.decode()`.
- Cloudflare Pages Preview deployment `9d76bda6-37d4-4d3a-a45d-84f4bb83e7a3` completed all five stages successfully for that exact commit: https://9d76bda6.wala-katha.pages.dev. All 175 returned deployment-log records, including container logs, were checked; no warning, error, failure, fatal, or exception markers were found.
- The live Preview homepage references desktop `online-wal-katha-audio-pdf.webp?v=79a153f3a8`; its response decoded as 1200×610 WebP (62,794 bytes) and the version matches its SHA-256 prefix. The unchanged mobile URL decoded as 700×356 WebP (35,694 bytes). Cloudflare still identifies Production deployment `c0a0d04d-6c08-403c-aa78-806b009049c8` on `main` commit `39ed65f0cb7818379a260a97eabcee768485acf3`; no merge or Production deployment was performed.

## 2026-10-25 — Remove black gutters from the homepage featured banner

### Root cause and change

- The first carousel artwork has a 700×356 mobile aspect ratio and uses object-contain in the shared wider 21:8/24:8 frame. The empty side area is meant to be filled by a blurred copy of the artwork, but its 40% opacity and 50% brightness made it appear nearly black on the supplied Android screenshot.
- Keep the original image fully visible and uncropped, retain the shared slide frame and carousel height, and raise only the blurred backdrop's visibility. Sinhala text, the 18+ badge, story-slide crop, assets, and routes remain unchanged.
- Extend the responsive Chromium check to cover the supplied 461px screenshot width and the 640/700px frame breakpoint, asserting the visible full-bleed backdrop, uncropped foreground, and equal slide heights.

### Verification status

- Implementation commit: `ed8f89a980d4ae3899b604e76a3d6a567387bdd6` in [PR #101](https://github.com/Ewchandana33/wal-katha-net/pull/101), based on main `39ed65f0cb7818379a260a97eabcee768485acf3`.
- GitHub Actions run `40186676321` (run #219, attempt 2) passed. Type-check/build, responsive Chromium at 11 widths (280, 320, 390, 461, 640, 700, 768, 1024, 1440, 1920, 2560), homepage/pagination SEO checks, and Cloudflare Preview route/noindex/age-gate checks all passed. Attempt 1 failed before layout assertions because Chrome DevTools did not become ready; attempt 2 succeeded.
- Cloudflare Pages Preview deployment `e4837acf-8bd9-416e-9708-aa9399dce588` completed successfully for the implementation commit: https://e4837acf.wala-katha.pages.dev. Browser smoke checks confirmed object-fit: contain, backdrop cover/blur/0.8 opacity, and equal frame heights at 461, 640, 700, and 768px. The age-gate overlay prevented a visual screenshot confirmation without interacting with it.
- Production remains on deployment `c0a0d04d-6c08-403c-aa78-806b009049c8`, main commit `39ed65f0cb7818379a260a97eabcee768485acf3`. No merge or Production deployment was performed; explicit approval is still required.
- A documentation-only follow-up commit records these implementation checks; its own CI and Preview results are tracked separately.
