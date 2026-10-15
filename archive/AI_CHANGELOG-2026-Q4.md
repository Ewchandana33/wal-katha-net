# Archived AI Change Log — 2026 Q4

Historical entries moved from AI_CHANGELOG.md on 2026-10-15 during active-log retention rotations. All dated sections below retain their original wording and chronological order. Read AI_CHANGELOG.md first for active instructions and the latest status; archived statuses may have been superseded by later evidence.

Coverage: 2026-10-14 through 2026-10-15; 19 dated entries.

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



## 2026-10-14 — Restore GitHub Actions registration for Search Console keyword sync

### Why

The GSC sync workflow is tracked on `main`, but GitHub Actions does not list or resolve it: workflow lookup and dispatch both returned 404. The repository Actions setting reports workflows enabled and allows all actions. The repository now contains a secret named `GOOGLE_INDEXING_KEY` (its value was not read). This follow-up adds an explicit, narrow trigger so a workflow/script update on `main` will prompt GitHub to reload and run the automation instead of waiting for an unobservable schedule.

### Changes

- Declared `lookback_days` and `min_impressions` as explicit `string` inputs for `workflow_dispatch`.
- Added a `main` push trigger scoped only to `.github/workflows/gsc-keyword-sync.yml` and `scripts/gsc-keyword-sync.mjs`; generated keyword-data commits will not recursively trigger another sync.
- Confirmed the workflow file was present on `main` and passed `actionlint` 1.7.7 with zero errors before this change.
- Kept ranking claims out of scope until a real Search Console sync completes successfully and returns data. The exact reason GitHub did not previously register the valid YAML is not exposed by its workflow API; verify registration and the first run after merge.

### Verification

- Re-run `actionlint` on the changed workflow.
- Required GitHub CI and Cloudflare Pages preview checks must pass before merge.
- After merge, confirm GitHub registers and runs the GSC workflow, inspect the run result, and check Cloudflare production logs for the resulting main commit.



## 2026-10-14 — Recover Search Console keyword sync and close the PR automation gap

### Why

The first post-registration sync (GitHub Actions run 38560956796, attempt 1) successfully queried Search Console but failed at the repository handoff. Branch protection correctly rejected a direct write to main (two required checks); the fallback branch push succeeded, but the repository setting initially prevented GITHUB_TOKEN from creating pull requests. This was a repository Actions permission issue, not a Search Console API failure.

### Changes

- After owner approval, enabled the repository's GitHub Actions PR create/approve setting while retaining default_workflow_permissions=read; branch protection and required checks were not changed.
- Updated this GSC sync to use actions/checkout@v7 and actions/setup-node@v7 (latest releases verified on 2026-10-14) and pinned the runner to ubuntu-24.04, addressing the Node 20 action deprecation notices and imminent ubuntu-latest migration notice from the failed run.
- Made the sync workflow itself queue its generated PR for squash auto-merge. This avoids relying on the separate trusted-owner PR workflow, which does not treat github-actions[bot] as a trusted author. GitHub's protected-branch required checks remain the merge gate.
- Added this record so the next maintainer can distinguish the expected protected-main rejection from the actual PR-permission failure.

### Verification trail

- The successful retry of run 38560956796 (attempt 2) queried sc-domain:walakatha.net for 2026-07-14 through 2026-10-11: 1,896 web rows, 868 image rows, 2,729 web page/query rows, and 2,254 image page/query rows. It wrote a snapshot of 500 global queries (395 usable non-brand queries) and 47 pages.
- That retry created PR #26 from bot/gsc-keywords. Cloudflare Pages preview deployment 8f370d47-ac0a-4133-b5c6-a73b8a01e99a built and deployed successfully; all 153 available preview log entries were checked, with no warning, error, deprecation, or fatal diagnostics.
- The initial PR check was held at action_required; the generated diff was inspected and contained only src/data/gsc-keywords.json, then the owner-approved workflow was allowed to run. CI and the Cloudflare preview must be rechecked on the final PR head after this workflow/documentation update.
- Live homepage, robots.txt, and sitemap-index endpoints returned HTTP 200 during the audit; homepage retained Sinhala HTML language, canonical URL, and its sitemap declarations.
- PR #26 was squash-merged to main as 05004713c13dc6b6cfad7720fd1aed4588501658 after both required PR checks passed. Main CI run 38568052309, post-merge GSC sync 38568052535, and AI Image Alt Text run 38568052368 all completed successfully.
- Cloudflare production deployment 9a89d66d-298c-4e4a-b07f-86fa3ddeb190 for that main SHA completed queued, initialize, clone, build, and deploy stages successfully. All 153 available production log entries were checked, with no warning, error, deprecation, or fatal diagnostics.
- The post-merge sync generated data-only PR #27 and queued squash auto-merge. At the time of this record its required CI run was held at action_required under repository policy first_time_contributors; keep main protected and require its checks to pass before considering that subsequent snapshot published.
- A Google ranking position is not guaranteed by this work.



