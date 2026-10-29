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

- archive/AI_CHANGELOG-2026-Q4.md — 69 earlier dated entries from 2026-10-14 through 2026-10-28; dated sections are retained verbatim.

## Recent entries

## 2026-10-29 — Fix story-rating blur and audit search eligibility

### Changes

- Preserve the unprefixed backdrop-filter: blur(6px) in minified CSS by placing the WebKit fallback first. Keep the Chromium assertion strict; remove --disable-gpu from the headless harness and read the first non-none computed filter value.
- Validate the existing server-rendered comment paths: article comments and rating-review comments are included in initial HTML (escaped and bounded), while the separate modal continues to provide paginated interaction. The current bounds are 100 public comments and 20 top-level review comments per story; content beyond those bounds is not guaranteed in the first response.
- Audit the star-snippet request against Google's current review-snippet rules. Keep the story schema as BlogPosting; do not add misleading AggregateRating markup or relabel a story as another content type. Search engines decide whether to index content or display rich results.

### Verification

- GitHub Actions run 40827541807 passed for code commit c77b766bfd95a8a9bbf669d82f4cd39297725153: type-check, test suites, the 51-page build and SEO checks, and responsive Chromium/UI checks at all 11 configured widths. The toast test read backdropFilter: blur(6px), confirmed a transparent backdrop, paired dismissal, and comments modal/like/reply/scroll-lock interactions.
- Cloudflare Preview deployment 27d2adde-71d6-4215-9443-d925fb28ccf4 completed successfully for that commit: https://27d2adde.wala-katha.pages.dev. The home and article routes returned HTTP 200 with Preview noindex (expected); the built CSS included standard backdrop-filter. The article's initial HTML contained all 3 public comments currently returned by the post-comment API; the Preview review-comment API currently reports 0 records. No live vote or comment POST was sent.
- Production remains on deployment 6e110384-5552-454c-bc87-8970f98a2305, main commit 05d5ded3cce4a1084c6cba334cac19b7e696c31b. PR #105 remains an open draft; no merge, Production configuration/data change, or Production deployment occurred.


## 2026-10-28 — Make rating interaction fixture deterministic

### Changes

- Load the API mock in the isolated fixture before the rating module, and wait for the radio input to become enabled rather than treating an idle `aria-busy` flag as successful initialization. Record mock calls and widget state in failure diagnostics.
- Archive the oldest complete dated entry to maintain the five-section active-log limit.

### Verification

- GitHub Actions run `40686963030` passed Astro type-check, all 25 tests, the 51-page static build, and homepage/article layout checks at all 11 viewport widths. Its isolated interaction failed with the rating radio still disabled (`checked=false`), so the click never reached the selection assertion. The deterministic fixture update is pending verification.
- Preview deployment `105f8104-125e-4d23-a89b-c221ab3fa2df` succeeded for commit `300a06a624d4a060fdaa3ab4c13895e96bd7f25a`. Production remains on deployment `6e110384-5552-454c-bc87-8970f98a2305`, commit `05d5ded3cce4a1084c6cba334cac19b7e696c31b`; no live POST or Production deployment occurred.

## 2026-10-28 — Correct responsive rating selection test timing

### Changes

- Snapshot the selected tile class and radio checked/disabled state immediately after the rating click in `scripts/verify-responsive-layout.mjs`, before subsequent vote, toast, and comments interactions. Include radio state in failure diagnostics.
- Archive the oldest complete dated changelog section to keep the five-entry active history and update its coverage/count.

### Verification

- GitHub Actions run `40681777229` attempt 1 failed before responsive assertions because Chrome DevTools did not become reachable. Attempt 2 passed Astro type-check, all 25 unit tests, the 51-page static build, and homepage/article layout checks at 11 viewport widths, then failed the selected-tile assertion. The assertion previously read the class after the later interaction sequence; this branch update is pending CI verification.
- Interactive checks use isolated API stubs; no live rating/comment POST was made. No Production code, data, or deployment was changed.

## 2026-10-28 — Complete story comments and colorless toast

### Request and changes

- Complete draft PR #105 with a rating-gated optional Sinhala comment, a separate accessible comments dialog, paginated top-level comments, one-level replies, and idempotent likes. The dialog uses the browser's modal layer and restores page scrolling/focus when closed.
- Add same-origin validation, strict request parsing, a 500-character limit, hashed anonymous voter/IP identities, the existing write rate limit, safe text rendering, and atomic D1 insertion for a rating with its optional review.
- Add the additive comments/likes migration matching the already-present Preview schema. Do not apply a migration, alter Production data/configuration, merge the PR, or deploy Production.
- Supersede “Correct story-rating success backdrop”: use a colorless transparent backdrop with blur, paired with the existing green thank-you toast.
- Add API/UI regression tests, including the comments dialog, likes/replies, scroll lock, toast appearance, and paired dismissal.

### Verification

- Focused Node tests passed 17/17; JavaScript syntax checks and SQLite migration/query smoke tests passed. CI run `40681302698` caught strict-null errors in the new comments widget, which were corrected in the follow-up commit. Cloudflare Preview deployment `2e1c3d65-dd5b-42d7-beca-d7e62d0977aa` deployed initial commit `bd18b2ddaaa12e5a70734d0edded8587768eb1c0`, but is not accepted as verification because CI failed. CI and a corrected Preview are pending. Local build dependencies and generated `dist/` assets are not present in this workspace.
- PR #105 remains an open draft. No merge, `main` update, or Production deployment was performed.

## 2026-10-28 — Correct story-rating success backdrop

### Correction and changes

- Correction to “Center and restyle story-rating feedback”: the user asked for a full-screen blue backdrop behind the original thank-you notice, not a blue notice.
- Restore the original dark-green toast appearance and keep it centered. Add a fixed blue-tinted, blurred viewport backdrop that appears and auto-dismisses together with the toast after 3.5 seconds.
- Update the isolated responsive Chromium test to verify full-viewport backdrop coverage, its blue color, the unchanged green toast, and the paired automatic dismissal.

### Verification

- `yarn test` passed 17/17; `yarn check`, `node --check scripts/verify-responsive-layout.mjs`, and `git diff --check` passed. `yarn check` reports the existing 20 dependency-resolution warnings and Node.js `url.parse()` deprecation warning.
- PR #105 branch update, GitHub CI, and Cloudflare Preview checks are pending. No Production branch update or deployment was performed.

