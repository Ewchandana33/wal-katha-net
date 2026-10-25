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

- archive/AI_CHANGELOG-2026-Q4.md — 60 earlier dated entries from 2026-10-14 through 2026-10-24; dated sections are retained verbatim.

## Recent entries

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

## 2026-10-25 — Make the site layout fluid across devices

### Request and changes

- Addressed the request to remove the narrow fixed page frame and make the existing site use available screen width from mobile through ultrawide desktop.
- The shared `.container` had a 1000px maximum; the responsive layout change removes that cap, sets post cards to 2–6 columns by screen width, and lets article sections use the full 12-column grid.
- Browser verification then found a 4px narrow-screen bleed: the Bootstrap-style `.row` uses 2rem total gutters (−1rem side margins), while the page frame used 0.75rem minimum padding. Raised the minimum page-frame padding to 1rem in `src/styles/components.css` and `src/styles/small-screen-fixes.css` so row gutters align with the viewport.
- Kept all work on `fix/full-width-responsive-layout-20261025` in draft PR #99; no merge or Production release.

### Verification

- Final code commit `1a423724bd4b2656815380e89eaeb1f9d810dc69` passed GitHub Actions CI run `40169965473` (Astro type-check, tests, and production build).
- Cloudflare Pages Preview deployment `90d470c6-a2a8-4363-98fe-935b18c89f4e` completed build and deploy successfully for that exact commit. Preview returned HTTP 200 at https://90d470c6.wala-katha.pages.dev. All 175 available deployment log records, including container logs, had no error, failure, fatal, exception, or warning matches.
- Headless Chromium 152 checked the homepage and article page at 280, 320, 390, 768, 1024, 1440, 1920, and 2560px. No document-root horizontal overflow or row-edge bleed was observed. Homepage grid columns were 2, 2, 2, 3, 4, 4, 5, and 6 at those widths; article content filled the available frame. The site's age-confirmation overlay remained active; the test did not bypass it.
- PR #99 remains open as a draft; its auto-merge workflow was skipped. No merge, Production deployment, or live-site code change occurred.

## 2026-10-24 — Correct the feature placement as a standalone page

### Request and changes

- Supersedes the placement described in the earlier entry “Add online, audio, and PDF feature article.” The user clarified that this must be a standalone page like Privacy Policy, not a blog post.
- Removed the entry from src/content/posts and added it to src/content/pages/online-wal-katha-audio-pdf.md. Its direct route is /online-wal-katha-audio-pdf/. Moved the supplied banner to public/images/pages/online-wal-katha-audio-pdf.webp. No homepage, menu, or footer link was added; the homepage loads only posts.
- Added explicit legacy redirects from both /blog/online-wal-katha-audio-pdf/ and the non-trailing-slash variant to the standalone page. The build-time redirect fixer initially sent the deleted post URL to /categories/wal-katha/; the explicit rule corrects that destination.
- During this Preview-verification stage, the work remained on feature branch content/online-wal-katha-audio-pdf-20261024 in draft PR #92, pending the author's explicit Production approval; the subsequent Production rollout is recorded below.

### Verification

- Final code commit 0317f857c3347d3dbd5c2543d51045621e5b380c passed GitHub Actions CI run 40088184523. Astro check reported 0 errors, 0 warnings, and 27 hints. CI logs still contain existing Node DEP0040/DEP0169 deprecations and warnings in unchanged source files; none identify this page or redirect rule.
- Cloudflare Pages Preview deployment 70b81d1c-9ac7-4c45-868e-e91f2cc62652 completed all five stages successfully for that commit: https://70b81d1c.wala-katha.pages.dev. All 175 available deployment-log records, including container logs, were checked; none matched warning, error, failed, fatal, or exception markers.
- Direct page returned HTTP 200 with the expected canonical URL, title, and description; the banner returned HTTP 200 image/webp. The former blog URL returned 301 to /online-wal-katha-audio-pdf/, and the no-slash page URL returned 308 to its canonical trailing-slash URL. The Preview homepage HTML contained neither the page slug nor its title.
- Desktop (1365×900) and mobile (390×844) captures showed the site's 18+ confirmation gate at both sizes; it was not bypassed. Preview responses are noindex. At this stage Production main was bb5215476fa976a3a1983299dd218fc641f0c56f; the later approval and rollout are recorded below.


### Production rollout after explicit approval (2026-10-24)

- After the user explicitly approved release, draft PR #92 was marked ready through GitHub GraphQL and squash-merged into main as commit 1a0c52bc1b196f926684c8307b410e31660f67c1.
- GitHub Actions CI run 40091530019 passed on the merge commit. Cloudflare Pages Production deployment 3845e72b-08cb-453f-b40d-ea780c59b3d0 completed all five stages successfully for that same commit. All 175 available deployment-log records were checked; none matched warning, error, failed, fatal, or exception markers.
- https://www.walakatha.net/online-wal-katha-audio-pdf/ returned HTTP 200 with the expected canonical URL, index/follow robots metadata, and the existing 18+ confirmation gate. The banner returned HTTP 200 image/webp. The homepage HTML contained neither the page slug nor its title.
- The legacy trailing-slash blog URL redirected to the standalone page with one 301; the legacy no-slash URL reached the same HTTP 200 destination after two redirects. The no-slash standalone URL redirected to its canonical trailing-slash URL with HTTP 301. The non-www hostname redirected to www.
- PR #92 is closed and merged. Production main now points to 1a0c52bc1b196f926684c8307b410e31660f67c1. No age-gate bypass or separate visual redesign was performed during Production verification.
