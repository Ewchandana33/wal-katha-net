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

- archive/AI_CHANGELOG-2026-Q4.md — 2026-10-14 through 2026-10-23; 51 dated entries.

## 2026-10-24 — Correction: render the Sinhala homepage title as text

### Request and changes

- The user explicitly requested a text-only title matching the supplied reference. The latest change on draft PR #91 had replaced the live Sinhala title with a WebP image, contrary to that requirement.
- Restored the selectable H1 text `සිංහල වැල් කතා සහ වැල් කතා`, with gold and ivory metallic gradients, restrained red glow, the red underline with centered gold highlight, and the outlined 18+ badge. Kept the accessible H1 label and responsive sizing.
- Removed `public/images/home-title-reference.webp` and restored the homepage verifier checks for visible live text and no title image/vector markup. No unrelated page content or dependencies changed.
- This supersedes the 2026-10-23 entry “Use the exact reference artwork for the homepage title”; that entry remains as historical context, not the current design requirement.
- PR #91 remains a draft. No merge or Production deployment.

### Verification

- `yarn test`: 8 passed, 0 failed. Additional CI unit tests (`gsc-ctr-followup`, `alt-text-policy`, `post-files`, and `ai-changelog`): 12 passed, 0 failed.
- `git diff --check` and `node --check scripts/verify-homepage-seo.mjs` passed.
- Astro type-check, production build, generated-page verification, and Cloudflare Preview checks are pending for the updated PR head. The temporary workspace restarted during the lockfile dependency install, so those full checks will be taken from GitHub CI and the real Pages Preview instead of claiming a local build.

## 2026-10-23 — Use the exact reference artwork for the homepage title

### Why and changes

- The previous live-text/CSS styling preserved editable Sinhala text but could not guarantee the exact glyph shapes, metallic finish, glow, and badge in the supplied image. This correction uses the supplied reference itself for the visible title artwork.
- Added public/images/home-title-reference.webp, a lossless 2048 × 280 crop of the supplied PNG (354,480 bytes). The visible letterforms, gold/red treatment, underline, and 18+ badge come directly from that reference.
- Kept the homepage H1 and exact Sinhala wording as the artwork alt text and H1 accessible name. The image scales to the viewport while preserving its aspect ratio; no new dependency or unrelated page change.
- This supersedes the earlier text-only visual approach in the same PR. Changes remain on draft PR #91; no merge or Production deployment.

### Verification