## 2026-10-14 — PR #27 and production deployment follow-up

This follow-up supersedes the pending-state note above. It records release verification only; it does not claim a new Search Console sync or ranking change.

- PR #27 was later merged at 2026-10-14T13:07:03Z as main commit fb2067d0cdba265515ef711c27515922ae23c423. On the final PR head 006f37c5cad4f3849a576ccf4edf1aec588a273b, GitHub’s required Type-check and production build and Cloudflare Pages checks completed successfully. Main branch protection and both required checks remained enabled.
- Cloudflare production deployment 8c5e4451-802e-4d9d-80a7-1c1ffcc5e852 matches that main commit and completed queued, initialize, clone, build, and deploy stages successfully. All 153 available production log entries were checked; none matched warning, deprecation, error, failure, or fatal diagnostics.
- The latest successful Sync GSC Keywords run visible in the queried Actions history was run 38568052535 on main commit 05004713c13dc6b6cfad7720fd1aed4588501658, which generated PR #27. The later successful CI dispatch 38570049383 ran on bot/gsc-keywords / 006f37c; it was a CI run, not a Search Console sync.



## 2026-10-14 — PR #19 dependency update and production release

- Refreshed Dependabot PR #19 from its stale base onto main commit 3ca5218484a3281faa0138af87753f4c6f9e0aea (updated PR head: 9d9209195cfbebeb77bbd8983923410d3f725043). GitHub's trusted same-repository workflow enabled squash auto-merge; main branch protection was left intact.
- The final PR head passed the required GitHub Type-check and production build and Cloudflare Pages preview checks. Cloudflare preview deployment f9b94638-c936-405a-b75d-58e458bc051f completed queued, initialize, clone_repo, build, and deploy stages successfully; all 155 available build/deployment log entries were checked, with no warning, error, failure, fatal, or deprecation matches.
- PR #19 merged at 2026-10-14T14:18:17Z as main commit 9ec8c14cb1d0c36b2d67b8a543fd5f638f22de5c. Its Cloudflare production deployment e29a16a4-1ad9-4a0f-a16b-bbbf690c6832 matches that SHA and completed every stage successfully; all 155 available logs were checked with no warning/error/failure/fatal/deprecation matches.
- Live homepage, robots.txt, and sitemap-index.xml each returned HTTP 200 after release. This dependency update does not guarantee or claim a Google ranking change.




## 2026-10-14 — PR #29 production verification and live SEO checks

This entry closes the release verification opened above. It records observed release and crawl status only; it does not claim ranking gains.

### GitHub and Cloudflare

- PR #29, “docs: record PR #19 production verification,” merged into main as 47bf3fe2ccf3bcf4667027ec8ec90b2dc7f43b70. Its final PR head, 41c4fc5cbd0c98f55a5fe306722775f659d4c3ba, passed the required Type-check and production build (Actions run 38579905343) and Cloudflare Pages preview check (deployment 8232de62-64c5-4597-b918-b6fc81c310f7). The trusted same-repository auto-merge workflow completed run 38579905510 successfully.
- Production deployment 348b5550-68c9-4b24-b6eb-9592445e6f25 was triggered from that exact main SHA. Queued, initialize, clone_repo, build, and deploy stages all completed successfully. Cloudflare returned all 153 available deployment-log entries; none matched warning, deprecation, error, or fatal diagnostics. The build did emit an informational early-hints message that no eligible posts were found; it was a skip, not a warning or error.
- Build-time checks reported 30 page URLs indexable with matching canonicals, 3 featured links resolving, matching social/image metadata on 8 pages, and critical CSS inlined on all 51 pages. Cloudflare parsed 17 redirect rules and 6 header rules.

### Live crawl and localization smoke checks

