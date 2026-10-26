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

- archive/AI_CHANGELOG-2026-Q4.md — 62 earlier dated entries from 2026-10-14 through 2026-10-25; dated sections are retained verbatim.

## Recent entries

## 2026-10-26 — Add editorially gated, non-indexed Web Stories

### Request and changes

- Continue the unfinished Story feature without changing existing Google indexing or automatic PDF generation.
- Add an optional `web_story` editorial flag. A Story now requires explicit approval, a published source post, a local existing WebP cover, no existing noindex exclusion, and no detected sensitive terms in its title, metadata, tags, categories, or body. No existing post has been opted in, so the current content creates zero Story pages and the homepage rail stays hidden.
- Add a conditional homepage Stories rail, a `/stories/` archive, AMP Story detail pages, and build-time portrait WebP posters cropped from the existing cover. The poster crop is emitted as a separate static image and does not modify source images.
- Mark new Story HTML and poster URLs noindex; exclude only the new `/stories` prefix from the existing sitemap. Existing article/page robots directives, canonical behavior, sitemap URLs, `robots.txt`, PDF routes, PDF generator/version files, and PDF verifiers are unchanged.
- No dependencies or content-post metadata were changed. Production deployment and merge are not authorized.

### Verification status

- Base source checked out from `main` at `05d5ded3cce4a1084c6cba334cac19b7e696c31b`; the existing workspace CI run `40214935250` had passed before this feature work.
- Final local `yarn check` passed. `yarn test` passed 15/15 tests, including the new eligibility, sensitive-content, Markdown-slide, and portrait-poster checks; the four additional repository test files passed 12/12 tests, including the changelog/archive rules.
- Local `yarn build` completed successfully in 6m 14s. The sitemap indexability guard checked 33 page URLs; the built Story archive was canonical and noindex, and no Story or poster URL appeared in the sitemap output.
- The existing PDF verifier passed for all 7 published articles and 74 PDF pages, including its attachment/noindex-header and sitemap-exclusion checks. No PDF route, generator, version, content, or verifier file was changed.
- Poster crop test uses the neutral app icon in memory and checks a 640×853 WebP; it does not write to or change any PDF or article image.
- No eligible existing Story content was found. GitHub Actions and Cloudflare Preview verification are pending; no merge or Production deployment has occurred.

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


## 2026-10-25 — Center the article cover image responsively

### Request and changes

- Addressed the report that the primary post cover was left-aligned on desktop and the request to center it across device sizes while checking related responsive image layout.
- Root cause: Astro rendered the cover image as `inline-block`; its existing `mx-auto` could not center a `max-w-4xl` image once it became narrower than the wide article column. Added `block` to the cover image classes in `src/layouts/partials/PostSingle.astro`. It remains full available width on smaller screens and is centered at its existing 896px maximum on desktop.
- Audited the homepage post-card thumbnails and article layout at eight viewport widths; no additional card-image, row-gutter, or horizontal-overflow issue was found in the tested pages.

### Verification

- Code commit `228ad4d5f38210867fe0836dc0f2499d2338aa1d` passed GitHub Actions CI run `40172972916`: Astro type-check, the middleware/logic/changelog tests, static site build, and homepage/pagination SEO checks all succeeded.
- Cloudflare Pages Preview deployment `c062e4c9-e04b-4787-af9c-c7e167c11f29` completed all five stages successfully; the article page returned HTTP 200. All 175 deployment logs, including container logs, were checked; no warning, error, failure, fatal, or exception markers were found.
- Headless Chromium checked the article and homepage at 280, 320, 390, 768, 1024, 1440, 1920, and 2560px. The article cover center offset was 0px at all eight widths; the homepage grid stayed at 2, 2, 2, 3, 4, 4, 5, and 6 columns, with card images inside their frames. No document-root horizontal overflow or `.row` edge bleed was observed. The age-confirmation overlay stayed active; the test did not bypass it.
- PR #99 remains a draft; no merge or Production deployment occurred.