- Implementation commit `ff6103e8fb6bb821cbd946c32299b7ce34d9563f`: [GitHub CI run 40002024810](https://github.com/Ewchandana33/wal-katha-net/actions/runs/40002024810) completed successfully. Astro type-check, middleware and changelog tests, production build, and homepage SEO verification all passed.
- Cloudflare Pages Preview deployment `3df784a5-b508-4c43-bbd6-32034f15279a` (`https://3df784a5.wala-katha.pages.dev`) completed successfully; queued, initialize, clone, build, and deploy stages all passed. The rendered homepage and title asset both returned HTTP 200; the asset served as `image/webp` at 354,480 bytes, and its deployed H1/alt text matches the Sinhala title.
- Deployment logs returned 173 of 174 entries; no warning/error/failure/fatal/exception markers were found in the returned entries. One log entry was unavailable, so this check is limited to the 173 returned.
- These checks cover the image/code commit above. A documentation-only changelog follow-up will receive its own CI/Preview checks before the PR summary is refreshed.

## 2026-10-23 — Match the homepage title to the gold/red reference

### Request and changes

- Correct the title styling that looked too dim and sat too close to the content below.
- Match the supplied title's exact selectable Sinhala wording (`සිංහල වැල් කතා සහ වැල් කතා`) and existing font; brighten the metallic gold and ivory gradients, add restrained crimson edge glow and depth, restore the outlined 18+ badge, lengthen the desktop red underline to 52vw to match the 1024px reference, cap desktop type at 3.25rem to keep it single-line on wide screens, retain the centered gold highlight, and add controlled space below the title.
- Keep the layout responsive and update the title-specific verifier. On mobile, keep the 18+ badge in the title's inline text flow so it moves to a new line only when space is insufficient. No title image, dependency, unrelated page change, merge, or Production release.

### Verification

- Initial implementation commit cc85c96465fe18f4e4f91570191c8b91e1983e54 on draft PR #91 passed GitHub Actions run 39965144654 and its Cloudflare Pages check; its commit-matched Preview deployment 8fe7037e-fb26-4e70-86df-53ff72a91616 completed successfully.
- Responsive follow-up commit dede67b6e593ab5bb32dfb20e1f89799ac95cb20 passed GitHub Actions run 39966486651 (Type-check and production build) and the Cloudflare Pages check. Preview deployment bef6ab1e-0741-40cf-9fde-28cf25601297 completed its deploy stage successfully for that exact commit. Preview: https://bef6ab1e.wala-katha.pages.dev.
- The final Preview returned HTTP 200. All 174 available deployment-log records, including container logs, were checked; none matched error, failure, warning, fatal, or exception markers.
- Local headless Chromium measurements at 320, 360, 390, 430, 768, and 1024px found no horizontal overflow. The 18+ badge stayed visible in the viewport, did not overlap the title, and shared its final text line; the title used two lines only at 320 and 360px and one line at 390px and wider. The screenshot remained behind the site's existing age-confirmation overlay; the review did not bypass it.
- PR #91 remains a draft; auto-merge was skipped. No merge or Production deployment occurred.


## 2026-10-23 — Redesign the compact Sinhala homepage title

### Request and changes

- Followed the supplied black-background reference and request to eliminate unnecessary empty space below the homepage title.
- Kept the exact live H1 text, styled its first phrase gold and its second phrase ivory/silver, and added a restrained red glow with a thin red rule and centered gold highlight. Tightened title-stage spacing while retaining the existing Sinhala-compatible font; added no image, badge, dependency, or unrelated page/content change.
- Updated the title-specific SEO verifier. Rotated the active changelog to its five-entry limit, preserving the oldest complete entry in archive/AI_CHANGELOG-2026-Q4.md.

### Verification

- Draft PR #91 implementation commit d11f2860bbd7e3d86cd5d1d2eb27ea220386f139 passed GitHub Actions CI run 39950994488 (including the build and homepage verifier); the Cloudflare Pages check passed.
- Cloudflare Pages preview deployment f66cd7ab-3b4f-4733-86b3-cc22bfcb1b52 completed its build and deploy stages successfully for that commit. Preview: https://f66cd7ab.wala-katha.pages.dev.
- The preview returned HTTP 200. Local headless Chromium screenshots at 320, 360, 390, 430, 768, 1024, and 1280 pixels showed the H1 centered, with no clipping or overlap and no unnecessary block of space below it.
- The Cloudflare Browser Rendering API returned HTTP 429 for a multi-viewport request; local Chromium screenshots were used for the viewport review instead.
- PR #91 remains a draft; its auto-merge workflow was skipped. No merge or Production deployment occurred.

## 2026-10-23 — Correction: make the Sinhala title typography-only

### Request and changes

- The user rejected the red X and silhouette treatment and asked to remove the pictures, styling the Sinhala title itself instead.
- Remove all figure markup, CSS silhouette geometry, and red X layers. Center the existing H1 and style it with clear warm-white type, a subtle site-brand teal glow, and a fine teal underline. Keep the H1, SEO metadata, and page content unchanged; add no image or external asset.
- The first mobile screenshot confirmed the text-only direction but showed the teal underline was too muted; brighten it for clear contrast while keeping the accent restrained.
- Update the homepage verifier to require a responsive text-only title and prohibit title figures or image/vector markup. This correction supersedes the previous entry's design direction; its verification remains historical.

### Verification status

- Final visual commit `59ca86fa2dce115d4235bed4b8e2f08f1fee040b` on draft PR #89 passed GitHub Actions CI run `39922499590`.
- Cloudflare Pages preview deployment `e89f24d1-b255-4655-8632-81c684536d57` completed all five stages successfully for that commit. Preview: https://e89f24d1.wala-katha.pages.dev. The homepage returned HTTP 200; all 174/174 available deployment-log records, including container logs, were inspected and none matched error, fatal, failure, exception, or warning markers.
- Rendered HTML retains the exact Sinhala H1 `සිංහල වල් කතා සහ වැල් කතා` and has no figure/image/vector/canvas markup in the title region. Compiled title CSS has no silhouette or clip-path rules. Browser-rendered title-region screenshots at 462×900 mobile and 1280×900 desktop confirm centered warm-white Sinhala typography and the brighter teal-mint underline, with no decorative picture.
- PR #89 remains a draft; no merge or production deployment has been performed.

### Latest documentation-only head verification

- The final visual implementation remains `59ca86fa2dce115d4235bed4b8e2f08f1fee040b`; the latest PR head `15e97f8f4ad77786b938e8819edc595fa0bc88aa` changes only this changelog. GitHub Actions CI run `39923064467` completed successfully; every step in the Type-check and production build job passed.
- Cloudflare Pages preview deployment `2378bd5f-015f-4a06-b3bc-ea4b7ab229c5` for the latest head completed all five stages successfully. Preview: https://2378bd5f.wala-katha.pages.dev; branch alias: https://design-homepage-title-text-o.wala-katha.pages.dev.
- A direct HTTP GET of the latest preview returned 200. All 174 available deployment-log records, including container logs, were checked; none matched error, failed, failure, warning, warn, fatal, or exception markers.
- Cloudflare still lists Production on `main` at commit `e6128b7d72b5f00e5f28f9cc323576396d5a9f25`. PR #89 remains a draft and unmerged; no production deployment was made.

### Production rollout correction (2026-10-23)

- Correction to the preview-time status above: after the user approved release, PR #89 was marked ready and squash-merged by `github-actions[bot]` as commit `6648977aea400a5e38e1227d928d1724c53d90b0`. This supersedes the earlier draft/unreleased status.
- Cloudflare Pages Production deployment `b6e2ea19-2bfe-4c57-83bc-426df10ef3f1` for that exact `main` commit completed all five stages successfully.
- `https://walakatha.net/` redirected to `https://www.walakatha.net/`; both returned HTTP 200. The live page retained the exact Sinhala H1 `සිංහල වල් කතා සහ වැල් කතා`, the teal accent CSS, and no `img`, `figure`, `svg`, `picture`, or `canvas` elements in the title region.
- All 174 available Production deployment-log records, including container logs, were checked; none matched error, failure, warning, fatal, or exception markers.
- GitHub Actions CI run `39932966097` passed on the approved PR head `7dc9964796726f8696f159b5f5a80e954839ec27`; the required Cloudflare Pages check passed on the merge commit. No site code changed in this documentation correction.