- At verification time, the homepage, robots.txt, sitemap-index.xml, news-sitemap.xml, image-sitemap.xml, llms.txt, and ai.txt each returned HTTP 200 with the expected HTML, plain-text, or XML content type.
- The homepage exposed lang=si, its canonical URL https://www.walakatha.net/, index/follow directives, and og:locale=si_LK. robots.txt disallows /api/* and lists the three sitemap endpoints. The sitemap index referenced sitemap-0.xml; the image sitemap contained 5 page locations. The news sitemap returned 200 but had no page locations at the time of the check; retain it only while the site has news-eligible content to publish.
- No application code, article copy, metadata, or Cloudflare settings were changed in this verification. Any content-level SEO expansion should wait for editorial review of age and consent labeling on mature-content previews.

### Search Console scope and limits

- The checked-in src/data/gsc-keywords.json snapshot was generated 2026-10-14 and covers 2026-07-14 through 2026-10-11; it contains 500 global query rows, 395 usable queries, and 47 pages. This release check did not run a fresh Search Console query, so the snapshot is not a live ranking report.
- Search positions and Google rankings are not guaranteed by these checks or by the deployment.




## 2026-10-14 — Correct the reported age and restore discovery

### Change
- The publisher confirmed the single age reference of 17 in `src/content/posts/Akkai-Nangi-wal-katha.md` was a mistake and the character is 18; updated that age only. A separate “17” found during the all-post scan was part of a publication date and was left unchanged.
- Removed the corrected article from the temporary noindex and discovery exclusions so its page can be indexed again and it can return to the XML sitemap, image sitemap, and RSS feed. The separately flagged `bus-jack-wal-katha` article remains noindex.
- Extended `scripts/verify-live-seo.mjs` to require the corrected URL in the XML/image/RSS discovery feeds and to fetch every configured noindex article, require `noindex,follow` and matching canonical, and reject its inclusion in those feeds.

### Rationale and limits
- The user identified the age as an accidental typo and requested the intended adult age; no other post ages, publication dates, story copy, metadata, or locale targets were changed.
- This makes the corrected article eligible for recrawling, not guaranteed ranking or immediate removal of cached search results. Search engines control recrawl and ranking.


### Production release and live audit verification

- PR #31 was squash-merged to `main` as `0639c3c3250b2ffa576369828ad28c719a0755eb`. Its final PR head `7877ebce77215ba685217745080d94104989e374` passed the required GitHub type-check/production-build check (run `38594683689`) and Cloudflare Pages preview deployment (`c50b22a0-54ab-4e67-bca0-2b1a0a6bba0a`). All five preview stages succeeded; all 158 returned deployment-log entries were checked with no warning, error, failure, fatal, or deprecation matches.
- Cloudflare production deployment `cbcea0f6-c726-43e1-ab8c-dd8497eb0219` is tied to the exact `main` merge SHA. Queue, initialize, clone, build, and deploy stages all succeeded; all 156 returned production-log entries were checked with no warning, error, failure, fatal, or deprecation matches.
- The repository's `Live SEO and Sri Lanka locale audit` workflow run `38597439101` passed on that exact production SHA. It verified the live homepage, robots rules, sitemap index and child sitemaps, all configured indexable pages, corrected-article XML/image/RSS discovery, and the configured Bus-Jack `noindex,follow` page's canonical and exclusion from those feeds, along with Sinhala/Sri Lanka locale signals.
- Independent HTTP smoke checks also returned 200 for the homepage, robots.txt, sitemap endpoints, image sitemap, RSS, corrected article, and flagged Bus-Jack article. The corrected article returned `index,follow` with its matching canonical; Bus-Jack returned `noindex,follow` with its matching canonical.
- This verifies crawl eligibility and technical signals only. It does not guarantee Google recrawling, indexing, or a ranking position.



## 2026-10-15 — Complete Search Console sync follow-up

### Changes on the PR branch
- Updated the isolated GSC utility from googleapis@144 to the exact googleapis@186.0.0 release after run 38665761815 reported the transitive uuid@9.0.1 deprecation. The install warning must be rechecked in the next CI/workflow logs before calling it resolved.
- Changed the sync workflow to always commit generated data to bot/gsc-keywords, create/update its PR, and queue squash auto-merge. It no longer attempts a direct push to protected main, avoiding the expected GH006 rejection while preserving required checks.
- Added this entry so future maintainers can distinguish a successful data sync from a production release.

