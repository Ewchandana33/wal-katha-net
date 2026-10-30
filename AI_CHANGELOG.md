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

- archive/AI_CHANGELOG-2026-Q4.md — 73 earlier dated entries from 2026-10-14 through 2026-10-29; dated sections are retained verbatim.

## Recent entries

## 2026-10-30 — Index every published story and comment

### Changes

- Remove the final post-specific `noindex` exception and use the shared noindex list consistently for article pages, the XML sitemap, image sitemap, and RSS feed. The existing 18+ age gate remains unchanged.
- Extend the Cloudflare Preview audit to require every published story in the sitemap and to compare every current public post comment, post reply, review comment, and review reply against the article’s initial server-rendered HTML.
- Correct the isolated Chromium fixture so rating comments and review replies use separate capture variables and both requests are asserted independently.

### Verification

- Read-only Production audit returned HTTP 200 for all seven published story routes. Before this branch change, six were in the XML sitemap and one had an explicit `noindex` exclusion. All current public post comments (3–7 per story) were present in initial HTML; the Production review-comments API reported zero records. The previous Preview contained review comments and replies in initial HTML.
- Local Node regression suite passed 47/47; changelog test passed 1/1; JavaScript syntax checks and `git diff --check` passed. A full local dependency install did not finish within 15 minutes, so local type-check/build/Chromium were not claimed; GitHub CI and the updated Preview are pending.
- Preview/API checks are read-only; no comment, review, like, or reply was posted. No merge or Production deployment was performed.

## 2026-10-30 — Restore comment submissions and improve comment dialogs

### Changes

- Exempt /api routes from trailing-slash redirects so post/review comments, replies, and likes reach their handlers with the original method and body; preserve non-GET/HEAD methods with 308 for other canonical redirects.
- Lock page scrolling while the post-comment modal is open and restore the previous position when it closes or the page navigates. Make liked post comments explicitly red, give post replies a distinct dark-red surface, and show link warnings centered over a paired transparent blur backdrop.
- Extend middleware and isolated Chromium regression coverage to exercise post/review submissions, comment likes/replies, modal scroll lock, reply styling, and paired warning dismissal. API writes in browser tests are stubbed.

### Verification

- Production read-only GET checks confirmed slashless comment/rating API paths were redirected with 301 while their trailing-slash paths returned 200. Local yarn test passed 47/47; node --check scripts/verify-responsive-layout.mjs and git diff --check passed. The isolated Chromium run, type-check, build, GitHub CI, and Cloudflare Preview are pending. No live comment, review, like, or reply POST was sent; Production was not changed.

## 2026-10-30 — Warn on links while comments are being written

### Changes

- Show the existing auto-dismissing Sinhala link warning as soon as a prohibited link is typed or pasted in post comments, post replies, rating reviews, or review replies. Warn once for each link insertion, and allow a new warning after the link is removed; retain submit-time and API enforcement.
- Add unit and isolated Chromium regression coverage for immediate detection and confirm all four text fields use the shared detector.

### Verification

- Local `yarn test` passed 45/45; `node --test scripts/ai-changelog.test.mjs`, JavaScript syntax checks, and `git diff --check` passed. GitHub Actions run `41002880981` passed for code commit `1f568fb9249eaa60e425ba5304a6b9f46fed56a8`: Astro type-check, CI test suites, the 51-page production build, responsive Chromium/UI, pagination and homepage SEO, and Preview route/noindex/age-gate checks.
- Cloudflare Preview deployment `6048bdcf-acd6-4c3f-9642-2cd593e88f0a` completed all five stages successfully for that exact commit: https://6048bdcf.wala-katha.pages.dev. Production remains on deployment `6e110384-5552-454c-bc87-8970f98a2305`, main commit `05d5ded3cce4a1084c6cba334cac19b7e696c31b`; PR #105 remains open as a draft. No live comment, review, like, or reply POST was sent, and no merge or Production change occurred.

## 2026-10-29 — Block links in comments and remove legacy links from display

### Changes

- Add one shared, normalization-aware link policy for article comments, post-comment replies, rating reviews, and review replies. Reject link submissions in both the browser and Pages APIs; route article-comment writes through a same-origin, rate-limited endpoint before forwarding them.
- Show an accessible Sinhala warning popup that disappears automatically. Sanitize historical comment and reply text in APIs and server-rendered pages so links are not displayed while safe surrounding opinion text remains.
- Fix the undefined interaction API variable in the existing comment client.
- Restore all 22 dated sections missing from this branch's Q4 archive, retain the three branch-only archive entries, and rotate the oldest active entry so all 70 archived sections are unique and the active log retains five entries.

### Verification

- `yarn test` passed 43/43. `node --check` passed for the changed JavaScript API/helper modules, and `git diff --check` passed. Hosted CI/build and the new Cloudflare Preview are pending; no live comment, rating, or reply POST was sent, and Production was not changed.

## 2026-10-29 — Repair responsive review comments and like toggling

### Changes

- Fix the root style-scope defect: comment cards, like/reply controls, and textareas are created after Astro renders, so component-scoped selectors did not reach them. Anchor explicit global selectors to the comments dialog and restyle it with black surfaces, red accents, readable section/card separation, wrapping, visible focus, and touch-sized controls.
- Make the like API accept a validated desired `liked` state, with repeat-safe add/remove operations and legacy requests without that field still setting a like. Update client ARIA state and add API/UI regression coverage.
- Extend the isolated Chromium fixture to exercise modal fit at all 11 configured viewport widths and verify dynamic card/textarea styles, like/unlike count changes, and reply interaction. All API writes remain stubbed.
- Correct a test-only async race found in the first hosted run: open the dialog once, wait for its mocked comment fetch to settle, then resize the open modal; wait for the latest fetch before clicking a like.

### Verification

- `yarn test` passed 29/29; `yarn check`, JavaScript syntax checks, and `git diff --check` passed. Astro reports the existing 20 dependency-resolution warnings and Node.js `url.parse()` deprecation warning.
- GitHub Actions run `40834818253` for commit `c8a7ee75d715d400ad5d553c426ca66559e37aee` passed type-check, tests, and the 51-page production build; homepage/article checks passed at all 11 widths. Its isolated dialog interaction then failed because the test read an active-like style from a comment node being replaced by the still-loading mock GET. The follow-up test correction is pending hosted verification.
- Cloudflare Preview deployment `b0763df7-ac55-470d-b1b0-42f2f35f120d` completed successfully for that exact commit at https://b0763df7.wala-katha.pages.dev. All 176 deployment log records were checked with no warning/error/failure/fatal/exception markers. Read-only smoke checks returned HTTP 200 for homepage, article, sitemap, and rating API; Preview `noindex` was present, 3 public comments and 0 review comments were rendered, and the age gate was left untouched.
- The follow-up local checks passed; the local full build timed out after 300 seconds in this 1.6 GiB sandbox. No live vote or comment POST was sent. Production data/configuration, merge state, and Production deployment were not changed.
