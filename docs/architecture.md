# Architecture

Lomme is a frontend-only practice instrument, migrated from the prototype into
the React/TypeScript template. Read [the constitution](../CONSTITUTION.md) for
invariants and [the glossary](../CONTEXT.md) for musical/product language.

## Boundaries

```text
routes/index.tsx → practice/PracticeScreen.tsx
                       ├─ components + dialogs (presentation)
                       ├─ usePracticeSession → library → ArrangementStore
                       │                                  ↑
                       │                    storage/LocalArrangementStore
                       └─ usePlayback → PlaybackEngine ← audio/Band (Tone.js)

domain/{music,presets,tracks,types} ← shared pure musical rules/content
```

- `domain/`: chord parsing/transposition/voicing, bar timing, filtering, tap tempo,
  100 complete presets, and strict portable validation. No React, audio, storage,
  or network. `tracks.ts` owns v1 migration, v2 schema, exports and AI prompt.
- `practice/`: the editable session and Save/copy use case; typed presentation
  components receive settings and callbacks. Chart/key/arrangement switches stop
  playback; tempo, groove and mix change live. Filters/dialogs are transient.
- `storage/localLibrary.ts`: browser adapter for complete personal arrangements
  and session recovery. Unreadable libraries are not silently replaced.
- `audio/`: Tone synthesis and scheduling behind a narrow engine interface.
  Engines are created on Play, not render. Intent/generation guards prevent late
  starts or queued drawing callbacks from reviving stopped playback. Stop and
  unmount dispose all owned audio resources; one band owns the shared transport.

These are responsibility boundaries, not a generic repository/service framework.
No backend, internal AI, event bus or recorder is present. Template Query/fetch
utilities are unused by practice. A future backend could implement the store
boundary; server authorization, conflicts and authoritative validation would
still require explicit design. Audio scheduling remains local.

## Session and saved data

- Editing never mutates a preset or saved arrangement. Save captures the complete
  setup. Saving a preset creates a personal identity; saving personal work updates
  that identity. Rename preserves it; Save a copy creates another.
- Switching arrangements is immediate, without a dirty-session prompt. Recovery
  remembers the current working setup in `pocket-session`, but always restores
  stopped. It is not a library save.
- `lomme-library` accepts legacy arrays of portable tracks. Legacy entries receive
  stable index-based identities until written into the new versioned envelope:
  `{version: 1, arrangements: [{id, track}]}`. Names never select replacement targets.
- Imports validate before joining the library with a new identity, including
  same-name imports. Failed writes are not acknowledged as saved. Browser storage
  is site/browser-specific, not multi-device synchronization or a backup; export
  files for durable portability. Concurrent multi-tab writes are not coordinated.
- `.pocket.json` remains the portable extension. Read supported v1 files with
  explicit migration defaults; write complete v2 content without id, category,
  playback position or transient UI state. Generated public schema/example/prompt
  use the same source of truth (`pnpm track:assets`, also run by build/dev).

## Tests and delivery

Pure domain tests preserve musical/format behavior. Stateful store and controllable
playback fakes exercise identity, failures and cancellation, not call choreography.
Real storage tests and production-build Chromium workflows cover adapter behavior,
imports/exports, recovery, chart editing and actual Tone scheduling with delayed
visual frames. Browser scheduling is not proof of audible fidelity on every device.

Production is a multi-stage Node build followed by non-root Caddy on Fly.io. Only
`dist/` enters the runtime image. Fly handles TLS; Caddy serves health checks,
immutable hashed assets and SPA fallback. See [deploy.md](deploy.md) for the
CI-gated semantic-release flow and provisioning/rollback instructions.