### Verified baseline before this follow-up commit
- GSC workflow run 38665761815 completed successfully for sc-domain:walakatha.net, covering 2026-07-15 through 2026-10-12: 500 global query rows, 394 usable non-brand queries, and 46 pages. This is a Search Console snapshot, not a guaranteed ranking improvement.
- Its runner log contained the uuid@9.0.1 npm deprecation warning and a rejected direct push (GH006); the workflow then used its PR fallback.
- Before this commit, PR #33 head 64941f009fa55140aefe1fb5353244d3f7aedbcc had a successful manual Type-check/production-build run (38666393518) and Cloudflare Pages preview deployment e2f9da74-58ce-4aeb-9b27-ff861c254e54. The PR-triggered CI run 38665795012 was action_required with zero jobs, and the PR remained blocked.
- Production was still on main SHA d4d9b96c96bec22da2bf6e1c5c780678e0e27e9b, deployment 4b5120b1-568d-4662-be82-b5fef7859941. No production change is claimed here.

### Release gate at the time of this follow-up (pre-merge; superseded by the final verification below)
- At the time this note was first written, this follow-up was committed only to the PR branch; the release was still pending required checks and the workflow-approval gate. Branch protection was not bypassed.




## 2026-10-15 — PR #33 production release verification

### Release completion
- PR #33 (Search Console keyword sync) was squash-merged by GitHub Actions at 2026-10-15 04:10:51 UTC. The production merge commit is `be47bddcd5dc93c6e1680b2131d7c89b85f6b97a`; this supersedes the pre-merge release-gate status above.
- The final PR head `3a0152bddb15a79d6dbd7f1dbece6a592833667b` passed "Type-check and production build" (GitHub Actions run 38679927910) and its Cloudflare Pages preview deployment `a5d3a985-fcbb-466f-ace2-60d7870d791c` succeeded.
- Cloudflare Pages production deployment `2d2ed1c0-aea4-41ea-9848-9ab4cefdc7c9` was triggered by the exact merge SHA above. Queue, initialize, clone, build, and deploy stages all succeeded. All 156 returned deployment-log entries (including container logs) were checked; none matched warning, deprecation, error, fatal, or failure terms.
- Live HTTP smoke checks on `https://www.walakatha.net` returned 200 for the homepage, `/robots.txt`, `/sitemap-index.xml`, `/sitemap-0.xml`, `/news-sitemap.xml`, `/image-sitemap.xml`, `/rss.xml`, and `/blog/akkai-nangi-wal-katha/`. The homepage and article exposed matching canonical URLs and `index,follow` directives. The news sitemap returned 200 but had no `<loc>` entries during this check; retain/monitor it only while there is eligible news content.

### Remaining verification boundary
- Subsequent GSC runner and live SEO audit results are recorded in the 2026-10-15 post-release workflow verification section below; the package warning and GSC authentication outcome are now observed, not assumed.
- This verifies deployment and technical crawl signals only. It cannot guarantee Google recrawl, indexing, or a ranking position.




## 2026-10-15 — Post-release GSC and live SEO workflow verification

### Search Console sync follow-up
- Manually dispatched GSC run `38684260810` on main SHA `fdb95f7c7c6d1e3fc4b26836bd1075dcebc7cb6e` after PR #33. Installing `googleapis@186.0.0` succeeded; the earlier `uuid@9.0.1` deprecation no longer appeared, but npm emitted a `node-domexception@1.0.0` deprecation warning.
- The `Pull Search Analytics data` step failed with Google Search Console 401 `UNAUTHENTICATED` / `CREDENTIALS_MISSING` at `SitesService.List`. The result-commit step was skipped; this run wrote no keyword snapshot and created no data PR.
- Runner logs showed `GSC_SERVICE_ACCOUNT_JSON` and the `GSC_SITE_URL` repository variable empty, while `GOOGLE_INDEXING_KEY` was present but masked. The previous successful run `38665761815` had the same environment-variable shape while using `googleapis@144`; because secret values are hidden, a credential change/shape problem and an auth-compatibility regression after the package update remain competing explanations. Do not infer or publish secret values.
- Before claiming the sync is fixed, verify the configured credential is service-account JSON containing `client_email` and `private_key`, and that this service account has Search Console access to `sc-domain:walakatha.net`. The optional GitHub Actions variable `GSC_SITE_URL` may be set to `sc-domain:walakatha.net` to pin the property. Never paste credential material into chat.

