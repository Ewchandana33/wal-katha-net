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

- archive/AI_CHANGELOG-2026-Q4.md — 56 earlier dated entries from 2026-10-14 through 2026-10-24; dated sections are retained verbatim.

## Recent entries

## 2026-10-24 — Correct the feature placement as a standalone page

### Request and changes

- Supersedes the placement described in the earlier entry “Add online, audio, and PDF feature article.” The user clarified that this must be a standalone page like Privacy Policy, not a blog post.
- Removed the entry from src/content/posts and added it to src/content/pages/online-wal-katha-audio-pdf.md. Its direct route is /online-wal-katha-audio-pdf/. Moved the supplied banner to public/images/pages/online-wal-katha-audio-pdf.webp. No homepage, menu, or footer link was added; the homepage loads only posts.
- Added explicit legacy redirects from both /blog/online-wal-katha-audio-pdf/ and the non-trailing-slash variant to the standalone page. The build-time redirect fixer initially sent the deleted post URL to /categories/wal-katha/; the explicit rule corrects that destination.
- The work remains on feature branch content/online-wal-katha-audio-pdf-20261024 in draft PR #92. No merge or Production deployment.

### Verification

- Final code commit 0317f857c3347d3dbd5c2543d51045621e5b380c passed GitHub Actions CI run 40088184523. Astro check reported 0 errors, 0 warnings, and 27 hints. CI logs still contain existing Node DEP0040/DEP0169 deprecations and warnings in unchanged source files; none identify this page or redirect rule.
- Cloudflare Pages Preview deployment 70b81d1c-9ac7-4c45-868e-e91f2cc62652 completed all five stages successfully for that commit: https://70b81d1c.wala-katha.pages.dev. All 175 available deployment-log records, including container logs, were checked; none matched warning, error, failed, fatal, or exception markers.
- Direct page returned HTTP 200 with the expected canonical URL, title, and description; the banner returned HTTP 200 image/webp. The former blog URL returned 301 to /online-wal-katha-audio-pdf/, and the no-slash page URL returned 308 to its canonical trailing-slash URL. The Preview homepage HTML contained neither the page slug nor its title.
- Desktop (1365×900) and mobile (390×844) captures showed the site's 18+ confirmation gate at both sizes; it was not bypassed. Preview responses are noindex. Production main remains at bb5215476fa976a3a1983299dd218fc641f0c56f pending explicit approval.

## 2026-10-24 — Add online, audio, and PDF feature article

### Request and changes

- Added the Sinhala article at `/blog/online-wal-katha-audio-pdf/` with the supplied SEO title and description, story-availability caveat, and a styled CTA to the site. Added the supplied 1672×940 banner, optimized to 208,738-byte WebP.
- Kept the change on feature branch `content/online-wal-katha-audio-pdf-20261024` in draft PR #92; no merge or Production deployment.

### Verification

- GitHub Actions CI run `40085379078` passed on article commit `15aac01abfe09e0576127aee8b99f98f8b4b1c44`, including Astro type-check, tests, alt-text policy, static build, pagination SEO, and homepage SEO. Astro reported 0 errors, 0 warnings, and 27 hints. CI logs still contain the existing Node `DEP0040`/`DEP0169` deprecations and diagnostics in unchanged files; none identify the new article or image.
- Cloudflare Pages Preview deployment `1d01ee11-5d0f-47d3-874f-b49ff42036a5` succeeded through all five stages for the same commit: https://1d01ee11.wala-katha.pages.dev. All 185 available deployment-log records were checked; none matched warning, error, failed, fatal, or exception markers.
- Preview article URL returned HTTP 200 with the requested title, description, canonical URL, CTA, and 18+ banner; the WebP returned HTTP 200. Desktop (1365×900) and mobile (390×844) Chromium captures showed the site's existing 18+ confirmation gate at both sizes. Did not confirm/bypass the age gate. The Preview response is noindex, as expected; Production remains unchanged pending explicit approval.

## 2026-10-24 — Correction: render the Sinhala homepage title as text

### Request and changes

- The user explicitly requested a text-only title matching the supplied reference. The latest change on draft PR #91 had replaced the live Sinhala title with a WebP image, contrary to that requirement.
- Restored the selectable H1 text `සිංහල වැල් කතා සහ වැල් කතා`, with gold and ivory metallic gradients, restrained red glow, the red underline with centered gold highlight, and the outlined 18+ badge. Kept the accessible H1 label and responsive sizing.
- Removed `public/images/home-title-reference.webp` and restored the homepage verifier checks for visible live text, no title image/vector markup, and no CSS `url(...)` references in the title styles (CSS gradients remain allowed). No unrelated page content or dependencies changed.
- This supersedes the 2026-10-23 entry “Use the exact reference artwork for the homepage title”; that entry remains as historical context, not the current design requirement.
- PR #91 remains a draft. No merge or Production deployment.

### Verification

- `yarn test`: 8 passed, 0 failed. Additional CI unit tests (`gsc-ctr-followup`, `alt-text-policy`, `post-files`, and `ai-changelog`): 12 passed, 0 failed.
- `git diff --check` and `node --check scripts/verify-homepage-seo.mjs` passed.
- GitHub Actions run `40056061033` passed for code commit `c6a7b18570701456ae4ac6fdfe734b9e79bf2a75`, including Astro type-check, tests, production build, and the homepage verifier.
- Cloudflare Pages Preview deployment `bb8f13e5-0c03-4cb9-b3b7-d526afaa6ee3` completed all five stages successfully for that exact commit: https://bb8f13e5.wala-katha.pages.dev. The homepage returned HTTP 200; the H1 renders the exact Sinhala wording as live text, the title region has no image/vector/canvas markup, and the compiled CSS contains the gold/ivory gradients, red glow/underline, and 18+ badge.
- Cloudflare returned 174/174 deployment-log entries; none matched warning, error, failed, failure, fatal, or exception markers.
- Local verification: `yarn test` 8/8 passed; the four additional CI unit-test files 12/12 passed; `git diff --check` and `node --check scripts/verify-homepage-seo.mjs` passed. A local Astro build was not completed because the workspace restarted during dependency installation; the successful GitHub CI run supplies the full build/type-check evidence.
- PR #91 remains a draft on `main`; auto-merge was skipped. No merge or Production deployment.


### Text-only title regression follow-up (2026-10-24)

- Tightened `scripts/verify-homepage-seo.mjs` to reject `url(...)` references in homepage title CSS while allowing CSS gradients; no page markup, styling, or runtime behavior changed.
- Commit `4b16e2baffb1365621592cb7c5cdb9c90194b87a` on draft PR #91 passed GitHub Actions CI run `40059714365`, including the Type-check and production-build check. Cloudflare Pages Preview deployment `c80a2543-8194-4046-8c89-d0f6aa5286ab` completed queued, initialize, clone, build, and deploy stages successfully: https://c80a2543.wala-katha.pages.dev.
- The deployed homepage returned HTTP 200; its H1 and accessible label render `සිංහල වැල් කතා සහ වැල් කතා`, the title region contains no image/vector markup, and the page does not reference `home-title-reference.webp`. Cloudflare returned 174/174 deployment-log entries; none matched warning, error, failure, fatal, or exception markers.
- PR #91 remains open as a draft against `main`; no merge or Production deployment was performed.

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
