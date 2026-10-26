# Development

## Prerequisites

- [Node.js](https://nodejs.org/) 22 (`.nvmrc`)
- [pnpm](https://pnpm.io/) 10.33.0
- [just](https://just.systems/)

## Setup

```sh
# Install dependencies
pnpm install --frozen-lockfile

# Copy environment file
cp .env.example .env
```

## Running Locally

```sh
just dev
```

The app will be available at `http://localhost:5173`.

## Common Tasks

```sh
# Format and lint
just fmt-fix
just lint-fix

# Type check
just typecheck

# Run tests
just test-unit
just test-all

# Full pre-push check
just gate

# Full check including integration and e2e
just gate-expensive
```

## Testing

Tests are organized by type:

- `src/**/*.test.tsx` -- Vitest, co-located unit tests
- `tests/integration/` -- Vitest, tests with real dependencies
- `tests/e2e/` -- Playwright, end-to-end browser tests

Install Chromium once with `pnpm exec playwright install --with-deps chromium`.
The browser smoke uses the production build. Unit and integration suites are
empty until the prototype is migrated; commands explicitly allow empty suites.
`just compose-smoke` requires a running Docker daemon and verifies Caddy's
health route, static assets, SPA fallback, and missing-asset 404 behavior.

In Amp orbs, `amp orb services ensure` starts the supervised Vite preview and
prints its portal URL. The preview is not a production deployment.

Use `external` in test names for tests that hit external services. These run via `just test-external`.

## Docker

```sh
# Build image
docker build -t loome .

# Run container
docker run -p 8080:8080 loome
```