### Live SEO and locale audit
- Audit run `38684362854` passed on main SHA `fdb95f7c7c6d1e3fc4b26836bd1075dcebc7cb6e`: homepage, 26 indexable pages, canonical URLs, `si-LK` hreflang, Sinhala language/locale, sitemap and corrected-article feed discovery, and exclusion of the configured noindex article all passed.
- The audit runner also emitted Node/Yarn setup deprecation warnings (`punycode` and `url.parse()`). They did not fail the audit and were emitted by the Node 24 / inferred Yarn cache setup, not by the site build. Cloudflare production build logs remain a separate check and were clean for the recorded production deployment.




## 2026-10-15 — PR #35 production deployment and audit-runner cleanup

### Production verification
- PR #35 merged as `be50c0f7d99b62ef94f8be3e44087b7ab00130b6` after GitHub type-check/production build and Cloudflare Pages preview both passed; GitHub auto-merge respected required checks and no branch-protection bypass was used.
- Cloudflare production deployment `34875402-fcc2-4a61-bc39-2a2a4d4d9b80` built and deployed that commit successfully. All five stages passed; all 156 logs (including container logs) were scanned with no warning/error/fatal/failure matches.
- Post-deploy smoke tests returned HTTP 200 for homepage, robots.txt, sitemap index and sitemap, news/image sitemaps, RSS feed, and a representative Sinhala article. Homepage/article canonical URLs match their live URLs, both are `index,follow`, and `si-LK` hreflang is present.

### Audit runner cleanup
- The live audit uses only built-in Node APIs and has no package install. This PR changes its runner from `actions/setup-node@v5`/Node 24 with inferred Yarn caching to `actions/setup-node@v7`/Node 22 with package-manager caching disabled, to avoid the observed runner-side `punycode` and `url.parse()` deprecations. The push-triggered audit must be checked after merge before marking these warnings resolved.
- The `node-domexception@1.0.0` deprecation emitted by the separate GSC temporary install remains unresolved; it is upstream/transitive. Do not claim the GSC sync is healthy while run `38684260810` still fails authentication, and do not suppress the warning instead of resolving its source.


### Post-merge audit recheck — 2026-10-15
- After PR #36 merged as `bc5dc47747bf6e809c8511602c72b2c691ceaacf`, no push-triggered run for that commit appeared in Actions. A manual `workflow_dispatch` run `38686128893` on the same main SHA completed successfully.
- The run confirmed 26 indexable pages, canonical URLs, `si-LK` hreflang, Sinhala language/locale, sitemap/feed discovery, and noindex exclusion. Its logs no longer contained the Node `punycode` or Yarn `url.parse()` deprecations; only Git's standard default-branch initialization hint remained. The scheduled daily audit is still configured.
- This verifies the runner cleanup; it does not repair the independent GSC authentication failure or the `node-domexception@1.0.0` install deprecation recorded above.



## 2026-10-15 — PR #37 production release and live verification

### GitHub and Cloudflare release checks
- PR #37, “docs: record post-merge SEO audit verification,” merged into `main` as `e74280cf8263c84e93da988a72fc79e50092cc66`. Its final head `dd999190cd80f47da9448bf6931c5dab2bdee369` passed the required “Type-check and production build” check (run `38686370394`) and Cloudflare Pages preview check. The preview deployment `b34181cb-557f-4051-b0a7-c1d7fefa73ae` completed all five stages successfully; all 158 returned log entries, including container logs, were scanned with no warning, deprecation, error, failure, or fatal matches.
- Cloudflare Pages production deployment `e2b959fd-767a-488b-943b-4119f95962d6` was triggered by the exact main SHA above. Queue, initialize, clone, build, and deploy all succeeded. All 156 available production log entries, including container logs, were checked with no warning, deprecation, error, failure, or fatal matches.

### Live site checks after production deployment
- Direct HTTP checks returned 200 for the homepage, `/robots.txt`, `/sitemap-index.xml`, `/sitemap-0.xml`, `/news-sitemap.xml`, `/image-sitemap.xml`, `/rss.xml`, `/llms.txt`, and a representative Sinhala article. `/sitemap.xml` also resolved to the sitemap index with HTTP 200.
- The homepage returned `lang=si`, canonical `https://www.walakatha.net/`, `index,follow` robots metadata, `hreflang=si-LK`, and `og:locale=si_LK`. The current child XML sitemap contained 26 URL entries. The news sitemap returned HTTP 200 but had no URL entries at verification time.
- Live audit run `38686128893` passed for main SHA `bc5dc47747bf6e809c8511602c72b2c691ceaacf` before the later documentation-only PR #37. It verified 26 indexable pages, canonical/locale signals, sitemap/feed discovery, and noindex exclusions. This workflow run did not execute on the newer documentation-only SHA; the exact production deployment and live HTTP checks above were checked separately.

