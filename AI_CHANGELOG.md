# AI Change Log

Add a dated entry for each AI-assisted code, SEO, automation, or deployment
change. Record the reason, affected files, and checks actually completed.
Treat GitHub checks and Cloudflare deployment logs as the source of truth for
release status; never infer a successful production deploy from a commit or
preview. Do not put credentials or tokens in this file.

## 2026-10-14 — Complete PR #15 image-variant CI verification

### Why

PR #15 adds build-time 16:9, 4:3, and square WebP cover variants for public,
indexable story pages. Its original GitHub CI run failed during Astro type
checking because TypeScript 6 could not reach the declarations shipped by
`sharp` 0.35.0 through that package's `exports` map. The Cloudflare preview for
the same commit built and deployed successfully, including the generated
variants; production was still on the preceding `main` commit.

### Changes

- Added a TypeScript path mapping to Sharp's shipped declaration file so the
  build-time image route is type-checked instead of implicitly typed.
- Updated `actions/checkout` and `actions/setup-node` from v4 to Node.js
  24-compatible v5 in response to the deprecation warning in the CI run.
- Created this file because `AI_CHANGELOG.md` did not previously exist on
  `main`.

### Verification trail

- Reproduced the original Sharp declaration error with `yarn run check`.
- After the path mapping, the generated Astro type definitions plus the image
  route produced zero targeted TypeScript diagnostics.
- `yarn test`: 5 tests passed, 0 failed.
- The pre-fix Cloudflare preview deployment for PR #15 completed successfully
  (`8b6e8cde-cfbe-4dc3-9346-7529ff9c181a`); production at the time was
  `a2312ecb3f522cb9530572a465c76c4890979065`.
- Final release status must be verified against the latest PR checks and
  Cloudflare production deployment logs after this change.

## 2026-10-14 — Remove Astro Markdown and Vite build warnings

### Why

The current production build for `main` (`054fa3cce6010760e5f1ae39b2d3fbf7b0aad614`,
Cloudflare deployment `b0d4332d-35c6-41f7-89f3-e6ae150f6925`) completed
successfully, but its Cloudflare build log still reported an unmet Vite peer
dependency for `@tailwindcss/vite` and Astro's deprecation warning for
`markdown.remarkPlugins`. A dependency-tree check also found that the installed
MDX integration declared an older Sätteri peer range than Astro 7.3.8 provides.
These are version/configuration mismatches, so the fix is to align the
dependencies and processor API rather than hide their warnings.

### Changes

- Updated `@astrojs/mdx` to the Astro 7-compatible 8.x line and explicitly
  declared the matching Sätteri and unified Markdown processor packages.
- Declared Vite directly so the Tailwind Vite plugin can resolve its peer.
- Moved `remarkAutoInternalLinks` into `unified()` via Astro's
  `markdown.processor`, preserving the internal-link plugin while removing use
  of the deprecated Markdown configuration field.
- Regenerated `yarn.lock` incrementally from the existing lockfile and replaced
  Replit-local proxy URLs with the public Yarn registry while preserving each
  package's resolved tarball hash, so CI can fetch the new dependencies.
- Left SEO/geo metadata unchanged: the live pages already emit Sinhala
  `hreflang`, `si_LK` locale, canonical URLs, and indexable page metadata; no
  unsupported geographic meta tags were added.

### Verification trail

- `yarn install --non-interactive`: completed and saved the updated lockfile.
- `yarn check`: completed successfully with no dependency errors. It still
  reports 20 existing resolution/deduplication warnings, including the
  repository's pinned `undici` and `js-yaml` resolutions.
- `yarn test`: 5 passed, 0 failed.
- `yarn build`: completed; 50 static pages built, sitemap indexability passed
  for all 30 checked page URLs, featured links passed (3), social metadata
  passed (8 pages), and critical CSS was inlined for 51/51 pages.
- Local `yarn run check` generated Astro types but timed out while waiting for
  diagnostics; this is not counted as a pass.
- GitHub PR #23's `Type-check and production build` and `Cloudflare Pages`
  checks passed for initial commit `6fbc4ede818283820132eef2ef39ebb010f00f8e`.
- Cloudflare preview deployment
  `3c0abfba-80f8-4caf-a273-4f7984306259` completed build and deploy
  successfully. Its logs contain neither the prior Vite peer warning nor the
  Astro Markdown deprecation warning; sitemap, featured-link, social metadata,
  and critical-CSS build gates passed.
- The preview URL returned HTTP 200 and retained `lang="si"`, the canonical
  `https://www.walakatha.net/`, two `hreflang` links, and `og:locale=si_LK`.
- This changelog-only follow-up changes the PR head, so the required GitHub and
  Cloudflare preview checks must be rerun on the final head before merge.
- The production deployment recorded above is the pre-change baseline; this PR
  has not changed production at the time of this entry.


## 2026-10-14 — Verify PR #23 production release; automate SEO/locale checks

### Why

PR #23 removed the production build's Vite peer warning and Astro Markdown
configuration deprecation. After merge, the source of truth is the final
Cloudflare production deployment and the live canonical site—not the earlier
preview. This follow-up also makes the site's Sri Lankan Sinhala targeting
regression-testable and adds a scheduled live technical SEO audit.

### Changes

- Confirmed PR #23 was squash-merged to main as commit
  37aedf037a22d456c51cec5ce0cfe3d041aca9b6.
- Changed the single Sinhala alternate from hreflang si to the more specific
  hreflang si-LK. Kept HTML lang=si and Open Graph locale=si_LK; these are
  language/locale signals, not invented geographic coordinates or ranking
  guarantees.
- Extended the homepage SEO build check to assert the document language,
  canonical host, si-LK and x-default alternates, and si_LK Open Graph locale.
- Added a daily live audit of the homepage, robots.txt, the declared XML
  sitemaps, and each indexable page URL found in the sitemap. It checks HTTP
  status, canonical consistency, robots indexability, and Sinhala locale
  signals. The daily schedule is 02:15 UTC (07:45 Asia/Colombo).
- Expanded auto-merge to same-repository owner/member/collaborator PRs and
  Dependabot patch, minor, and major updates, but only after GitHub's required
  type-check/build and Cloudflare Pages checks pass. Fork PRs remain manual to
  avoid auto-merging untrusted external code.
- The repository contains a GSC keyword-sync workflow file, but the GitHub
  Actions workflow registry did not list or resolve it during this audit. This
  technical audit therefore does not claim to measure search positions or
  replace Search Console performance data.

### PR #23 release verification

- GitHub PR #23 checks passed: Astro type-check and production build; Cloudflare
  Pages preview build/deploy. The post-merge CI was also dispatched on the
  exact merge SHA and passed type-check, middleware tests, production build,
  pagination SEO, and homepage SEO.
- Cloudflare production deployment a3018091-2297-4a70-8c17-6ebdaf7ad73b for
  the merge SHA completed queued, initialize, clone, build, and deploy stages
  successfully. All 153 available deployment log entries were checked; none
  contained warning, deprecation, error, or fatal diagnostics.
- The live homepage and sitemap.xml responded with HTTP 200; sitemap.xml
  redirected to sitemap-index.xml. Live HTML had lang=si, canonical
  https://www.walakatha.net/, hreflang si and x-default before this follow-up,
  og:locale=si_LK, and index/follow robots directives. The new si-LK signal is
  covered by the required preview checks before it reaches production.

### Verification for this follow-up

- The new locale assertions and automated live audit must pass on this PR head.
- Do not treat the daily audit schedule as having run until its GitHub Actions
  run appears; do not claim Google ranking improvement without Search Console
  data.
