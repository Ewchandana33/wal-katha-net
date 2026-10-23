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

## 2026-10-23 — Tighten the homepage title layout and redraw its feminine silhouette

### Request and changes

- Review of the supplied phone screenshot found the title stage reserved 8.5rem of mobile height while the figure itself reserved 128px; this pushed the featured story down and left unnecessary space.
- Reduced the title stage, then browser screenshot review caught CSS grid auto-placement putting the H1 under the figure; explicitly anchored both to row 1 and increased the mobile figure to 110px for a clearer, more legible side-by-side layout.
- Trimmed the title-to-slider gap and changed the neon red heading to restrained warm ivory on black.
- Redrew the decorative white figure as a CSS-only silhouette with flowing hair, a defined waist/hips, and a fitted full-length shape. No photo, image file, inline SVG, canvas, font, or external asset is added. The live Sinhala H1 and SEO metadata stay unchanged.
- Strengthened the homepage regression verifier for the no-image design, compact mobile spacing, and silhouette geometry.

### Verification status

- Implementation and preview verification are pending. This change is on the existing draft PR #89; no merge or production deployment has been performed.

## 2026-10-23 — Replace the abstract title ornament with a white side silhouette

### Request and changes

- Replaced the ambiguous red line-art ornament with a clear, solid white full-body feminine silhouette positioned beside the live Sinhala title, inspired by the supplied black-background reference.
- Draw the silhouette with CSS clip-path geometry and a polygon fallback; no picture, SVG, canvas, font, or external asset is added.
- Keep the subtitle removed, the H1 and SEO metadata unchanged, and the layout responsive. Extend the verifier to check the white CSS silhouette and side-by-side layout.

### Verification status

- Implementation commit `d2cc6a2d104849b64f10e8c68a86f625e76cbf9f` is in draft PR #89. GitHub Actions CI run `39899734051` completed successfully.
- Cloudflare Pages preview deployment `906e66ec-5649-43d5-9d1d-eb342e5e1a64` completed all five stages successfully for that commit. Preview URL: https://906e66ec.wala-katha.pages.dev; branch alias: https://design-homepage-title-text-o.wala-katha.pages.dev.
- Direct HTTP GET of the preview returned 200. The rendered title kept the exact Sinhala H1, included the solid white CSS silhouette beside it, omitted “WAL KATHA”, and contained no img/svg/picture/canvas markup in the title region. The downloaded compiled CSS contains the white gradient silhouette, CSS path clip, right-side title column, and responsive 480px rule.
- PR #89 remains a draft; no merge or production deployment was performed.

## 2026-10-23 — Replace the title subtitle with a CSS-drawn feminine accent

### Request and changes

- Removed the small white “WAL KATHA” line and added a restrained red line-art feminine silhouette inspired by the supplied reference. The illustration is built from HTML spans and CSS borders/curves only; no picture, inline SVG, canvas, or external asset is used.
- Kept the Sinhala H1 as live text, the open/no-card layout, existing metadata, and the responsive red title treatment.
- Updated the homepage verifier to require the CSS ornament and no subtitle or image markup.

### Verification status

- Implementation commit `b719ac0feadab16e69f7a614aac0772ddd8f242e` is in draft PR #89. GitHub Actions CI run `39898274324` completed successfully.
- Cloudflare Pages preview deployment `dbedd595-8f71-41d5-8774-9a80dcfcd033` completed all five stages successfully for that commit. Preview URL: https://dbedd595.wala-katha.pages.dev; branch alias: https://design-homepage-title-text-o.wala-katha.pages.dev.
- Direct HTTP GET of the preview returned 200. The rendered title region kept the exact Sinhala H1, included the CSS-drawn figure, omitted “WAL KATHA”, and contained no img/svg/picture/canvas markup. The downloaded compiled CSS contains the figure selectors, red title rule, and the responsive 480px media rule.
- PR #89 remains a draft; no merge or production deployment was performed.

