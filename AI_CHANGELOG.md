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

- archive/AI_CHANGELOG-2026-Q4.md — 58 earlier dated entries from 2026-10-14 through 2026-10-24; dated sections are retained verbatim.

## Recent entries

## 2026-10-25 — Preserve other slider images when fitting the supplied banner

### Correction

- Corrects and supersedes the 16:9 first-slide frame described in the 2026-10-24 entry, “Replace first homepage slider banner with supplied artwork.” The user’s screenshot showed an extra dark band on a neighboring True Story slide.
- Comparing Preview commit 51a5b1e and Production commit 354a3a in Chromium showed the new 16:9 first frame raised the shared mobile track to 239px at a 461px viewport, while story frames stayed 213.5px. The image-box crop behavior for those story slides was unchanged, but the track-height increase left extra space and shifted the page. At desktop, that first frame was 523.81px compared with the existing shared story frame of 311.33px.
- Restored the original shared 16/8, 21/8, and 24/8 responsive frame for all slides. The supplied banner still uses object-contain with its 700x392 mobile and 1200x673 desktop WebPs, over a blurred copy of itself to fill the remaining frame area. This keeps the full artwork visible without crop or black side bars and restores other slides to the original height/frames. Story slides retain their existing object-cover behavior.

### Verification

- Code fix commit 41c48385ece1c8f71fda8b77ada7e863954599b1 on draft PR #96 passed GitHub Actions CI run 40121133569, including Astro type-check, configured tests, static build, and SEO checks.
- Cloudflare Pages Preview deployment 08da2250-e161-4dd6-9321-7d31488af98d for that exact commit completed queue, initialize, clone, build, and deploy successfully. The homepage returned HTTP 200; both banner variants returned HTTP 200 at 1200x673 desktop (68,082 bytes) and 700x392 mobile (40,334 bytes). Preview: https://08da2250.wala-katha.pages.dev.
- Chromium comparison at 461x1024 showed Preview and Production both at 220px track height, with all four slide frames at 427x213.5px; the updated mobile banner loaded at 700x392 with object-fit: contain. At 1280x900 both tracks were 360px and each slide frame was 934x311.33px; the desktop banner loaded at 1200x673. The browser screenshot remained behind the site's age-confirmation overlay; it was not bypassed.
- PR #96 remains a draft. No merge or Production deployment occurred.

## 2026-10-24 — Replace first homepage slider banner with supplied artwork

### Request and changes

- Replaced the first auto-rotating banner below the Sinhala homepage title with the supplied image, preserving the full artwork. Desktop and mobile frame ratios now match their responsive assets, so the image fits without cropping or black side gutters; the other story slides keep their existing layout.
- Updated src/layouts/components/FeaturedSlider.astro and replaced public/images/slider/online-wal-katha-audio-pdf.jpg. The repository Sharp optimizer generated 1200x673 desktop and 700x392 mobile WebP variants and updated the source hash sidecar.
- Kept the work in draft PR #96. No merge or Production deployment.

### Verification

- Code commit d7396326af595ea5ef1a41c5bf5f9918357ccf00 passed CI run 40118949962. Sharp optimizer run 40119397703 completed successfully and created asset/hash commit c54bd9aac3237519ee6eb35d572f009a87a6cf02. Automatic PR CI run 40119426279 for that bot-created commit ended action_required without jobs; manually dispatching CI on the exact c54bd9a head (run 40119649313) passed Astro type-check, all configured tests, static build, and homepage/pagination SEO checks.
- Cloudflare Pages Preview deployment 0003f97e-e5fc-434e-b9c7-5f00c0e7906b for c54bd9a completed queue, initialize, clone, build, and deploy successfully. The Preview homepage and both versioned image assets returned HTTP 200. Desktop WebP is 1200x673 (68,082 bytes); mobile WebP is 700x392 (40,334 bytes). All 175 available deployment-log records were checked; none matched warning, error, failure, fatal, or exception markers. Preview: https://0003f97e.wala-katha.pages.dev.
- Headless Chromium at 1280x900 loaded the desktop image and at 390x844 loaded the mobile image; both were complete with object-fit: contain. Measured frame/image ratios were 1.78308/1.78306 (desktop) and 1.78572/1.78571 (mobile), confirming a ratio-matched fit. No age-confirmation gate was bypassed.
- PR #96 remains a draft. No production merge or deployment occurred.

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