### Search Console remains blocked
- GSC run `38684260810` failed in “Pull Search Analytics data” with HTTP 401 `UNAUTHENTICATED / CREDENTIALS_MISSING` at `SitesService.List`; its data commit step was skipped, so this run created no keyword snapshot.
- GitHub's repository Actions metadata lists the secret name `GOOGLE_INDEXING_KEY`, but not `GSC_SERVICE_ACCOUNT_JSON`, and lists no repository Actions variables (including `GSC_SITE_URL`). Secret values are not readable through this audit and were not inspected. The workflow can fall back from `GSC_SERVICE_ACCOUNT_JSON` to `GOOGLE_INDEXING_KEY`, so the missing dedicated secret name alone does not establish the cause. The effective value's service-account JSON shape and its Search Console property permission still need a safe operator-side check; do not paste credentials into chat.
- No GSC credential, Search Console permission, or repository setting was changed. Do not mark keyword sync healthy until it completes successfully and writes fresh data. The technical SEO audit verifies crawl signals only; it does not guarantee Google indexing or rankings.




## 2026-10-15 — GSC auth compatibility validation

### Diagnosis and change on the fix branch
- Run `38697489390` on branch commit `74286632` installed `googleapis@186.0.0` with `google-auth-library@10.5.0`; `Pull Search Analytics data` failed at Search Console `SitesService.List` with HTTP 401 `UNAUTHENTICATED / CREDENTIALS_MISSING`. That install also emitted `node-domexception@1.0.0` and `glob@10.5.0` deprecation warnings.
- The follow-up branch commit restores `googleapis@144.0.0` and its resolved `google-auth-library@9.15.1`, overrides transitive `uuid` to `11.1.0`, and logs the resolved dependency tree. A non-main guard lets branch validation fetch/test data but prevents it from committing generated data or opening a data PR.
- The observed before/after strongly implicates the `googleapis@186` dependency/auth stack, but does not uniquely prove causation because GitHub masks the credential value and it was not inspected or compared. Both runs used the masked `GOOGLE_INDEXING_KEY` fallback; `GSC_SERVICE_ACCOUNT_JSON` and `GSC_SITE_URL` were empty. No credential or repository setting was changed.

### Verified follow-up state
- Run `38698159897` on branch commit `233ba121` completed successfully through `Pull Search Analytics data` and the guarded result step. It queried `sc-domain:walakatha.net` for 2026-10-06 through 2026-10-12, received `web=931` and `image=317` rows, and generated a 500-global-query / 23-page snapshot. The non-main guard intentionally did not commit that snapshot; this is a successful branch validation, not a production sync or data PR.
- Cloudflare preview deployment `cf25934a-e453-4c79-9825-c0b18fa84c53` for branch commit `233ba121` completed all five stages. All 158 returned log entries (including container logs) were scanned; none matched warning, deprecation, error, fatal, or failure terms.
- Current production is still main commit `848c1034`, deployment `2dd393f2-f784-427d-97d8-bf48a1e63541`; all five stages succeeded and all 156 returned log entries were scanned with no warning/deprecation/error/fatal/failure matches. The live SEO/locale audit `38698866861` passed on that main SHA: 26 indexable pages, canonical URLs, Sinhala and `si-LK` locale signals, corrected-article discovery, and noindex exclusions.
- The GSC compatibility change is not in `main` yet. Do not call production GSC sync restored until the fix passes protected-branch checks, is merged, and a main-branch run completes; do not claim ranking improvements from technical checks.



## 2026-10-15 — PR #39/#40 GSC release and production verification