## 2026-10-23 — Replace the boxed portrait with a text-only Sinhala title

### Request and changes

- Replaced the framed homepage title and inline SVG portrait with an open, image-free layout inspired by the supplied black, red, and white reference.
- The existing Sinhala H1 remains live selectable text; the red title, small white “WAL KATHA” line, and fine accent are CSS typography only. No external image or font request is added, and metadata and page content remain unchanged.
- Updated the homepage verifier to require no image/vector in the title, no card background/border/shadow, and responsive title styling.

### Verification status

- Baseline: `main` commit `e6128b7d72b5f00e5f28f9cc323576396d5a9f25`; Cloudflare production deployment `0b63a573-715a-419d-9784-0d1622261892` completed successfully on 2026-10-21.
- Feature commit `c29b93bce834b14171c6deb65fecd6f754bdacfd` is in draft PR #89. GitHub Actions CI run `39894201131` succeeded; auto-merge run `39894201205` was skipped because the PR is draft.
- Cloudflare Pages preview deployment `42dd8d50-3abe-4e69-a6f3-1ec7c0f7f632` completed all five stages successfully. The preview root returned HTTP 200 and showed the unchanged Sinhala H1 plus the white WAL KATHA line, with no image/vector markup in the title region.
- Preview URL: https://42dd8d50.wala-katha.pages.dev (branch alias: https://design-homepage-title-text-o.wala-katha.pages.dev). No merge or production deployment has been performed.

## 2026-10-19 — Rebuild the homepage title in a premium black-and-gold layout

### Request and changes

- The user asked to remove the current title treatment and rebuild it in a premium style, with a seated adult woman at the far right of the title.
- Replaced the centered ivory title and small gold divider with a responsive dark black/brown panel, fine gold edge lighting, bold warm-gold Sinhala text, and an original inline vector illustration of a fully clothed adult woman seated at the right. The heading remains live, selectable Sinhala text; the illustration is decorative and hidden from assistive technology. No image download or font request was added.
- Kept the page title, description, canonical/hreflang, structured data, navigation logo, and post content unchanged.
- Updated the homepage verifier to check the new right-side portrait layout, live H1, and responsive wrapping.

### Verification status

- Branch created: `design/homepage-title-premium-20261019`. Changes are prepared for review only; no merge or production deployment has been performed.
- Automated build, type-check, SEO verifier, and visual mobile/desktop review are pending because no local build environment was run during this GitHub edit.
- This is a visual-only change; no search ranking or traffic outcome is claimed.

## Status snapshot — 2026-10-19

