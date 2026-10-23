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

- archive/AI_CHANGELOG-2026-Q4.md — 2026-10-14 through 2026-10-23; 49 dated entries.

## 2026-10-23 — Match the homepage title to the gold/red reference

### Request and changes

- Correct the title styling that looked too dim and sat too close to the content below.
- Preserve the exact selectable Sinhala H1 and existing font; brighten the metallic gold and ivory gradients, add restrained crimson edge glow and depth, restore the outlined 18+ badge, lengthen the red underline with a centered gold highlight, and add controlled space below the title.
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

## 2026-10-23 — Tighten the homepage title layout and redraw its feminine silhouette

### Request and changes

- Review of the supplied phone screenshot found the title stage reserved 8.5rem of mobile height while the figure itself reserved 128px; this pushed the featured story down and left unnecessary space.
- Reduced the title stage, then browser screenshot review caught CSS grid auto-placement putting the H1 under the figure; explicitly anchored both to row 1 and increased the mobile figure to 110px for a clearer, more legible side-by-side layout.
- Trimmed the title-to-slider gap and changed the neon red heading to restrained warm ivory on black.
- Redrew the decorative white figure as a CSS-only silhouette with flowing hair, a defined waist/hips, and a fitted full-length shape. No photo, image file, inline SVG, canvas, font, or external asset is added. The live Sinhala H1 and SEO metadata stay unchanged.
- Strengthened the homepage regression verifier for the no-image design, compact mobile spacing, and silhouette geometry.

### Verification status

- Implementation and preview verification are pending. This change is on the existing draft PR #89; no merge or production deployment has been performed.
