# Archived AI Change Log — 2026 Q4

Historical entries moved from AI_CHANGELOG.md on 2026-10-15, 2026-10-16, 2026-10-18, 2026-10-23, 2026-10-25, and 2026-10-28 during active-log retention rotations. All dated sections below retain their original wording and chronological order. Read AI_CHANGELOG.md first for active instructions and the latest status; archived statuses may have been superseded by later evidence.

Coverage: 2026-10-14 through 2026-10-28; 68 dated entries.


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

## 2026-10-15 — PR #46 merged and production verification

- GitHub PR #46 (deterministic, safe cover-alt automation) was merged into `main` as merge commit `8e6fedb39f6ce0d71753a9a91358ecc757a86613`. The PR-head CI run `38741039658` completed successfully; its Type-check and production build job passed. The Cloudflare Pages preview check on PR head `37e3a4686a6051df24599dea36aed1029337a240` also succeeded.
- Cloudflare Pages production deployment `2fac97fa-c54e-4e49-ac24-b1004394aeac` was triggered by that exact `main` merge commit. All five stages (queued, initialize, clone_repo, build, deploy) succeeded. All 156 fetched deployment-log entries, including container logs, were scanned for warning, deprecation, error, fatal, failure, and failed terms; none matched.
- Direct live checks returned HTTP 200 for the homepage, `/robots.txt`, `/sitemap-index.xml`, `/sitemap-0.xml`, and `/rss.xml`. A live crawl of all 26 URLs in the current sitemap returned HTTP 200 for every page; each had a canonical URL, `lang=si`, and `hreflang=si-LK`, and no rendered image had an empty/missing alt attribute.
- This post-merge record supersedes the earlier pre-merge/draft status above; that historical note is retained to preserve the decision timeline. Technical crawl and accessibility checks do not guarantee Google indexing, rankings, or a top position. No post-release Search Console ranking/CTR change is claimed here.

## 2026-10-15 — AI changelog archive policy and Q4 history cleanup

### Why

AI_CHANGELOG.md had grown to nearly 50 KiB, with 22 dated records. A shorter active file makes current instructions and status easier for future AI agents to find without losing release evidence.

### Changes

- Added explicit AI-maintainer instructions for reading current state, recording verified changes, handling superseded notes, protecting credentials, and avoiding ranking guarantees.
- Defined a retention policy: keep the newest five dated entries and target no more than 20 KiB in the active log; move older whole entries to a quarter-based archive, preserving their text and updating the archive index.
- Moved 18 complete older records dated 2026-10-14 through 2026-10-15 verbatim to archive/AI_CHANGELOG-2026-Q4.md; retained the four newest prior records and this new entry in the active log.
- Recorded the current GSC follow-up gates and noted that a post-release comparison is not yet available. The latest checked workflow run was pre-release and skipped its report-PR step.

### Verification

- Source log was split at dated section headings; 18 older entries were moved and four prior newest entries retained without editing their text.
- Pre-write validation counted 22 dated entries, preserved the newest four complete records, and verified the 18 older sections without modifying their text.
- The documentation PR must pass the repository-required Type-check and production build and Cloudflare Pages preview checks before merge; their final outcomes are verified from GitHub and Cloudflare.

## 2026-10-15 — Replace credential-dependent alt-text workflow

### Findings
- The previous scheduled alt-text run (GitHub Actions run 38712121159) was marked successful but logged zero Gemini keys and skipped generated-content validation and PR creation. It was a successful no-op, not an alt-text repair.
- The repository currently has 11 post cover images: 9 existing alt labels were keyword/brand-stuffed or unsafe for their titles, and 2 were missing. No post supplies an image_keyword seed.
- The production baseline before this change is Cloudflare Pages deployment d32c12de-0636-4171-9cf8-ccf736b6d1ea for main SHA 5c56696583bbdea46978eb0988190395724bacfb. Its five deployment stages succeeded; the 156 fetched log entries contained no warning/error/failure matches. This does not verify the pending change.

### Changes
- Replaced the Gemini-dependent generator with a deterministic, Node built-in-only policy. It reads only post title/image frontmatter, does not call an image model or Search Console, does not consume keyword seeds, and does not infer unseen image details.
- All 11 current cover labels are normalized. Age-sensitive or explicit/age-uncertain titles receive the neutral generic label; other safe titles get concise title-derived labels. The policy rejects missing, branded, sensitive, or overlong values.
- Removed the unused image_keyword content-schema seed and added unit tests plus a recursive cover-alt validator to required CI.
- Reworked the scheduled/on-content workflow to use Node 24 and current repository action versions, validate before publishing, push only to the automation-owned bot/deterministic-alt-text branch, open/update a draft PR, and dispatch required CI on the PR head.
- Pinned required CI to ubuntu-24.04 after GitHub's runner-migration notice so builds do not silently change runner generation.