- Cloudflare Pages project wala-katha is connected to Ewchandana33/wal-katha-net on main and serves walakatha.net and www.walakatha.net. The latest production deployment is be27a7f1-3390-4249-a329-772985b723a1, targeting main commit a1183c38b510a6bada150514af64fd32783ce9cb (PR #78); the deployment reports success.
- A direct live SEO/locale audit on 2026-10-17 found the www homepage returns 200, the apex host redirects to www, and robots.txt plus the sitemap chain are available. All 26 URLs in sitemap-0.xml returned 200 and passed canonical, Sinhala-language, description, si-LK/x-default hreflang, and si_LK Open Graph checks; no noindex page was listed in that sitemap. The existing dedicated live verifier also checks the configured noindex article separately.
- PR #67 is the current released PDF renderer: all seven versioned production downloads returned HTTP 200 as application/pdf attachments with X-Robots-Tag noindex, nofollow. PDF.js verified the author-rights notice on each last story page, all requested rights sections on each final page, one centered URL watermark per interior page only, and footer/page numbers on all 74 pages. Production pages 12–13 of the 13-page Akkai Nangi PDF were rendered and reviewed.
- PR #62 expands the 18+ notice on every generated reader-PDF cover. Its PDF verifier passed for all seven published articles; live checks confirmed all seven SHA-256-versioned links return application/pdf attachments with X-Robots-Tag: noindex, nofollow, and the required first-page notice/story ordering. Reader PDFs remain excluded from sitemaps, and the configured bus-jack-wal-katha article remains noindex,follow.
- Latest verified Search Console keyword-sync run is `38700591415` (2026-10-15), before the 2026-10-16 PDF/cache release. Its export covers 2026-07-15–2026-10-12 (500 global queries, 394 usable queries, 46 pages); the homepage query `වැල්` had 4,075 impressions, 90 clicks, 2.21% calculated CTR, and average position 5.2 in that historical window. The post-recrawl follow-up run `38726508677` succeeded but skipped its report-PR step because its data gates were not met. These records do not demonstrate a post-release ranking or traffic effect.
- Keep the comparison gates for any later claim: Google-indexed verdict, a crawl at or after the snippet release, at least seven days after deployment, a complete 28-day post-crawl window plus three-day data lag, and at least 500 impressions in each global comparison window. Label Sri Lanka separately and directional when either window has fewer than 100 impressions.
- PageSpeed status: the 2026-10-17 mobile baseline scored 79; the distinct 2026-10-18 mobile snapshot scored Performance 87 and SEO/Accessibility/Best Practices 100, with lab LCP 3.5 s, TBT 0 ms, CLS 0. It attributed 586 ms forced reflow to Astro ClientRouter; PR #74 now excludes that asset from fresh homepage HTML. No post-PR #74 PageSpeed run is available, so a new score or measured reduction is unverified; desktop remains unverified. Prior PSI API reruns were quota-blocked with 429.
## Archive index

- archive/AI_CHANGELOG-2026-Q4.md — 47 earlier dated entries from 2026-10-14 through 2026-10-19; dated sections are retained verbatim.

## Recent entries

## 2026-10-19 — Restyle the homepage Sinhala heading with gold accents

### Request and cause

- The supplied mobile screenshot shows the homepage H1 surrounded by green vine artwork and emerald styling that conflicts with the site's dark surface and gold wordmark.

### Changes

- Remove the H1's inline green vine SVG and its unused CSS rules. Keep the exact live Sinhala H1 text and all page metadata unchanged.
- Use warm ivory text with a restrained gold divider and centered diamond, matching the existing wordmark palette. Preserve balanced wrapping on small screens; add no image or font request.
- Update the homepage SEO verifier to require the gold treatment, responsive live text, and absence of the previous SVG/green title palette.

### Verification status

- Baseline at 0ecfdad13a46151ade0ef0d6bef458a6c9f28ff6: yarn test passed (8/8), yarn check passed, yarn build passed (50 pages), and the homepage SEO verifier passed. Existing dependency-resolution and Node deprecation warnings were observed.
- After the change: yarn test passed (8/8); yarn check passed; yarn build passed (50 pages, including PDF, featured-link, social metadata, critical CSS, and homepage-performance checks); node scripts/verify-homepage-seo.mjs and node scripts/ai-changelog.test.mjs passed; git diff --check passed. The generated homepage contains no title SVG, and compiled CSS contains the ivory/gold title styles.
- Draft PR #82 is open on branch `fix/homepage-title-gold-20261019`. Initial implementation commit `a9f1e060e8af84323182e2342bbf4b2338249bc0` passed the Type-check and production build check (run 39239296763, job 118015932982). Cloudflare Pages check and preview deployment `2619e587-44cd-44bd-94bf-5e9bb3323c22` succeeded; PR preview: https://2619e587.wala-katha.pages.dev; branch preview: https://fix-homepage-title-gold-2026.wala-katha.pages.dev. Existing draft PR #81 was left unchanged. No production deployment was started.
- Scope is presentation-only; H1 text, SEO metadata, navigation, and other homepage content remain unchanged. No ranking or traffic outcome is claimed.
