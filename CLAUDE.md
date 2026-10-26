# CLAUDE.md

A programmable practice band for improvising and comping

React frontend application using Vite, TypeScript, Tanstack Router, Tanstack Query, Tailwind CSS, pnpm, Biome, tsc, Vitest, and Playwright.

Read [`CONSTITUTION.md`](CONSTITUTION.md) before planning, implementation, or
review. It owns enduring project commitments; report conflicts rather than
silently weakening them to match existing code.

## Quick Reference

| Command | Purpose |
| ------- | ------- |
| `just fmt` | Check formatting |
| `just fmt-fix` | Fix formatting |
| `just lint` | Check linting |
| `just lint-fix` | Fix linting |
| `just typecheck` | Run type checker |
| `just test-unit` | Run unit tests (co-located in src/) |
| `just test-integration` | Run integration tests |
| `just test-e2e` | Run e2e tests (Playwright) |
| `just test-all` | Run all tests |
| `just test-external` | Run tests hitting external services |
| `just gate` | Fast pre-push check (fmt + lint + typecheck + test-unit) |
| `just gate-expensive` | Full check (gate + integration + e2e) |
| `just gate-external` | Everything (gate-expensive + external) |
| `just dev` | Start Vite dev server |

## Project Structure

```
src/
  main.tsx                    # App entry point
  index.css                   # Tailwind base styles
  routes/                     # Tanstack Router file-based routes
    __root.tsx                # Root layout
    index.tsx                 # Home page
  domain/                     # Pure music, presets, portable validation and types
  practice/                   # Session/save behavior, playback hook and UI
    components/               # Library/chart/band/fretboard/transport
  audio/                      # Playback interface and Tone.js adapter
  storage/                    # Local library and session recovery
  lib/                        # Utilities and configuration
    api.ts                    # API client utilities
tests/
  setup.ts                    # Vitest setup (jest-dom matchers)
  integration/                # Vitest integration tests
  e2e/                        # Playwright e2e tests
```

## Key Conventions

- Source code lives in `src/`.
- Uses Tanstack Router for routing (file-based route generation).
- Tanstack Query is available from the template; practice has no server state.
- Unit tests are co-located next to source files (`*.test.tsx`).
- Integration tests go in `tests/integration/`, e2e tests in `tests/e2e/`.
- Use `external` in test names for tests that hit external services.
- Run locally with `pnpm vite` or `just dev`.
- Node 22 and pnpm 10.33.0 are pinned; commit `pnpm-lock.yaml` changes.
- Practice is frontend-only; see CONTEXT.md for vocabulary and architecture docs
  for session/library identity and portable compatibility contracts.
- `pnpm track:assets` generates public schema/prompt/example from the domain;
  `pnpm track:check <file>` validates portable content.
- Use Conventional Commits: `feat`/`fix`/`perf` publish releases and deploy after
  successful main CI. Other types do not release. See `docs/deploy.md`.
- `just compose-smoke` verifies the production Caddy image with Docker.

## More Information

- `docs/architecture.md` -- read before adding new modules or changing project structure
- `docs/development.md` -- read for environment setup, debugging, or common tasks
