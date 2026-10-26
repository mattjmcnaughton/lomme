# Plan: migrate Loome into a domain-led application

**Gate command:** `CI=true just gate-expensive`
**Optimization target:** preserve a usable musical instrument while making its
rules, saved data, and audio lifecycle understandable and independently testable.
Not optimizing for a hypothetical backend, a redesign, or framework completeness.

## Goal

Migrate the complete prototype from thread T-01a173d7-fa2b-7509-a32d-cb442312427c
into the React/TypeScript scaffold. Preserve the navy/gold UI, all 100 presets,
musical controls, local library, portable files, and external-AI workflow.
Apply CONSTITUTION.md and the agreed stable-identity Save/Save a copy semantics.

## Acceptance criteria

1. Musical rules and portable v1/v2 validation run without UI/audio/storage;
   all presets validate and existing characterization scenarios pass in Vitest.
2. Presets remain immutable; session edits do not save implicitly; rename/Save
   retain personal identity and Save a copy creates an independent identity.
   Failed persistence cannot report success. Verify with behavioral fake-store
   tests and real browser storage tests, including legacy data.
3. The complete practice instrument works: editable/split/long charts,
   transposition, tempo/tap, grooves, bass/keys, mixer, modes, fretboard,
   import/export, metadata/search/filter/lucky, and session recovery.
   Verify in Chromium against the production build.
4. Pending audio starts cannot restart sound after Stop/switch/unmount. Verify
   application lifecycle with a controllable fake and actual Tone.js in browser.
5. Strict TypeScript, formatting/lint, browser checks and production-image smoke
   pass; inspect desktop/narrow/modal states and deliver an inspected demo film.

## Coding practices

- Red-green TDD for new identity, persistence, and playback lifecycle contracts:
  run a failing behavioral test, implement the smallest solution, rerun.
- Preserve existing musical tests before refactoring; derive expected results
  independently. Prefer asymmetric cases and failure/cancellation boundaries.
- Fakes implement behavior (state, failure, delayed completion), not call counts.
  Real adapters retain integration/browser checks for guarantees fakes cannot prove.
- Use explicit domain types; no blanket any, disabled typechecking, generic
  repository framework, event bus, backend, or unrelated UI redesign.
- Separate source-preserving migration from intentional stable-identity behavior.
- Keep audio scheduling out of React; keep browser persistence out of pure rules.
- Commit verified logical chunks using Conventional Commits. Local commits are
  authorized; pushing, deployment, DNS, and shared infrastructure are not.

## Domain and product defaults

Arrangement content is a complete practice setup. A session is the editable
working copy, while playback state and UI filters/dialogs are transient.
Personal identity is stable and not encoded in strict portable v2 files.
Preserve fast switching (no new unsaved-change prompts) and import-to-library;
imports receive a new personal identity, not same-name overwrite. Preserve
`pocket-session`, legacy `lomme-library` reads, and `.pocket.json` compatibility.
Restored sessions remain stopped. No recorder or internal AI/backend is added.

## Environment readiness and research

- Node 22 and pnpm 10.33.0 installed in `/tmp/loome-tools/node_modules/.bin`;
  prepend this path for checks. `just --list` passes.
- Supervised Vite service boots and responds HTTP 200 via `amp orb services ensure`.
- Chromium/Playwright and Docker daemon are installed; prior scaffold gates and
  actual production-image smoke passed. Docker commands require sudo in this orb.
- Source snapshot is `/tmp/loome-migration-source`; its main.jsx owns too many
  responsibilities. music.js, tracks.js, presets.js, band.js are useful existing
  boundaries. Preserve original styles rather than restyling.
- Blockers: none. Constitution adopted; local checkpoint commits and TDD authorized.

## Implementation approach and commit chunks

1. Commit scaffold/constitution baseline (completed before app migration).
2. Record this plan. In parallel, migrate pure musical/portable modules and
   characterize them; migrate audio behind a small playback interface with
   cancellation tests. Integrate and commit verified domain/audio foundations.
3. Write failing identity/save/storage tests; implement a small arrangement store,
   session application behavior, local adapter, and legacy recovery. Commit.
4. Move UI to the routed practice screen, extracting coherent library/chart/
   accompaniment/fretboard/transport/dialog responsibilities. Connect typed domain,
   storage, and playback. Retain visual identity. Commit after browser checks.
5. Strengthen end-to-end coverage for agreed behavioral changes; update architecture,
   vocabulary and development docs. Run gates and production image smoke, inspect
   representative UI states, record and inspect a real-pointer demo. Commit final
   verified integration and report exact delivery state.

## Verification

Run targeted Vitest files during TDD, then `CI=true just gate-expensive`,
`sudo bash scripts/compose-smoke.sh`, and workflow lint if workflows change.
Exercise actual playback and stop, split chords, chart edits, metadata Save/copy,
same-name imports, library persistence, malformed imports, and session reload.
Capture default, narrow, and editing states under `.amp/in/artifacts/` and inspect
with view_media. Film a short tour with agent-browser's real-pointer recorder;
inspect frames and disclose if the recording has no audio track.
