# Architecture

## Overview

loome is a React frontend application using Vite.

This scaffold comes from `mattjmcnaughton/templates`' `frontend-react` template.
The practice-band proof of concept has not been migrated. Keep the application
frontend-only initially: browser audio, local state, and file import/export do
not require a server API. The template's Query provider and fetch utility are
available for future use, not dependencies on a currently deployed backend.

Production is a multi-stage Node build followed by a non-root Caddy static
server, deployed to Fly.io. Only `dist/` enters the runtime image. Fly handles
TLS; Caddy serves health checks, immutable hashed assets, and SPA fallback.
See [deploy.md](deploy.md) for the CI-gated semantic-release deployment flow.

## Project Structure

```
src/
  main.tsx               # App entry point
  index.css              # Tailwind base styles
  routes/                # Tanstack Router file-based routes
    __root.tsx           # Root layout
    index.tsx            # Home page
  components/            # React components
  hooks/                 # Custom React hooks
  lib/                   # Utilities and configuration
    api.ts               # API client utilities
tests/
  setup.ts               # Vitest setup (jest-dom matchers)
  integration/           # Vitest integration tests
  e2e/                   # Playwright e2e tests
```

## Toolchain

| Tool | Purpose |
| ---- | ------- |
| Node.js | Runtime |
| pnpm | Package manager |
| Vite | Build tool and dev server |
| TypeScript | Type system |
| Biome | Formatting and linting |
| Tailwind CSS | Styling |
| Tanstack Router | Client-side routing |
| Tanstack Query | Server state management |
| Vitest | Unit and integration testing |
| Playwright | E2e testing |
| MSW | API mocking in tests |

## Conventions

- Unit tests are co-located next to source files (`*.test.tsx`).
- Strict TypeScript mode is enabled.