### PR #39 Search Console compatibility release
- PR #39, `fix(gsc): restore Search Console sync auth compatibility`, merged through protected-main auto-merge as `e85f5e7ac68a94f093c055294ad002f3a5010d0f` after the required Type-check/production-build and Cloudflare Pages checks passed. The merged workflow uses `googleapis@144.0.0` (`google-auth-library@9.15.1`) with `uuid@11.1.0` override and the non-main data-commit guard.
- Cloudflare production deployment `8c4d797a-8871-4a77-aa3c-6b0dd719977b` for that SHA completed all five stages successfully; all 156 returned log entries, including container logs, were scanned with no warning, deprecation, error, fatal, or failure matches.

### Main-branch Search Console sync and data PR
- Manual GSC workflow run `38700591415` on main SHA `e85f5e7ac68a94f093c055294ad002f3a5010d0f` completed successfully using the existing masked `GOOGLE_INDEXING_KEY` fallback; `GSC_SERVICE_ACCOUNT_JSON` and `GSC_SITE_URL` were empty. No secret value was read or changed.
- The run queried `sc-domain:walakatha.net` for 2026-07-15 through 2026-10-12 and received web=1911 / image=881 rows, including 2,771 web and 2,287 image page+query rows. It generated a 500-global-query / 46-page snapshot and created data PR #40. The PR changed only `generatedAt`; the keyword rows themselves were unchanged.
- PR #40 was auto-merged as `fa4c1fc5544ac1809b6d8bc5acfebf7eeefc8169` after approval allowed its CI to run; no required check was bypassed. The type-check/Astro build, middleware tests, homepage/pagination SEO assertions, and Cloudflare Pages preview all passed. Preview deployment `7767824c-375c-4f9a-a841-ce45c7323baf` completed all five stages; its 158 returned log entries (including container logs) had no warning, deprecation, error, fatal, or failure matches.

### Production and live SEO verification on PR #40 SHA
- Cloudflare production deployment `0bfc2fbb-0dc6-4c6a-922a-78e04e30b8d9` for exact main SHA `fa4c1fc5544ac1809b6d8bc5acfebf7eeefc8169` completed all five stages successfully. All 156 production log entries, including container logs, were scanned with no warning, deprecation, error, fatal, or failure matches.
- Live audit run `38701606860` passed on that exact main SHA. It verified the live homepage, robots/sitemap and feed discovery, 26 indexable pages, canonical URLs, corrected-article discovery, the configured noindex exclusion, Sinhala language, `si-LK` hreflang, and `si_LK` locale.
- GitHub runner logs still include the standard Git default-branch initialization advisory; the GSC install emitted no npm deprecation warning, and Cloudflare build/deployment logs were clean.

### Status clarification
- This entry supersedes the earlier pre-merge note stating that the GSC fix was not yet in `main`. The post-merge main-branch sync and production verification above are now complete.
- The GSC run confirms data retrieval and the protected PR flow; this specific snapshot had no keyword-row changes, only a refreshed timestamp. Technical crawl checks do not guarantee Google indexing or ranking position.



## 2026-10-15 — GSC-led homepage low-CTR snippet update

### Evidence and scope
- Reviewed the committed 90-day Search Console snapshot (`2026-07-15` to `2026-10-12`, three-day data lag). The homepage query `වැල්` is web-only and reported 4,075 impressions, 90 clicks, 2.21% CTR, and average position 5.2. This is the strongest high-visibility / low-CTR snippet opportunity in the page-query data.
- The existing homepage title already covered both Sinhala spellings, but led with the other variant; its description repeated keyword variants and claimed daily new stories without a verified publishing cadence. The page template provides category navigation and search.
- Other apparent low-CTR article rows either have average positions mostly beyond page one or mix Web and Image metrics in the capped top-query snapshot; the evidence does not isolate a snippet problem there, so no article metadata was changed.

### Change in this PR
- Reorder the homepage title to lead with the exact high-impression query wording: `සිංහල වැල් කතා කියවන්න | Wal Katha`. Keep the visible H1 unchanged.
- Replace the homepage description with a concise, accurate Sinhala invitation that explains category/search navigation and free reading, and removes the unsupported daily-update claim. Structured data and social metadata inherit the same homepage title/description.
- Update `scripts/verify-homepage-seo.mjs` to assert the exact title and description in the built homepage while retaining the existing H1, canonical, hreflang, locale, and language checks.
- This is a targeted snippet experiment, not a ranking guarantee; compare GSC CTR after Google recrawls the page and gathers a comparable impression sample.
### Production release verification — PR #42

