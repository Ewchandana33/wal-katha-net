# Archived AI changelog entries

Older dated entries were moved here to keep the five newest dated entries in AI_CHANGELOG.md. The entries below are preserved from the main changelog.

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
