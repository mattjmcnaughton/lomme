# Migration diary

- Scaffold and adopted constitution committed locally. No push or deploy.
- Source snapshot retrieved through Amp file transfer; no reconstruction needed.
- Plan recorded before implementation. User authorized TDD and sensible local
  Conventional Commit checkpoints; no further interview needed for reversible
  decisions within the agreed migration.
- Pure TypeScript domain preserves all 100 original charts and v1/v2 portable
  compatibility. Twelve domain characterization tests pass; schema/example/prompt
  generation and the CLI validator pass.
- Audio extracted behind PlaybackEngine; five stateful-fake lifecycle tests pass,
  including pending-start cancellation, stale completions/ticks and disposal.
- Session/library work used red-green tests (five failures before implementation,
  five passing afterward). Stable identity, copy, failed save, legacy storage and
  session recovery are covered without interaction mocks.
- Presentation extracted into typed library/chart/band/fretboard/transport
  components. Five behavioral presentation tests pass. Integrated build and all
  27 Vitest checks pass.
- `CI=true just gate-expensive` passes formatting, lint, production build,
  TypeScript, 27 co-located tests and four production-build Chromium workflows.
  The separate integration directory has no additional tests. Workflows cover
  session-only edits, stable rename/copy, legacy upgrades, corrupt-library write
  refusal, complete export/reload/import, invalid files, split/long charts and
  repeated real Tone playback with delayed visual frames.
- Production-image verification: `sudo bash scripts/compose-smoke.sh` passes
  health, SPA HTML, JavaScript, deep-link fallback and missing-asset 404 checks.
- A temporary browser probe tapped the real Web Audio destination with a native
  analyser: RMS 0.0031667400465426217 during playback, 0 after Stop. This validates
  signal generation/cancellation, not subjective fidelity on every device.
- Render inspection caught Tailwind preflight overriding prototype typography;
  stylesheet load order corrected. Desktop, narrow, editor and validation-error
  captures inspected. At 390px, document width is exactly 390px; fretboard scroll
  succeeds (371px viewport, 669px content, scrollLeft=200), and all three practice
  mode centers remain uncovered after scrolling past the fixed transport.
- Inspected a 28.9-second real-pointer demo at 5fps and as video: play/stop,
  paired-chord edit, transpose, rename/save, personal search, play/stop. MP4 and
  looping WebP are under `.amp/in/artifacts/`; the film is silent. Recording was
  reduced to 10fps after the 30fps encoder fell behind at 2x resolution.
- Generated public JSON now uses the existing formatter so regeneration and
  gate formatting agree. Vite reports an 818KB uncompressed JS bundle (Tone.js
  included); no unrelated bundling redesign added.
- Delivery is local Conventional Commit checkpoints only. No push, deployment,
  Fly provisioning or DNS changes were authorized or performed.