- PR #42 merged into `main` as `664c5ed32e462701a237c0f129a97e2dd2555f13` at 2026-10-15 09:24:30 UTC. The required GitHub `Type-check and production build` and `Cloudflare Pages` checks passed.
- Cloudflare Pages production deployment `40272b93-e1ba-40e2-92db-e7507fcac7e6` was triggered by that exact main SHA. All five stages (queued, initialize, clone_repo, build, deploy) succeeded. All 158 returned deployment-log entries, including container logs, were scanned; none matched warning, deprecation, error, fatal, or failure terms.
- Live checks on 2026-10-15 returned HTTP 200 for the homepage, `/robots.txt`, `/sitemap-index.xml`, and `/sitemap-0.xml`. The live homepage serves the title and description above, canonical `https://www.walakatha.net/`, `lang=si`, and `hreflang=si-LK` plus `x-default`.
- This verifies release completion and technical crawl metadata only. It does not establish a CTR or ranking improvement; compare Search Console after Google recrawls and enough comparable impressions accrue.




## 2026-10-15 — Full live SEO and Sri Lanka locale re-audit

- Manually dispatched the existing `Live SEO and Sri Lanka locale audit` workflow after PR #43. Run [38717622478](https://github.com/Ewchandana33/wal-katha-net/actions/runs/38717622478) on exact main SHA `54786e62bce6ab2dff609a4fdca5d54663a8f6fc` completed successfully.
- The live audit covered the homepage, robots and sitemap/feed discovery, all 26 indexable sitemap pages, corrected-article discovery in XML/image/RSS, and configured noindex-page exclusions. Its page assertions include canonical URLs, Sinhala language, `si-LK` hreflang, and `si_LK` Open Graph locale. No audit failure was reported.
- The Search Console snapshot currently in `src/data/gsc-keywords.json` was generated at `2026-10-15T07:42:57Z` for `2026-07-15` through `2026-10-12` (three-day data lag). It predates the homepage snippet release on `2026-10-15`; therefore there is not yet a valid post-release CTR comparison or evidence of a ranking change.
- `Sync GSC Keywords` already runs on a weekly schedule (Mondays at 04:00 UTC). Allow later snapshots and Google recrawl data to mature before evaluating the `වැල්` homepage query; technical-audit success is not a ranking or CTR guarantee. This audit found no verified issue requiring another source-code or metadata change.




## 2026-10-15 — Automated post-recrawl homepage CTR measurement

### Scope and safeguards
- The existing weekly `Sync GSC Keywords` workflow remains scheduled for Mondays at 04:00 UTC. This adds a separate homepage experiment follow-up at 05:00 UTC, avoiding duplicate keyword-sync work.
- The monitor is scoped to the homepage query `වැල්` and the snippet release on 2026-10-15. Its pre-release baseline is 2026-09-15 through 2026-10-12. It uses Google URL Inspection to require an indexed verdict and a crawl at or after release, waits at least seven days after deployment, then measures a 28-day post-crawl window with a three-day Search Console data lag.
- A report is written only when the comparison is complete and each global window has at least 500 impressions. A Sri Lanka (`LKA`) segment is reported separately and labeled directional below 100 impressions in either window. Until then, the action writes only a pending status to its job summary and leaves the changelog untouched.
- The action uses the existing `GOOGLE_INDEXING_KEY` / `GSC_SERVICE_ACCOUNT_JSON` secret and optional `GSC_SITE_URL` repository variable; no credential values are read, printed, or changed.

### Automation and validation design
- A ready report is committed on `bot/gsc-ctr-followup`, submitted as a PR, and queued for squash auto-merge. Protected `main` is never directly pushed. The existing keyword-sync workflow now explicitly dispatches the CI workflow on its bot PR head because a `GITHUB_TOKEN`-created PR does not itself trigger `pull_request` workflows; Cloudflare Pages continues to build the preview independently.
- The focused date-window and metric tests are added to the required CI workflow. CTR percentage-point values are rounded to two decimals and relative changes to one decimal to keep reports stable across Node versions; this also fixes an exact floating-point assertion that failed under Node 24.
- The monitor records Search Console observations only; it does not auto-edit titles/content and does not claim that an observed CTR or position change was caused by the snippet change. Rankings cannot be guaranteed.

### Current status
- The latest verified Search Console snapshot still ends 2026-10-12, before the 2026-10-15 release. No post-release recrawl or comparable post-window result is claimed. The weekly action will keep checking and create a report PR only when Google crawl and data-volume conditions are satisfied.