### Review and deployment boundary
- Verification of the initial code commit 2aef04fa6f6a52f54fb0350fb28886e2687f8c37 passed in both GitHub CI runs 38739689207 and 38739666097, including type-check/build, alt-policy tests, and the 11-cover validator. Cloudflare preview deployment 25f5c40c-3f0c-4975-a47f-a41af300a917 (https://25f5c40c.wala-katha.pages.dev) passed all five stages; its 158 fetched log lines had no warning/error/failure/deprecation matches. Seven rendered post routes returned HTTP 200 and their own cover labels matched the expected safe values; CI validated all 11 cover entries. GitHub also emitted one notice on this prior head: the CI workflow used ubuntu-latest, scheduled to move to Ubuntu 26 on 2026-10-19. This follow-up pins CI to ubuntu-24.04 to eliminate that implicit runner migration; its new checks/preview are re-run before approval.
- The PR remains draft. This automation does not merge or deploy production; protected main and the live site remain unchanged until explicit approval.
- Technical metadata hygiene can improve accessibility and crawl quality but cannot guarantee Google rankings. Historical notes are retained; this entry supersedes prior Gemini-based alt-workflow status.

## 2026-10-15 — Automated deterministic cover-alt repair

- Repaired 11 cover alt value(s): Akkai-Nangi-wal-katha, Bus-jack-wal-katha, Mage-Nangi-wal-katha, Nimali-saha-boss, School-Wal-Katha, gedara-driver-wal-katha, methsala-akka-wal-katha, nandage-duwa-wal-katha, nethuge-wal-katha, thaththa-duwa-wal-katha, wanamalee-wal-katha.
- Used neutral title-derived labels; age-sensitive or explicit titles receive a generic fallback. No image model, API key, GSC query, or keyword seed is used.
- The workflow validates all cover labels, opens or updates a PR, dispatches required CI on the PR head, and leaves the PR in draft for review; production merge requires explicit approval.

## 2026-10-15 — GSC query triage and production-state refresh

### Search Console query evidence

- Read the repository's generated Search Analytics export for sc-domain:walakatha.net (generated 2026-10-15T07:42:57.643Z; 2026-07-15–2026-10-12; 500 global queries, 394 usable, 46 pages). Global rows may combine web and image search; do not treat blended average positions as web-only rankings.
- Highest-volume Sinhala query rows in the global export: වල් කතා — 21,880 impressions, 5,172 clicks, 23.64% CTR, average position 3.3; වැල කතා — 7,926 impressions, 2,476 clicks, 31.24% CTR, average position 1.9; සිංහල වැල් — 5,074 impressions, 303 clicks, 5.97% CTR, average position 4.1. These are observed query metrics, not ranking guarantees.
- Page-level evidence for homepage query වැල් is 4,075 impressions, 90 clicks, 2.21% calculated CTR, average position 5.2 (web source). For සිංහල වැල්, the export assigns 4,468 impressions / 267 clicks / position 28.9 to / and 658 impressions / 35 clicks / position 4.8 to /page/2/; both include web and image sources. This mixed page mapping is not sufficient evidence to retarget the homepage or rewrite pagination metadata.

### Decision and scope

- src/pages/index.astro already contains the GSC-informed homepage title and description for the වැල් query. The existing post-recrawl monitor checks whether Google re-crawls the released snippet and waits for comparable data; another title edit now would reset the measurement start and weaken the comparison.
- No application source, metadata, or keyword seed was changed in this audit. Keep the existing monitor and use the next query export to choose any route-specific action after separating web from image search and checking page-level intent. No Search Console credentials were read or changed.

### Verified state before this changelog update

- PR #48 merged as main commit 2b3278653ef307e0bd8d3282094efddde3e9f8b8. Its CI run 38749000165 and trusted auto-merge run 38749000658 both completed successfully.
- Cloudflare Pages production deployment 8a08ed45-d61f-4595-af42-2bcce4d83c2b corresponds to that exact commit. All five stages succeeded; all 158 returned deployment-log entries were checked and none matched warning, deprecation, error, fatal, or failure terms.
- Sync GSC Keywords run 38700591415 succeeded on main and committed the export described above. The post-recrawl monitor run 38726508677 succeeded, but the report-PR step was skipped while its recrawl and sample-size gates were unmet. The latest Live SEO and Sri Lanka locale audit run checked was 38725657543 and completed successfully.
- Earlier same-day GSC sync attempts did include failures; they are not represented as successes. The later successful main-branch sync and committed export establish the current data state, not that every historical run passed.

## 2026-10-15 — Article-end Markdown downloads with duplicate-index safeguards

### Why

- The site already serves canonical, structured HTML articles. Publishing full duplicate files as indexable search bait would not guarantee rankings and could create duplicate-content ambiguity; downloads are implemented as a reader convenience instead.
- Keep the original HTML article authoritative and prevent generated copies from appearing in search results or XML sitemaps.

### Changes

- Added a build-time `/downloads/{slug}.md` endpoint for every published post, sourced from the same non-draft collection as article pages. Each UTF-8 file carries its title, original-article link, publication date when valid, and the existing Markdown body.
- Added an accessible Markdown download link after article content, tags, and sharing controls.
- Added Cloudflare Pages headers for Markdown MIME type, attachment download, one-day cache, and `X-Robots-Tag: noindex, nofollow`; excluded `/downloads/` from the sitemap.
- Added a production-build verifier that checks every published article has one non-empty download and visible link, validates header configuration, and fails if reader copies enter the sitemap. No dependency or lockfile change.

### SEO and release boundary

- Canonical HTML remains the sole index target; no ranking or traffic increase is claimed. This avoids treating duplicate exports as a ranking shortcut.
- Pre-change production baseline: main SHA `ef388186b546ada859542d1965bf8a5cfe709a78`, Pages deployment `d2e65e1c-5045-411b-96fe-250f6392b40d`; all five stages succeeded. All 156 returned deployment-log entries were checked and none matched warning, deprecation, error, fatal, failure, or failed terms.
- GitHub PR #50 was auto-merged on 2026-10-15 from feature head `bbf19364ae76ec5d5a901e1106b5439d4e12b7cc` as main squash commit `dce850669c6de8ace67161cfec2fe70e69e4b50d`. CI run `38781056981` completed successfully; the required `Type-check and production build` and `Cloudflare Pages` checks both succeeded. The same-repository auto-merge workflow run `38781056500` also succeeded.
- Cloudflare Pages preview deployment `871e4dd5-6792-4c72-8e4f-ed5a5a0c8f6e` for the feature commit passed all five stages. Its 166 returned log entries, including container logs, had no matches for warning, deprecation, error, fatal, failure, or failed terms. The build verifier reported seven published articles with downloads and no sitemap entries.
- Cloudflare Pages production deployment `90189349-695c-4042-9d43-0a8112f5d7fe` for main commit `dce850669c6de8ace67161cfec2fe70e69e4b50d` passed all five stages. Its 164 returned log entries, including container logs, had no matches for warning, deprecation, error, fatal, failure, or failed terms.
- Live verification on `https://www.walakatha.net`: all seven published article routes and their seven Markdown downloads returned HTTP 200. Every download had `text/markdown; charset=utf-8`, attachment disposition, `X-Robots-Tag: noindex, nofollow`, a link back to its canonical HTML article, and an article-end download link. `sitemap-index.xml` and `sitemap-0.xml` returned HTTP 200; the sitemap contained no `/downloads/` URLs.

## 2026-10-16 — Sinhala article PDFs with repeated site watermark

### Why

- The existing article-end download was Markdown; the requested reader copy is a downloadable PDF with the site URL repeated on every page.
- Keep canonical HTML as the only search landing page. Reader PDFs are a convenience, not an SEO ranking shortcut.

### Changes

- Added a build-time PDF endpoint for every published article, using PDFKit and an embedded Noto Sans Sinhala font (SIL Open Font License). The PDF keeps selectable/extractable Sinhala text, the article title/date, and a link to the canonical HTML article.
- Changed the article-end button to download `.pdf`. Existing Markdown download URLs remain available for backward compatibility but are no longer the article-page CTA.
- Added `https://www.walakatha.net` as centered page content and as a footer on every PDF page. It is embedded in the page content, not an optional annotation/layer; PDF editing/rasterization can still remove or obscure any watermark, so absolute removal prevention is not claimed.
- Added PDF attachment, MIME, one-day cache, and `X-Robots-Tag: noindex, nofollow` headers. PDFs are excluded from sitemaps; canonical article HTML remains authoritative.
- Extended the required build verifier with PDF.js to check every published article has a valid PDF, extractable Sinhala text, the canonical source URL, at least two URL watermarks on every page, a visible PDF download link, attachment/noindex headers, and no sitemap entry.

### Local verification

- `yarn check` completed successfully and `yarn test` passed all five tests. `yarn check` reported 20 dependency-resolution/deduplication notices; Yarn 1 also emitted Node's `DEP0169` `url.parse()` deprecation warning. These are environment/dependency-tree notices, not PDF/build failures; no unrelated lockfile resolutions were changed to hide them.
- `yarn build` completed successfully: 50 site pages, seven article PDFs across 57 PDF pages, and the PDF.js build verifier confirmed per-page center/footer watermarks, extractable Sinhala, and source URLs. The build also passed sitemap-indexability, featured-link, social-image, and critical-CSS checks.
- GitHub PR checks and Cloudflare preview/production deployment verification are pending; do not treat local build success as a release.

### SEO and release boundary

- PDF downloads remain noindex and out of sitemaps; the HTML article's canonical URL, Sri Lankan locale metadata, and existing SEO text are unchanged. No ranking or traffic increase is claimed.
- A PDF watermark is deterrence, not DRM; no method can make a user-editable PDF watermark literally impossible to remove.

## 2026-10-16 — Repair external CI dependency installation for article PDFs

### Why

- PR #52 initially failed at dependency installation because 26 new lockfile tarballs referenced the Replit-only `package-firewall.replit.internal` host. Cloudflare deployment `3102cf77-d753-4d75-a58e-aeee9d4013d9` and GitHub CI run `38845171391` recorded that failure.
- Registry correction commit `fb546901af26f727adbf7b8af8383aed928e5a6e` made Cloudflare preview deployment `6bcadf34-4e34-4351-9791-66af10ec2525` pass all five stages. Its 173 deployment-log entries had no warning/error/failure matches, and its build verifier checked seven article PDFs across 57 pages.
- GitHub CI run `38848017465` then reached `astro check` and failed with TypeScript `ts(7016)`: `pdfkit` has no bundled declarations, so the new PDF module lacked types. This was separate from the completed Cloudflare build.

### Changes

- Replaced the 26 Replit-only tarball URL prefixes with `https://registry.npmjs.org/`, preserving package versions, paths, and integrity hashes.
- Added `@types/pdfkit@0.17.6` as a dev dependency. Yarn 1.22.22 generated one exact lock entry using the existing `@types/node@*` resolution; no runtime dependency or PDF behavior changed.
- Moved the oldest complete dated log entry to `archive/AI_CHANGELOG-2026-Q4.md` to keep the active log at five entries (the archive now has 22).

### Verification status

- Yarn completed dependency resolution with `@types/pdfkit@0.17.6`; the generated lock diff is one package entry and contains no Replit-internal registry host. A local full Astro check was not treated as passing because that scratch install initially omitted optional platform bindings; the required GitHub CI is the authoritative type-check.
- Cloudflare preview commit `fb546901af26f727adbf7b8af8383aed928e5a6e` passed all five stages; its build verified 50 pages, 7 PDFs/57 PDF pages, watermarks, canonical source links, attachment/noindex headers, and sitemap exclusion. The new type-dependency commit's CI and preview checks are pending.
- Production remains on main SHA `c6bc1e9f92aab0032a387795e5c1d6533065ec35`, with successful deployment `b1a1202b-e756-4ed8-8cbd-ae6b533065b8`; no PR change has been reported as a production release.

## 2026-10-16 — PR #52 production release and live PDF verification

### Correction to pending release status

- This entry supersedes the pending GitHub/Cloudflare status recorded in “2026-10-16 — Repair external CI dependency installation for article PDFs” and “2026-10-16 — Sinhala article PDFs with repeated site watermark”. Those entries remain as the chronological failure and implementation record.
- PR #52 merged at 2026-10-16T04:10:32Z as protected main commit `93a64c1a4e123c95eb062c5b5657c82d03a7de8c`. Required GitHub CI run `38849118469` passed: dependency install, Astro type-check, tests, static build, and pagination/homepage SEO output checks. The Cloudflare Pages check run `116806985615` also passed.

### Cloudflare and live verification

- Preview deployment `948bb1f7-2e21-4ee2-9f86-08484e9da4b9` for PR head `781e5d14044cf2e8d05461cfaa8f588128795d6a` passed all five stages. Production deployment `28a52960-2dfb-4756-aca6-100538bd5241` for the exact main merge commit passed all five stages. All 173 returned log entries for each deployment were checked; no warning, deprecation, error, fatal, or failure matches were found.
- The production build verifier confirmed 50 site pages and seven article PDFs spanning 57 PDF pages, with each page's centered watermark and footer, extractable Sinhala, source links, article CTA, attachment/noindex headers, and PDF sitemap exclusion.
- Live checks on `https://www.walakatha.net` returned HTTP 200 for all seven PDF routes. Each served `application/pdf`, an attachment disposition, and `X-Robots-Tag: noindex, nofollow`; a full sample download had the `%PDF-` signature. The article page linked to its PDF, and `sitemap-0.xml` contained no `/downloads/` URLs. Its canonical URL was the HTML article; locale metadata included `hreflang=si-LK` and `og:locale=si_LK`.

### SEO boundary

- Canonical article HTML remains the only index target; downloadable copies are noindex and omitted from sitemaps. This is technical SEO hygiene, not a ranking shortcut. No Google top-ranking, post-release indexing, or traffic increase is claimed; the existing Search Console comparison gates still apply.

## 2026-10-16 — Correct stale article-PDF cache and version download URLs

### Correction to Embed post cover images in article PDFs

- This entry supersedes that earlier entry’s pending release-verification status while retaining it as the record of the implementation decision. PR #54 merged into main as 8e9bd33c08fccde800d463cef52b36c951436661; GitHub CI run 38852608136 and the Cloudflare Pages PR check passed.
- Preview deployment 2955a436-8103-4b4b-b480-2a7a7d04979a and production deployment b555c637-b415-434d-892f-8f24786b9fc8 for the cover-image change passed all five Cloudflare stages. All 173 available log entries for each deployment were checked; neither contained warning, deprecation, error, fatal, or failure matches.
- The unique production deployment served all seven new cover-image PDFs, but the custom domain intermittently returned older cached bytes for stable PDF URLs. Those responses were Cloudflare cache hits with a one-year Cache-Control max-age; changing query strings returned the new output. A first exact-file purge of three stale paths was followed by another stale bus-jack response, so the final purge covered all seven PDF URLs.
- After the seven-URL purge, live checks returned HTTP 200 for all seven PDFs; each had a %PDF- signature and one embedded cover-image object. This is direct live-output verification, not merely a deployment-build result.

### Durable cache-version fix

- The article-end PDF link now receives a SHA-256 query version derived from the exact article title/body/date/source URL, cover-image path and bytes, PDF generator and route sources, Sinhala font, and locked dependencies. Updating a story, image, generator, font, or dependency automatically produces a different URL, avoiding reuse of an old long-lived cache key.
- The build verifier now fails if any published article is missing its 64-character versioned PDF link; existing PDF image, watermark/footer, Sinhala text, source URL, attachment/noindex, and sitemap checks remain.
- This does not change canonical HTML, PDF noindex policy, or sitemap inclusion. No Google ranking or traffic increase is claimed.

### Cache-version change release status

- PR #55's initial CI and preview attempt failed in the post-build SHA-256 link verifier because its regular-expression escaping was lost inside a template literal. The verifier was corrected to use a literal URL-prefix check plus a 64-hex SHA-256 assertion.
- The correction head `d1d7e37ed05e24bc425bd97979d5a52b6e26c21d` passed GitHub CI run `38854295284`; PR #55 merged at 2026-10-16T05:10:59Z as main commit `d68d1ace5c457f2949271f322378fb97442b2bc1`. The previous failed run is retained here as history, not the current status.
- Cloudflare Pages production deployment `e6dba80d-92ba-4449-9a9f-7af8c2ed0d80` for that main commit completed successfully: queued, initialize, clone_repo, build, and deploy all succeeded. All 173 available logs, including container logs, were checked; no warning, deprecation, error, fatal, failure, or exception matches were found.
- The deployed build verifier passed 7 published articles across 60 PDF pages, confirming embedded cover images, extractable Sinhala text, canonical source links, versioned article-end links, central watermark plus footer on every page, attachment/noindex headers, and sitemap exclusion. Live verification then passed all 7 article PDFs on the custom domain: six indexable routes from the sitemap and the configured `bus-jack-wal-katha` noindex route. Every page linked to a SHA-256-versioned PDF; all downloads returned HTTP 200, valid PDF signatures, an embedded image, `application/pdf`, attachment disposition, and `X-Robots-Tag: noindex, nofollow`.
- The live SEO/Sri Lanka locale workflow run `38865509323` also completed successfully against the deployed main commit. These checks establish build, deployment, download, and technical metadata status; they do not guarantee or claim a Google ranking improvement.## 2026-10-16 — Embed post cover images in article PDFs

### Why

- The earlier PDF release had watermarks and selectable Sinhala, but a live production sample at /downloads/akkai-nangi-wal-katha.pdf contained no embedded image object. That left out the requested post cover and weakened the book-like first page.

### Changes

- Pass each published post's local cover image and alt text into its PDF route. The generator validates that the asset is a local /images/posts file, normalizes it to a compact JPEG with Sharp, and places it inside a framed cover area before the title and source details.
- Extend the production PDF verifier to fail when any published article PDF has no embedded image XObject. Existing per-page watermark/footer, Sinhala text, source link, article CTA, attachment/noindex headers, and sitemap-exclusion checks remain.
- Keep PDF routes as noindex reader copies; the canonical HTML article remains the search result target.

### Verification status

- Before this change, the live lowercase sample PDF returned HTTP 200, was a valid nine-page PDF, and had zero /Subtype /Image objects. The sitemap listed lowercase article routes; an uppercase-slug probe returned 404 and was not used as evidence of a route failure.
- Required GitHub CI, Cloudflare preview/production logs, and post-deploy PDF image verification for this change are pending. Do not treat this entry or a successful commit as deployment evidence.
- Cloudflare Pages API execution is currently blocked by the connector's permission setting; inspect the deployment logs after API execution is enabled.

### SEO boundary

- The PDF remains non-indexable and excluded from sitemaps; no Google ranking or traffic improvement is promised.

## 2026-10-16 — Book-style Sinhala reader PDFs and closing rights page

### Why

- The existing PDF cover rendered portrait artwork as a short landscape strip, and PDFs had no separate closing-use notice. The reader edition needs a real cover, consistent dark book styling, and a final rights reminder without changing story text or existing watermarks/links.

### Changes

- Rebuilt `src/lib/articlePdf.ts` around a large, aspect-preserving cover frame, dynamic title/date/source metadata, dark pages and charcoal cards with red borders, red heading accents, justified Sinhala body text with 1.9-style leading, and quote/block-quote dialogue panels. Native JPEG/PNG cover bytes are embedded unchanged; other supported formats are converted losslessly without cropping or watermark removal.
- Added a dedicated final page explaining personal reading use and that reproduction, modification, republication, distribution, public posting, or sale needs prior written permission from the applicable rights holder. This is a notice, not DRM or a claim of ownership.
- Kept the exact site watermark and source URL, with center watermark and footer on every page. Footer numbering remains `n / total` and now counts the separate cover and final page.
- Extended `scripts/verify-post-downloads.mjs` to require the branded cover metadata, page numbering, per-page watermark/footer, and final notice on every generated article PDF.

### Verification status

- GitHub CI, Cloudflare preview, PDF visual review, and production deployment verification are pending for this PR; no release success is claimed yet.

## 2026-10-16 — Verify PR #57 reader-PDF release

### Correction to the pending status in “Book-style Sinhala reader PDFs and closing rights page”

- This entry supersedes that entry’s pending verification status; the earlier note remains as the record of the initial PR state.
- PR #57 merged to main as commit 08ba9be504162867f4ee6b6467159c6389a9806e. The first CI run, 38882638409, failed because the PDF verifier did not detect the final usage-rights page; follow-up run 38883150185 passed, and auto-merge run 38883146788 succeeded.
- Cloudflare PR preview deployment 0347a236-d929-41f8-b454-9a6e6f7c292f succeeded at https://0347a236.wala-katha.pages.dev. Production deployment 65e32337-7d59-4da5-8016-a95acd1243f9 targets the merge commit; all five stages succeeded. All 173 available production deployment log entries were scanned with no warning, deprecation, error, fatal, failure, or exception matches.
- Live homepage, robots.txt, and sitemap index returned HTTP 200. The live Wanamalee PDF returned HTTP 200 as application/pdf, is 450,228 bytes, has 23 pages, and is marked X-Robots-Tag: noindex, nofollow. Rendered pages 1, 2, and 23 were visually checked: cover, story layout, watermark/page numbering, and final rights notice are present.
- The last full SEO/locale audit remains run 38865509323 on the earlier d68d1ace5c457f2949271f322378fb97442b2bc1 release; no Google rank or traffic improvement is claimed.

## 2026-10-16 — Repair deterministic alt-text and changelog automation

### Why

- Scheduled GitHub Actions run 38878945840 failed with ReferenceError: listPostFiles is not defined in scripts/generate-alt-text.mjs. The generator called a helper absent from that file; the verifier had a separate copy, so ordinary CI had not caught the automation failure.
- The generated changelog was appended at the file end without the repository’s five-entry/20 KiB archive rotation, and generated SEO PRs remained drafts instead of using the repository’s protected, check-gated auto-merge flow.

### Changes

- Added scripts/post-files.mjs as the single recursive Markdown discovery helper used by both the alt-text generator and verifier; added nested-file and draft-exclusion tests and wired them into required CI.
- Added scripts/ai-changelog.mjs to prepend dated entries, retain the five newest entries and 20 KiB limit, archive complete older entries by quarter, and update archive coverage/index. Added retention and duplicate-entry tests.
- Updated the deterministic alt-text workflow’s path filters and staging to include the shared helpers and archive. It now opens or updates a ready bot PR, dispatches required CI, and queues protected squash auto-merge; it never writes directly to main.

### Verification

- Local Node.js 24 run: all 6 tests passed (the 4 existing policy tests and 2 new regression tests). A fixture run discovered and repaired 2 posts, then the full alt-text validator passed.
- GitHub PR #58 merged at 2026-10-16T10:52:01Z as commit bc8e0affffe86b5a9c318c780a483384d4e6aedb; head commit was de891202255ae09ee652836fdadc64abc16ebdf7. CI run 38889820710 and trusted auto-merge run 38889818253 succeeded. CI passed the new regression tests, post cover-alt verifier, static build, and homepage/pagination SEO verifiers.
- Cloudflare preview deployment da673f06-d5ab-4863-97c4-622b990c98c6 and production deployment 289c58bd-091d-49f9-9d02-68249e3f68ff both completed all five stages. All 173 log entries for each deployment, including container logs, were scanned; no warning, deprecation, error, fatal, failure, or exception matches were found.
- GitHub did not show a path-filtered push run for the GITHUB_TOKEN-authored auto-merge. I dispatched the deterministic alt-text workflow on the exact merged main commit; run 38890364296 succeeded, generation and validation steps passed, and the PR-opening step was skipped because no labels needed changes. The PR CI and Cloudflare preview had already validated the same source tree before merge.

## 2026-10-16 — Add 18+ notice to article PDF covers

### Why

- The published PDF covers show the story-start line but leave the remaining cover space without the requested age notice.
- The PDF renderer already uses equal 46-point left and right content margins; preserve that balanced layout and keep reader PDFs non-indexable.

### Changes

- Added a centered Sinhala 18+ notice card directly below the story-start panel on every article PDF cover.
- Added a cover-space guard and made the static PDF build verifier require the notice and under-18 warning on page one of every generated article PDF. The verifier normalizes Unicode and strips whitespace, punctuation, and format separators to tolerate PDF text-extraction boundaries.

### Verification status

- Local Node.js unit/regression tests: 11 passed before the verifier matcher adjustment; rerun is pending.
- The first PR CI run 38900845384 and Cloudflare preview deployment e5a6e3af-f203-4f4e-acc4-00771cf8a7b5 failed at the new page-one notice assertion for akkai-nangi-wal-katha.pdf. The build log confirmed a verifier matching failure; no preview assets were deployed and auto-merge remained blocked.
- A local reproduction with the locked PDFKit/PDF.js versions showed that PDF.js keeps `+` as a symbol and maps some Sinhala vowel sequences differently from their source spelling. The matcher now allows the optional `+` and checks the stable 18-underage and “avoid reading” markers instead of requiring a verbatim extracted sentence.
- A local re-render using PDFKit 0.20.2 and PDF.js 5.4.149 verified the 18+ label, under-18 marker, and “avoid reading” marker on page one of all seven published PDFs; all seven also passed the cover-space guard.
- The second CI run 38901368489 still failed the earlier strict assertion; this follow-up is based on the reproduced first-page extraction. CI and preview verification are pending on the next commit; production deployment and live PDF checks remain pending, so no release success is claimed yet.

## 2026-10-16 — Verify 18+ PDF notice production release

### Why

- The implementation entry stayed pending while CI, Cloudflare Pages, and the live-PDF checks were running. This entry records the final evidence and supersedes that pending status.

### Verification

- PR #60 merged as bfcc113db0c8643cf19626f24d2b8669ba7ebfae from feature commit 5c12e332d0cccce556dfa706ff4f7f3dbae05e5c.
- GitHub CI run 38902226065 passed: type-check, regression tests, complete static build, post-download verifier, and homepage/pagination SEO checks.
- Cloudflare preview deployment 85ac0f0d-244e-4b01-be64-1132b4b30105 and production deployment a08e9deb-0637-44ae-9705-19b56bb16f52 each passed all five stages. Each deployment returned 173 logs (including container logs) with zero warning/error/fatal/failure/exception matches.
- Verified all seven production PDFs and their article-page SHA-256-versioned links. Each PDF returned HTTP 200 as an attachment with application/pdf and X-Robots-Tag: noindex, nofollow; page one contains the 18+ label, under-18 marker, and “avoid reading” warning.
- Purged only the seven stable unversioned PDF URLs from Cloudflare after a warm edge served an old Wanamalee file. Rechecked all seven stable URLs; they now return the updated PDF with the notice.
- The PDF renderer keeps equal 46-point left and right story margins; the new notice card stays within the first-page cover area.

## 2026-10-16 — Expand the first-page PDF age notice

### Why

- The prior PDF release includes only a short 18+ warning, while the requested notice must identify the fictional adult nature of the work, warn minors, clarify parental responsibility and fictionality, and confirm lawful adult access.
- The story-start marker currently appears above the notice. It must follow the complete notice at the bottom of the first page.

### Changes

- Replaced the short warning with the requested Sinhala title and all four full paragraphs in a high-contrast, bordered notice card. A vector warning icon keeps the symbol legible with the embedded Sinhala font.
- Reserved cover space for the larger notice, added a first-page fit guard, and moved “මෙතැන් සිට කතාව නිල වශයෙන් ආරම්භ වේ” immediately below the notice.
- Extended the production PDF verifier to check representative text from every requested paragraph and the ordering of the story-start marker after the complete notice.

### Verification status

- Baseline before this change: main commit 8256791c79fc922aa702b97d954613bdaf453fa9; Cloudflare production deployment 41fa8fc0-febc-469f-bc1e-9475e593056b passed all five stages. All 173 returned logs, including container logs, were scanned with no warning, deprecation, error, fatal, failure, or exception matches.
- The live SEO/Sri Lanka locale audit passed on the pre-change baseline: 26 indexable URLs, one sitemap chain, canonical and locale metadata, and the configured noindex article checks.
- This entry’s pending verification status is superseded by the dated “Verify expanded first-page age notice production release” entry below. The first strict PDF-extraction checks exposed Sinhala font-mapping variants; the final CI verifier accepts the verified stable anchors while preserving first-page and notice/story order checks.

### SEO boundary

- This change affects downloadable reader PDFs, which remain noindex and excluded from sitemaps. Canonical HTML and Sri Lankan locale metadata are unchanged. No Google ranking improvement is promised.

## 2026-10-16 — Verify expanded first-page age notice production release

### Correction to the pending status in “Expand the first-page PDF age notice”

- This entry supersedes that entry’s pending verification status while preserving its implementation notes and initial failures as historical context.
- The first three PDF extraction assertions exposed Sinhala font-mapping differences rather than missing visible notice content: PDF.js/Poppler reorder vowel signs or substitute glyph text, including in the adult-audience phrase and story-start line. The verifier now uses stable Sinhala anchors and still requires every notice section plus story-start-after-notice ordering. Rendered page one was visually checked.

### Verification

- PR #62 merged to protected main as a5f03e34d99794603897ad40509516889c03762b; feature head was 678495955875ded2bd06d036499d93079b49ffe2. GitHub CI run 38912470940 passed type-check, regressions, all seven generated-PDF notice/fit checks, static build, pagination SEO, and homepage SEO.
- Cloudflare preview deployment ee740317-8d6e-4965-aa48-9682581a59cb and production deployment ceba01ac-4184-4de0-b9e1-7dc5c5256080 each passed all five stages. All 173 log entries per deployment, including container logs, were scanned with zero warning, deprecation, error, fatal, failure, or exception matches.
- Post-release node scripts/verify-live-seo.mjs passed: 26 indexable pages, sitemap/feeds, canonicals, Sinhala language, si-LK locale metadata, and the configured noindex article checks.
- All seven live SHA-256-versioned article-PDF links, including the configured noindex article, returned HTTP 200 application/pdf attachments with X-Robots-Tag: noindex, nofollow. Page-one 18+ title, under-18 and avoid-reading notices, legal confirmation, and story-start-after-notice ordering passed. One live A4 cover was raster-rendered and visually checked for the warning icon, notice layout, ordering, and fit.
- Local node --check, git diff --check, and the AI changelog retention test passed. The retention utility archived the oldest dated entry without splitting or rewriting it.

### SEO boundary

- The PDF change does not alter indexable HTML. Technical SEO/locale checks pass, but Google rankings are not guaranteed. No new Search Console performance window was available; the latest repository snapshot remains the 2026-10-15 run covering data through 2026-10-12.

## 2026-10-16 — Improve interior-page PDF watermark visibility

### Why

- A live 13-page article PDF showed that the center watermark was generated on every page, but story pages used only 18% opacity and the watermark sat over dense text. The cover and final rights page also contain separate, fully opaque URL text, making the middle-page watermark look absent by comparison.

### Changes

- Track each generated page role and render the centered watermark at 30% opacity on story/content pages while preserving 18% on the cover and final rights page.
- Keep the page footer, page numbering, exact site URL, existing PDF noindex behavior, and the all-pages watermark verification unchanged.

### Verification status

- Baseline live PDF returned HTTP 200 as application/pdf. Rendered pages 1, 7, and 13: the centered watermark exists on all three, but content pages were visibly much fainter than the extra cover/rights URL labels.
- Local diff and build checks, PR CI, Cloudflare preview/production deployment, deployment-log review, and post-release PDF rendering are pending.

### SEO boundary

- No canonical HTML, metadata, sitemap, or indexing behavior changes are intended. Reader PDFs remain noindex and excluded from sitemaps; no Google ranking result is guaranteed.

## 2026-10-17 — Restrict the centered PDF watermark to story pages

### Why

- The user clarified the original requirement: the cover-image page and final rights page must not have the large centered URL watermark, while every story page between them must retain it. PR #64 raised the interior watermark to 30% but left a faint 18% centered watermark on the cover and final page.
- The live PDF review confirmed this mismatch in three production PDFs (13, 5, and 23 pages; 41 pages total). The existing cover artwork, source attribution, and repeated footer URL are separate elements and should remain intact.

### Changes

- Draw the centered URL watermark only on pages tracked as story/content pages, at the existing 30% opacity. Do not draw it on the cover or final rights page.
- Strengthen the build-time PDF verifier to require exactly one centered watermark on every interior page, none on the first/final page, and the existing footer URL on every page.
- Preserve PR #64's historical entry; apply the active-log five-entry/20 KiB rotation policy.

### Verification status

- Before this follow-up, the live sample PDFs returned HTTP 200 as application/pdf and X-Robots-Tag: noindex, nofollow. The 13-page, 5-page, and 23-page files were checked across all 41 pages: the centered watermark appeared on every page at 18% on the cover/final page and 30% on interior pages. Pages 1, 7, and 13 of the 13-page PDF were rendered and visually reviewed.
- PR #65 merged at 2026-10-17T03:28:45Z as commit 098d654405032ad3c4ba7eb03e3b8a98bde955b9. The Type-check and production build check (GitHub Actions run 38998719644) and Cloudflare Pages PR check succeeded.
- Cloudflare preview deployment 806aac5e-d3d9-40fe-b364-b4ed5d055579 and production deployment a3dbc699-120c-4fb5-8ac7-31711abdaf53 completed all five stages successfully. All 173 returned log entries for each deployment, including container logs, were scanned; no warning, deprecation, error, fatal, failure, or exception matches were found.
- The post-deploy Akkai Nangi production PDF (13 pages) returned HTTP 200 as application/pdf with X-Robots-Tag: noindex, nofollow. PDF.js checks confirmed zero centered 22pt URL watermarks on pages 1 and 13, exactly one on pages 2–12, and the 8pt footer URL plus page number on all 13 pages. PyMuPDF confirmed 30% opacity on every interior centered watermark.
- Production pages 1, 7, and 13 were rendered and visually reviewed; the requested cover/final-page removal and interior-page watermark are confirmed.

### SEO boundary

- This changes PDF rendering and its build verifier only. HTML metadata, canonical URLs, sitemap, and indexing rules are unchanged; no Google ranking outcome is claimed.

## 2026-10-17 — Add author-rights banner and complete usage terms to reader PDFs

### Why

- The attached request asks for a high-contrast author-rights notice at the end of every story and a complete replacement of the final PDF rights page. The existing renderer only had a short legal summary and no highlighted end-of-story notice.

### Changes

- Add a white-text author notice in a black, white-outlined banner after the story body and before the final rights page. If the story's last page has insufficient room, place the notice on a new story page rather than clipping it.
- Replace the old final-page legal paragraphs with the requested Sinhala private-use, ownership, prohibited-actions, attribution/watermark, warning, and acknowledgment sections, including all six prohibited actions.
- Extend the generated-PDF verifier to check the notice on the last story page, required rights-section text on the final page, and that legal text and source links fit without creating an extra page. Existing watermark, footer, page numbering, noindex, attachment, source-link, and sitemap exclusion checks remain in force. The PDF cache version automatically changes because the renderer source is already part of its SHA-256 inputs.

### Verification status

- Local production build succeeded for all seven published articles; the verifier checked 74 PDF pages for the new notice and rights terms plus existing watermark/footer/page-number/header/sitemap rules.
- Local pagination SEO and homepage SEO verifiers passed. Existing unit/regression suites passed (5 + 12 tests), and cover-alt verification passed for 11 posts.
- Rendered and visually reviewed the last story page and final rights page of the 13-page Akkai Nangi PDF; the black banner is legible, the complete legal page fits, and page numbering remains intact.
- Local Astro diagnostics did not finish in the constrained sandbox and timed out while collecting diagnostics. GitHub CI type-check and PR Cloudflare preview/production deployment verification are pending; no production success is claimed yet.

### SEO boundary

- This changes generated reader PDFs only; HTML metadata, canonical URLs, robots rules, and sitemaps are not edited. The existing build verifier continues to require PDF attachment/noindex headers and exclusion from XML sitemaps. No Google ranking outcome is promised.

## 2026-10-17 — Verify author-rights PDF release in production

### Correction and outcome

- This follow-up supersedes the pending CI/Cloudflare/live-verification status in “Add author-rights banner and complete usage terms to reader PDFs” above. The change is now merged and released; the earlier entry remains as the implementation record.

### GitHub and Cloudflare release evidence

- PR #67 merged on 2026-10-17T04:35:13Z as squash commit 858b65e81dfc9a8a14b4d8b790b3dca73165071b from feature commit 0f223e632772076ebc55da928b23961abc5465f9.
- GitHub CI run 39002856576 succeeded, including Astro type-check, regression/SEO tests, and production build. Trusted auto-merge run 39002856560 succeeded after required checks.
- Cloudflare preview deployment a615005d-bb5a-4fbe-8be5-e69df370c7b0 and production deployment 45816c70-c0fb-4109-b583-0a68a4fef204 both targeted the expected commits and completed all five stages. Each returned 173 log entries; scans found zero warning, deprecation, error, fatal, failure, or exception matches.

### Live PDF verification

- All seven live article pages link to their current SHA-256-versioned PDF; all seven downloads returned HTTP 200, application/pdf, Content-Disposition attachment, and X-Robots-Tag noindex, nofollow.
- PDF.js verified all seven released PDFs (74 pages total): the author notice is present on the last story page, every requested rights section and all six prohibited actions are on the final page, the centered watermark appears exactly once on each interior page and not on cover/final pages, and every page retains its footer, page number, source/article links, and extractable Sinhala text.
- Production pages 12–13 of the 13-page Akkai Nangi PDF were rendered and visually reviewed; the black-and-white author banner and complete final legal page are visible, without clipping, and page numbering is intact.

### Live SEO verification

- scripts/verify-live-seo.mjs passed after deployment: homepage, sitemap chain, 26 indexable pages, corrected-article discovery in XML/image/RSS, and the configured noindex article excluded and marked noindex,follow; canonical URLs, Sinhala lang, si-LK/x-default hreflang, descriptions, and si_LK Open Graph locale all passed.
- Latest verified GSC keyword sync is still run 38700591415 (2026-10-15); the post-recrawl follow-up run 38726508677 also predates this release. There is no post-release Search Console ranking evidence, and no Google position is claimed.

## 2026-10-17 — Remove the duplicate author-rights note from story PDFs

### Root cause

- The supplied PDF screenshot shows the rights statement twice at the story ending: the Markdown blockquote is rendered as a dialogue callout, and the PDF renderer adds its own black banner. The earlier release check confirmed the banner was present but did not count duplicate statements.
- A scan of all ten story Markdown files on main found one matching end-of-story note in each source file.

### Changes

- Keep the Markdown note intact for the article's HTML; skip only the standalone Sinhala rights-note line when converting Markdown into PDF story blocks. Retain the generator-owned single black banner with white text.
- Extend the generated-PDF verifier to require exactly one complete-rights marker on the final story page for every published article PDF.
- The existing PDF cache version hashes the renderer source, so generated links automatically get a new version. No HTML metadata, canonical URLs, sitemap, or indexing rules change; reader PDFs remain noindex.

### Verification status

### Verification

- PR #69 merged to protected main as `0b8d3267ffe903c1ae2e24973af3a3ceac33dc0c` from corrected feature head `7501160af5bab4d33d1c91a15faeef0c5f7d3c10`. The first verifier draft at `9dfe175f98c249950a96c1f77fe841d8e92453e5` failed its build with `SyntaxError: missing ) after argument list`; it was repaired before merge, and that failed draft was not deployed to production.
- GitHub CI run `39025636464` passed type-check, regression and changelog tests, static build (including generated-PDF verification), pagination SEO, and homepage SEO checks.
- Cloudflare preview deployment `5c14e350-031a-4693-af53-85f90e462740` and production deployment `9f1a995a-ab69-4ea1-a38e-22a61a69831f` both completed queued, initialize, clone, build, and deploy stages successfully. All 173 log entries from each deployment, including container logs, were reviewed; neither had warning, deprecation, error, fatal, failure, or exception matches.
- The production Bus Jack article retains its Markdown rights note. Its versioned live PDF returned HTTP 200 as `application/pdf` with `X-Robots-Tag: noindex, nofollow`; text extraction found exactly one full rights marker on page 4 of 5. PyMuPDF rendering visually confirmed a single dark/black banner with white 9pt text.
- No individual story Markdown files were changed. The shared renderer automatically filters the recognized standalone Sinhala rights-note variants for current and future article PDFs; the generated-PDF verifier fails when the final story page contains anything other than exactly one complete rights marker.
- SEO boundary: this is a PDF-only correction. HTML metadata, canonical URLs, sitemap, and indexing behavior were not changed, and no Google ranking result is claimed.

## 2026-10-18 — Scope reader tools and comment warm-up to article pages

### Why

- The PageSpeed Insights report supplied for the homepage (captured 2026-10-17) shows a mobile Lighthouse performance score of 79, with SEO, accessibility, and best practices at 100; total network transfer is 556 KiB. Its critical request chain includes the 17.50 KiB ReaderTools module, and the homepage has an unused preconnect to the comments Worker. The report also attributes 575 ms of forced reflow to Astro ClientRouter.
- Reader tools and the comments/likes API are article features, but Base.astro emitted their script and DNS/TLS hints on every route.

### Changes

- Render ReaderToolsHead and ReaderTools only when the shared layout receives isArticle=true; article reading preferences and controls remain available.
- Emit the comments Worker preconnect and dns-prefetch only on article pages, where comments and likes use that origin.
- Add scripts/verify-homepage-performance.mjs to the production build. It checks that generated homepage HTML does not render/download the reader panel or preconnect to comments, while generated article pages retain all three.
- Keep Astro ClientRouter, age gate, ad behavior, HTML content, canonical/hreflang/robots metadata, and sitemap rules unchanged. No Google ranking outcome is claimed.

### Verification status

- Baseline production Pages deployment 711052b7-5f73-40c3-848e-ec6cbde32c40 from commit 9b8f9441a2c2be666dc7293b854f37ac76fa5066 was checked; all five deployment stages succeeded. All 173 returned log entries, including container logs, were checked; no warning, deprecation, error, fatal, failure, or exception marker was found.
- The supplied mobile snapshot reports lab LCP 3.6 s, FCP 2.0 s, TBT 300 ms, CLS 0, and Speed Index 4.7 s; field-data p75 values are LCP 3.7 s, INP 442 ms, and CLS 0.25 for 2026-09-17 through 2026-10-14. These 28-day field metrics cannot confirm a new release's effect.
- Fetching the supplied desktop report URL exposed the same mobile-emulated result rather than an independent desktop run. Fresh PageSpeed API requests returned HTTP 429 because that API project's daily quota is zero. Desktop score and post-change Lighthouse/CrUX measurements therefore remain unverified.
- The forced-reflow finding is left unchanged to preserve client-side navigation; this change targets the measured unused article script and preconnect without changing route behavior.
- PR #71 merged automatically after GitHub Type-check and production build and Cloudflare Pages checks both completed successfully. Preview deployment 102e6bc4-5bcc-4bca-8308-7b9f52050d0c completed all five stages successfully; all 174 log entries, including container logs, had no warning, deprecation, error, fatal, failure, or exception markers.
- Production deployment 49a9b25a-ad76-46d8-8a9b-4c46174be58b built and deployed commit f1c7500c8c1f7c0aaf0dd76629c1a6c63eb71129; all five stages succeeded and none of its 174 log entries matched those markers. Live homepage and a sitemap-selected article route both returned HTTP 200. Raw HTML checks confirmed the homepage omits the reader-tools root, its JavaScript bundle, and comments preconnect, while the article retains all three.
- PageSpeed API reruns remain blocked by HTTP 429 (daily quota zero); the desktop fetcher returned the mobile-emulated report. No independent desktop score or post-release PageSpeed/CrUX change is verified.

## 2026-10-18 — Re-check homepage PageSpeed after the production optimization

### Why

- The user supplied a saved PageSpeed Insights MHTML snapshot while the homepage performance optimization (PR #71) was already live. This follow-up records what that distinct snapshot verifies and which remaining diagnostics belong to other systems or have a navigation trade-off.

### Findings

- The attached snapshot URL is the mobile report ny10ywdw27; it was captured at 2026-10-18 08:14 GMT+5:30. It is not the js3jhb6qnu report ID in the URLs written in the request, so do not treat the attachment as the desktop result or as a matched rerun of the earlier 2026-10-17 report.
- Mobile Lighthouse scores are Performance 87, Accessibility 100, Best Practices 100, and SEO 100. Lab metrics: FCP 2.0 s, LCP 3.5 s, TBT 0 ms, CLS 0, and Speed Index 4.3 s.
- The report has insufficient URL-specific CrUX data. The separate origin-level 28-day data shows p75 LCP 3.7 s, INP 442 ms, and CLS 0.25 (Core Web Vitals assessment failed). These rolling origin metrics do not establish a post-release effect.
- Remaining Lighthouse diagnostics include 586 ms forced-reflow time attributed to Astro ClientRouter, a 1,001–1,051 ms critical request chain including the Cloudflare beacon and /cdn-cgi/rum, and an estimated 10 KiB of legacy JavaScript from Cloudflare utility. These are diagnostics, not failed SEO/accessibility checks. The Cloudflare utility is outside the generated app bundle; removing it may give up analytics. Removing ClientRouter would change soft navigation to full-page loads and remove route transitions, so neither change is made without an explicit product decision.
- PR #71 already removes the article-only ReaderTools bundle and comments Worker connection hints from the homepage, keeps them on article pages, and adds a build-time regression verifier. This snapshot is not a controlled before/after test; no causal score increase or Google ranking result is claimed.

### Verification status

- GitHub PR #71 is merged as production-source commit f1c7500c8c1f7c0aaf0dd76629c1a6c63eb71129. Its CI run 39090192157 and Cloudflare PR deployment 102e6bc4-5bcc-4bca-8308-7b9f52050d0c succeeded.
- Production deployment 49a9b25a-ad76-46d8-8a9b-4c46174be58b built that source commit; all five stages succeeded. All 174 log entries, including container logs, were checked for warning, deprecation, error, fatal, failure, and exception markers; none matched.
- The current homepage returns HTTP 200; the apex host redirects to the www host, and the robots and sitemap-index endpoints return HTTP 200. Live homepage HTML has the expected canonical, si-LK/x-default hreflang, si_LK Open Graph locale, and Sinhala description; it omits the ReaderTools root/bundle and comments Worker preconnect. The PR build verifier confirms article pages retain those reader/comment features.
- The most recent production Pages deployment is documentation-only deployment 434f4af7-a176-45ab-a1ba-00e82b23ff4f from main commit 2e0ca757c6a5de5ea1e4bed55f06410674e1b63e; all five stages succeeded and all 174 returned log entries had no warning/error markers.

### SEO and measurement boundary

- No app source or Cloudflare analytics setting changed in this follow-up. Search ranking cannot be guaranteed. Use a new, matching mobile/desktop PageSpeed run and a later 28-day CrUX window before attributing a performance change to PR #71.

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


## 2026-10-23 — Tighten the homepage title layout and redraw its feminine silhouette

### Request and changes

- Review of the supplied phone screenshot found the title stage reserved 8.5rem of mobile height while the figure itself reserved 128px; this pushed the featured story down and left unnecessary space.
- Reduced the title stage, then browser screenshot review caught CSS grid auto-placement putting the H1 under the figure; explicitly anchored both to row 1 and increased the mobile figure to 110px for a clearer, more legible side-by-side layout.
- Trimmed the title-to-slider gap and changed the neon red heading to restrained warm ivory on black.
- Redrew the decorative white figure as a CSS-only silhouette with flowing hair, a defined waist/hips, and a fitted full-length shape. No photo, image file, inline SVG, canvas, font, or external asset is added. The live Sinhala H1 and SEO metadata stay unchanged.
- Strengthened the homepage regression verifier for the no-image design, compact mobile spacing, and silhouette geometry.

### Verification status

- Implementation and preview verification are pending. This change is on the existing draft PR #89; no merge or production deployment has been performed.

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

## 2026-10-24 — Correct the Sinhala homepage title spelling

### Request and changes

- Corrected the visible gold H1 phrase from `සිංහල වැල් කතා` to `සිංහල වල් කතා`, making the full selectable H1 and accessible label exactly `සිංහල වල් කතා සහ වැල් කතා`. The pointing emoji was not added to the title. Gold styling, ivory phrase, underline, badge, and layout remain unchanged.
- Updated the homepage verifier to require the corrected exact H1.
- Implementation commit `eac083a92b5161799cfe5811db8d588bd114f6aa` passed GitHub Actions CI run `40063106510`; Type-check and production build and Cloudflare Pages checks succeeded. The auto-merge workflow was skipped.
- Cloudflare Pages Preview deployment `41261a03-4756-47c2-ba8e-cae2cc4c5a97` completed all five stages successfully for that exact commit: https://41261a03.wala-katha.pages.dev.
- Direct Preview rendering returned HTTP 200 with the exact H1 and accessible label `සිංහල වල් කතා සහ වැල් කතා`; the gold styling remains solid `#d8a22b` with no shadow, blur, or gradient. The title contains no image markup or image reference.
- Cloudflare returned 174/174 deployment-log records, including container logs; none matched warning, error, failed, failure, fatal, or exception markers. PR #91 remains a draft; no merge or Production deployment occurred.

## 2026-10-24 — Remove the gold title glow

### Request and changes

- Replaced the first Sinhala title phrase's gold gradient and colored glow with one solid `#d8a22b`; removed text-shadow and drop-shadow. Kept background clipping limited to the ivory phrase so modern browsers display the gold as a solid color.
- Updated the homepage verifier to require solid gold and no gold text shadow, blur/filter, gradient, or transparent fill. Wording, title layout, ivory styling, underline, badge, and text-only markup are unchanged.
- Implementation commit `d3547eb876b20fce20734a0d18912b14c9eb9735` passed GitHub Actions CI run `40062367180`; the Type-check and production-build check and Cloudflare Pages check succeeded. The auto-merge workflow was skipped.
- Cloudflare Pages Preview deployment `96c01242-6e2d-4fc9-87a7-44c1ba697887` completed all five stages successfully for that exact commit: https://96c01242.wala-katha.pages.dev.
- Direct Preview rendering returned HTTP 200 with the exact selectable Sinhala H1. Compiled gold CSS is `.home-title__gold{color:#d8a22b;text-shadow:none;filter:none}`; the gold phrase has no gradient, colored shadow, or drop-shadow, and the title region has no image markup or image reference.
- Cloudflare returned 174/174 deployment-log records, including container logs; none matched warning, error, failed, failure, fatal, or exception markers. PR #91 remains a draft; no merge or Production deployment occurred.

## 2026-10-24 — Deepen the homepage title gold tone

### Request and changes

- Updated the first Sinhala title phrase on draft PR #91 from yellow-leaning highlights to a richer gold/amber metallic gradient and a matching deep-gold fallback. The wording, layout, ivory phrase, red underline, 18+ badge, and text-only implementation remain unchanged.
- Updated the homepage verifier to check the new gold fallback and amber gradient stops.
- Implementation commit `5325b32b04ca2c3a21abec88e14f648d08d351dc` passed GitHub Actions CI run `40060672320`; the Type-check and production-build check and Cloudflare Pages check both succeeded. The auto-merge workflow was skipped.
- Cloudflare Pages Preview deployment `6d47b9f2-ff36-465b-b025-25692fe7cc89` completed all five stages successfully for that exact commit: https://6d47b9f2.wala-katha.pages.dev.
- Direct Preview rendering returned HTTP 200 with the exact selectable Sinhala H1. Compiled title CSS contains the new fallback `#d8a22b` and warm gold/amber gradient stops `#dba328` and `#bd7915`; no title markup or layout changed.
- Cloudflare returned 174/174 deployment-log records, including container logs; none matched warning, error, failed, failure, fatal, or exception markers. PR #91 remains a draft; no merge or Production deployment occurred.

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

## 2026-10-24 — Add online, audio, and PDF feature article

### Request and changes

- Added the Sinhala article at `/blog/online-wal-katha-audio-pdf/` with the supplied SEO title and description, story-availability caveat, and a styled CTA to the site. Added the supplied 1672×940 banner, optimized to 208,738-byte WebP.
- Kept the change on feature branch `content/online-wal-katha-audio-pdf-20261024` in draft PR #92; no merge or Production deployment.

### Verification

- GitHub Actions CI run `40085379078` passed on article commit `15aac01abfe09e0576127aee8b99f98f8b4b1c44`, including Astro type-check, tests, alt-text policy, static build, pagination SEO, and homepage SEO. Astro reported 0 errors, 0 warnings, and 27 hints. CI logs still contain the existing Node `DEP0040`/`DEP0169` deprecations and diagnostics in unchanged files; none identify the new article or image.
- Cloudflare Pages Preview deployment `1d01ee11-5d0f-47d3-874f-b49ff42036a5` succeeded through all five stages for the same commit: https://1d01ee11.wala-katha.pages.dev. All 185 available deployment-log records were checked; none matched warning, error, failed, fatal, or exception markers.
- Preview article URL returned HTTP 200 with the requested title, description, canonical URL, CTA, and 18+ banner; the WebP returned HTTP 200. Desktop (1365×900) and mobile (390×844) Chromium captures showed the site's existing 18+ confirmation gate at both sizes. Did not confirm/bypass the age gate. The Preview response is noindex, as expected; Production remains unchanged pending explicit approval.
.

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

## 2026-10-25 — Make the homepage banner fill its frame

### Request and change

- Follow-up to “Remove black gutters from the homepage featured banner”: the brighter blurred backdrop still left the original artwork visually inset on the supplied mobile screenshot.
- Change only the first featured image from `object-contain` to a top-aligned `object-cover`. This removes the side gutters while keeping the embedded Sinhala heading, 18+ badge, and PDF/audio icons in view; it crops some lower bedding. Other slides, assets, routes, and frame dimensions remain unchanged.
- Update the responsive Chromium assertions to require the cover fit, top crop, working image decode, and equal slide heights at all 11 viewport widths.

### Verification status

- Local `git diff --check`, `node --check scripts/verify-responsive-layout.mjs`, and `yarn check` passed; `yarn test` passed (8/8). The local `yarn build` timed out during static route generation, but GitHub Actions CI run `40213794263` passed the Type-check and production-build job for code commit `ab40138288791f7243bb050803aaaed8c35a0f5e` in draft PR #102.
- Cloudflare Pages Preview deployment `83aea326-5994-492c-8d9d-0b70adc9aa62` completed successfully for that exact commit: https://83aea326.wala-katha.pages.dev. The responsive Chromium test passed at 280, 320, 390, 461, 640, 700, 768, 1024, 1440, 1920, and 2560px: the banner image decoded from the expected mobile/desktop sources, used `object-fit: cover` and `object-position: 50% 0%`, retained equal slide heights, and the homepage/article checks found no horizontal overflow. The age gate was not interacted with.
- All 175 returned Cloudflare deployment-log entries, including container logs, were checked; no warning, error, failed, failure, fatal, or exception markers were found.
- Production remains on deployment `543a827d-6f9d-44df-a19c-9f346558de18`, commit `d92b2a507bfc920fd6bb7c36eb824e308390a878`. PR #102 remains a draft; no merge or Production deployment was performed.

## 2026-10-27 — Complete the story-rating Preview integration

### Root causes and changes

- Resolved the two strict-null Astro type-check errors in StoryRating.astro by capturing the story ID and submit button only after validating both values.
- The story routes and Astro content IDs use lowercase slugs, while the generated API allowlist preserved filename capitalization. Lowercase the generated IDs, regenerate the seven-story allowlist, and add regression coverage for canonical route IDs and case mismatches.
- The Preview D1 database existed and its tables were migrated, but the Pages runtime did not receive the DB binding from Wrangler configuration. Add the existing walakatha-rating-preview database binding under env.preview only; keep Production unbound.
- Extend the Preview smoke test to read the real route-derived rating API and validate its totals, buckets, and average without submitting test votes. Extend Chromium coverage to assert the rating widget, matching route ID, five accessible choices, summary, breakdown, live status, and viewport fit at all 11 widths. Keep the age gate untouched and make the local Astro preview test server stay in the foreground in Replit Agent.

### Verification

- Local yarn test passed 17/17; yarn check passed; yarn build completed all 51 pages and the PDF, featured-link, social-image, critical-CSS, homepage-performance, and sitemap-indexability verifiers. The built article rendered five choices with the canonical lowercase slug. Local Chromium runs were unreliable in this Replit sandbox with about 204 MB available memory; the hosted CI browser test below passed on the same implementation commit.
- GitHub Actions CI run 40541834937 passed every step for implementation commit 95d67f701035ed2ab91e7b3a5ddb0cd1f1d611b0 in draft PR #105: Astro type-check, tests, build, responsive Chromium at 280, 320, 390, 461, 640, 700, 768, 1024, 1440, 1920, and 2560px, SEO checks, and Preview route/API/noindex/age-gate verification. The API smoke returned HTTP 200 for methsala-akka-wal-katha with 0 votes and average 0. Existing dependency/action deprecation notices and Astro hints in unrelated files remain.
- Cloudflare Pages Preview deployment 62f5df25-1a99-401d-93a4-8a503dc3c7e9 completed all five stages successfully for that exact commit: https://62f5df25.wala-katha.pages.dev. A separate read-only smoke returned HTTP 200 for /blog/akkai-nangi-wal-katha/ and /api/rating?story=akkai-nangi-wal-katha; the article contained the widget and five inputs, and the API returned all five zero-count buckets, 0 votes, and average 0. No POST or demo vote was submitted.
- After the Preview deploy, Cloudflare still reported Production deployment 6e110384-5552-454c-bc87-8970f98a2305 on main commit 05d5ded3cce4a1084c6cba334cac19b7e696c31b; Production D1 binding is null while Preview is bound to the existing rating database. PR #105 remains a draft; no merge or Production deployment occurred.

## 2026-10-28 — Improve story-rating feedback and audit Google snippets

### Request and changes

- Make a successful story rating show a brief, accessible thank-you toast that dismisses itself; highlight the selected rating tile green while keeping its star gold; remove the duplicate-vote privacy footnote from the widget.
- Extend the responsive Chromium test to verify the selected color, gold star, success toast, automatic dismissal, and removal of the footnote. The test stubs rating API requests, so it does not write votes to the Preview or Production database.
- Audited the added request for Google Search stars against Google's current review-snippet guidance. The story page is an Article/BlogPosting; that generic type is not listed as eligible for Google's review-snippet star feature. Do not emit misleading AggregateRating markup or relabel a story as a Book/Episode to try to qualify. Revisit only if a page genuinely represents a Google-supported type and the rating is visible and real; valid markup still does not guarantee a rich result.

### Verification

- `yarn test` passed all 17 tests; `yarn check` passed; the changelog/archive retention tests passed 2/2. Dependencies were installed from the checked-in frozen lockfile. Both full builds attempted in this local 1.6 GiB cgroup were killed with exit 137, including the capped-heap retry.
- GitHub Actions CI run `40636663470` passed for commit `f50d9ca0725062aab42fdf73caeaa89ad07ae691`: type-check, CI test steps, static production build, responsive Chromium, SEO output, Preview route, and age-gate checks all succeeded.
- Cloudflare Pages Preview deployment `61ce2c40-7232-44cd-b95f-183b9aebcdf2` completed all five stages successfully for that exact commit: https://61ce2c40.wala-katha.pages.dev. The article and read-only rating API GET returned HTTP 200; the aggregate remained at 0 votes. Direct Preview Chromium checked the article at 280, 320, 390, 461, 640, 700, 768, 1024, 1440, 1920, and 2560px with no horizontal overflow; all five choices and the toast were present, and the removed footnote was absent. CI's isolated mocked interaction also passed the green selected tile, gold star, success toast, and auto-dismiss assertions. No live POST was sent.
- PR #105 remains open as a draft. No merge, `main` update, or Production deployment occurred.
