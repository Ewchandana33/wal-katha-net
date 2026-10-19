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

## Status snapshot — 2026-10-19

- Cloudflare Pages project wala-katha is connected to Ewchandana33/wal-katha-net on main and serves walakatha.net and www.walakatha.net. The latest production deployment is be27a7f1-3390-4249-a329-772985b723a1, targeting main commit a1183c38b510a6bada150514af64fd32783ce9cb (PR #78); the deployment reports success.
- A direct live SEO/locale audit on 2026-10-17 found the www homepage returns 200, the apex host redirects to www, and robots.txt plus the sitemap chain are available. All 26 URLs in sitemap-0.xml returned 200 and passed canonical, Sinhala-language, description, si-LK/x-default hreflang, and si_LK Open Graph checks; no noindex page was listed in that sitemap. The existing dedicated live verifier also checks the configured noindex article separately.
- PR #67 is the current released PDF renderer: all seven versioned production downloads returned HTTP 200 as application/pdf attachments with X-Robots-Tag noindex, nofollow. PDF.js verified the author-rights notice on each last story page, all requested rights sections on each final page, one centered URL watermark per interior page only, and footer/page numbers on all 74 pages. Production pages 12–13 of the 13-page Akkai Nangi PDF were rendered and reviewed.
- PR #62 expands the 18+ notice on every generated reader-PDF cover. Its PDF verifier passed for all seven published articles; live checks confirmed all seven SHA-256-versioned links return application/pdf attachments with X-Robots-Tag: noindex, nofollow, and the required first-page notice/story ordering. Reader PDFs remain excluded from sitemaps, and the configured bus-jack-wal-katha article remains noindex,follow.
- Latest verified Search Console keyword-sync run is `38700591415` (2026-10-15), before the 2026-10-16 PDF/cache release. Its export covers 2026-07-15–2026-10-12 (500 global queries, 394 usable queries, 46 pages); the homepage query `වැල්` had 4,075 impressions, 90 clicks, 2.21% calculated CTR, and average position 5.2 in that historical window. The post-recrawl follow-up run `38726508677` succeeded but skipped its report-PR step because its data gates were not met. These records do not demonstrate a post-release ranking or traffic effect.
- Keep the comparison gates for any later claim: Google-indexed verdict, a crawl at or after the snippet release, at least seven days after deployment, a complete 28-day post-crawl window plus three-day data lag, and at least 500 impressions in each global comparison window. Label Sri Lanka separately and directional when either window has fewer than 100 impressions.
- PageSpeed status: the 2026-10-17 mobile baseline scored 79; the distinct 2026-10-18 mobile snapshot scored Performance 87 and SEO/Accessibility/Best Practices 100, with lab LCP 3.5 s, TBT 0 ms, CLS 0. It attributed 586 ms forced reflow to Astro ClientRouter; PR #74 now excludes that asset from fresh homepage HTML. No post-PR #74 PageSpeed run is available, so a new score or measured reduction is unverified; desktop remains unverified. Prior PSI API reruns were quota-blocked with 429.
## Archive index

- archive/AI_CHANGELOG-2026-Q4.md — 43 earlier dated entries from 2026-10-14 through 2026-10-18; dated sections are retained verbatim.

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
- GitHub PR/CI and Cloudflare preview checks are pending publication of the feature branch. No production deployment was started.
- Scope is presentation-only; H1 text, SEO metadata, navigation, and other homepage content remain unchanged. No ranking or traffic outcome is claimed.

## 2026-10-19 — Improve readability of the homepage Sinhala title

### Cause

- The supplied mobile screenshot shows the live homepage title as small and hard to read. PR #77 already added the green bevel and vine ornament, so this is a refinement of the deployed treatment rather than a duplicate implementation.
- The title's layered pseudo-text strokes and `white-space: nowrap` make the small-screen heading busier and less adaptable.

### Changes

- Keep the exact Sinhala H1 text, accessible inline SVG leaves, navigation logo, and all page metadata unchanged.
- Remove the stacked bevel text and heavy shadows; use high-contrast warm-white text, a restrained emerald halo/rule, subdued leaves, and balanced wrapping at narrow widths.
- Do not load the repository's 1.18 MB Sinhala TTF as a new homepage asset; this visual correction adds no font or image request.
- Update the homepage verifier to enforce responsive wrapping and the simpler, high-contrast text treatment.

### Verification status

- Baseline at `a1183c38b510a6bada150514af64fd32783ce9cb`: `yarn test` passed (8/8), `yarn check` and `yarn build` passed; the build generated 50 pages.
- After the change: `yarn test` passed (8/8), `yarn check` passed, `yarn build` passed (50 pages and existing content/PDF/link/metadata/performance checks), `node scripts/verify-homepage-seo.mjs` passed, and `git diff --check` passed. Existing dependency-resolution and Node deprecation warnings also appeared in the baseline; no lockfile or dependency was changed.
- GitHub Actions CI run `39200122901` (run 122) completed successfully for commit `c75c2f477a90c88bbf51d40613c6c23bbeece5ec`; the required “Type-check and production build” check passed.
- Cloudflare preview deployment `f6cca663-fe36-4584-a49d-c211b035290e` for that commit completed successfully. Both `https://f6cca663.wala-katha.pages.dev` and the stable branch preview `https://fix-homepage-sinhala-title-c.wala-katha.pages.dev` returned HTTP 200. All 174 deployment-log records, including container logs, were checked; none matched warning, deprecation, error, fatal, failure, or exception markers.
- The live preview HTML was compared with production: the H1 text, title, description, canonical URL, and `si-LK`/`x-default` hreflang values are unchanged. The preview serves a live-text H1 with an accessible decorative SVG, no `data-title` bevel source, and the new title color in its compiled CSS. The production homepage also returned HTTP 200.
- Final PR-head audit at `18f9984120f130da2fee8883e81ea1cba3242940`: GitHub Actions run `39200819703` passed the required Type-check and production-build check. Cloudflare preview deployment `33744822-03e4-48b3-ac7f-63c36b120c95` completed all five stages successfully; both `https://33744822.wala-katha.pages.dev` and `https://fix-homepage-sinhala-title-c.wala-katha.pages.dev` returned HTTP 200. Direct live checks found the preview H1, title, description, canonical URL, and `si-LK`/`x-default` hreflang equal to production; the bevel `data-title` source is absent from preview HTML. The Cloudflare logs API reports 174 total entries but returned 173 entries; all 173 returned entries were scanned and none matched warning, deprecation, error, fatal, failure, or exception markers. One entry was not returned and remains unverified. Production remained on commit `a1183c38b510a6bada150514af64fd32783ce9cb` (deployment `be27a7f1-3390-4249-a329-772985b723a1`); PR #79 was not merged or deployed to production.
- PR #79 remains open as a draft; this change has not been merged or deployed to production.
- This is a presentation-only change; no ranking or traffic result is claimed.

## 2026-10-19 — Style the homepage Sinhala title to match the supplied reference

### Request

- The user asked to style the existing homepage title like the supplied ornamental green reference, not to place the reference image or a logo in the page. Keep the live title text and navigation logo unchanged.

### Changes

- Keep the exact H1 as live, selectable Sinhala text and style it with a transparent background, a layered green metallic gradient/bevel, and an aria-hidden inline SVG vine-and-leaf ornament. No image asset or additional font download is used; the navigation logo, page title, metadata, canonical URLs, hreflang, and content remain unchanged.
- Extend the homepage verifier to check the unchanged H1 text, real text content, decorative SVG accessibility, no image inside the title, transparent background, single-line title, and narrow-screen styling.

### Verification status

- Local `yarn test`: PASS (8 tests). Local `yarn build`: PASS (50 static pages; PDF, featured-link, social metadata, critical CSS, and homepage-performance verifiers passed). `node scripts/verify-homepage-seo.mjs`: PASS. `git diff --check`: PASS.
- The default Prettier check cannot resolve the Astro parser from the existing configuration. With the Astro plugin loaded explicitly, the same three files already fail the check at the pristine base commit; the added sections match Prettier output, and no unrelated formatting was applied.
- GitHub Actions CI run `39187074164` passed Astro type-checking, regression-test steps, the static production build, and pagination/homepage SEO verifiers for commit `f648c1c9e1e57dc62f3e7df44070a2dd3575c0cb`; the Cloudflare Pages check also passed.
- Cloudflare preview deployment `d52ec353-b722-4f12-9ab6-fe2693aacc8e` built that same branch commit and completed all five stages successfully. All 174 returned deployment-log entries, including container logs, were checked; none contained warning, deprecation, error, fatal, failure, or exception markers. The deployment URL and stable branch-preview URL returned HTTP 200. Preview HTML retained the exact text H1 and decorative, `aria-hidden` SVG; title, description, canonical URL, `si-LK` hreflang, and `x-default` hreflang matched production.
- PR #77 was squash-merged as `997d359fa5565c3faa4e800f16a4b649ff00f705`; `main` and Cloudflare production now target that commit. Production deployment `146f296d-41bb-4330-98b4-4d427e9f2b25` completed all five stages successfully. All 174 deployment-log entries, including container logs, were checked; none contained warning, deprecation, error, fatal, failure, or exception markers. The live homepage returned HTTP 200 and serves the exact H1 with its decorative, `aria-hidden` SVG; title, description, canonical URL, `si-LK` and `x-default` hreflang remain unchanged. No Search Console ranking or AI-citation impact is claimed.
- SEO/GEO boundary: this change is visual-only around the live heading; no page metadata, canonical/hreflang, structured data, or content was changed. No search-ranking or AI citation outcome is claimed.

## 2026-10-18 — Restore the copy-protection notice styles

### Root cause

- Commit `4988719ab06c769a2c7aa1abf409b1370f82503f` removed the global content-protection toast styles and text-selection/drag protections from `Base.astro`; the deferred JavaScript still blocks normal copy/context-menu attempts and schedules the notice to hide after 2.6 seconds.
- The live page still serves the handler script, but the production stylesheets contain no toast selector, so the notice loses its centered popup presentation.

### Changes

- Restore the centered, initially hidden toast and its visible state, icon/text styling, reduced-motion behavior, and casual text-selection/image-drag protections. Editable fields and the explicitly allowed reader-tools root remain selectable.
- Add `scripts/content-protection.test.mjs` to exercise blocked copy/context-menu events, editable-target exemptions, and timed dismissal; include it in `yarn test`.

### Verification status

- Baseline `yarn test`: PASS (5 tests). Updated `yarn test`: PASS (8 tests). `git diff --check`: PASS.
- PR #76 is a draft on `fix/copy-protection-notice-20261018`; implementation commit `6fd197909c32dfcdcb6d3c8817468d81c3c9c2d4`. GitHub Actions CI run `39098866567` passed Astro type-check, `yarn test`, static build, and SEO verifiers. Auto-merge workflow run `39098866580` was skipped because the PR is a draft.
- Cloudflare preview deployment `7469a8e2-333b-468c-a99f-9762a890c33f` completed all five stages successfully. Its preview URL returned HTTP 200; the built Base stylesheet contains the centered, hidden/shown toast rules, and the deployed deferred script returns HTTP 200 with the copy/context-menu handlers and 2.6-second timeout.
- Production remains on main commit `38aff5fa5cddb2f6b86d64634248fa0c0ff40f06`, Cloudflare deployment `413a198e-40cf-477d-8f13-c1392c22cb7a`; no production deployment was made for this fix.

### Scope and limitation

- The change restores browser-side deterrents and the notice; it cannot guarantee that publicly served content or files cannot be saved through browser tools, direct URLs, or other means.

## 2026-10-18 — Exclude Astro ClientRouter from the initial homepage load

### Why

- The attached mobile PageSpeed snapshot attributed 586 ms of homepage forced reflow to ClientRouter. The user approved a targeted fix after the previous entry deferred this decision to avoid disrupting article-reader lifecycle behavior.

### Changes

- Base.astro now renders ClientRouter only off the homepage; article and other non-home routes keep it. The homepage build verifier now fails if the router asset appears on the homepage or is missing from an article.
- A fresh visit starting at the homepage uses native navigation; pages that load ClientRouter retain their SPA behavior. SEO markup, analytics, and Cloudflare settings are unchanged.

### Verification trail

- PR #74 auto-merged as main commit 9390a592345afbfefb0a2af56df24e0bc6f0a08b. GitHub type-check/build run 39094926581 and auto-merge run 39094926639 succeeded.
- Cloudflare preview 97fc5e49-d205-4bda-8c97-7b1d9c32e69f and production 9878e271-74d0-44ef-b9cd-00a58fff947b each completed all five stages. Each deployment returned 174 log entries; no warning, deprecation, error, fatal, failure, or exception markers matched. Both builds produced 50 pages and the homepage-performance check passed.
- Preview and live checks returned HTTP 200 for homepage and /blog/akkai-nangi-wal-katha/. Both confirm no ClientRouter asset on the homepage and ClientRouter plus data-rt-root on the article. Live robots.txt and sitemap-index.xml also returned 200.
- No PageSpeed/Lighthouse run was available after PR #74. Generated and live HTML confirm the runtime is absent from a fresh homepage response, but no new score or measured 586 ms reduction is claimed; desktop result remains unverified.

### SEO boundary

- Canonical, hreflang, metadata, robots rules, sitemap, and content were unchanged. No Google ranking outcome is claimed.
