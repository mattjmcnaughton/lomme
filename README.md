# loome

A programmable practice band for improvising and comping

This repository currently contains the deployment-ready frontend scaffold, not
the migrated practice-band prototype. It is frontend-only: no API, database,
authentication service, or application secrets are required.

Generated with Copier from `mattjmcnaughton/templates/templates/frontend-react`
at revision `72a28b9be899c6ccd39f06f8482d55e460556acd`, with optional libraries off.
The GitHub repository remains named `lomme`; the app and domain use **Loome**.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 22 (`.nvmrc`)
- [pnpm](https://pnpm.io/) 10.33.0 (`packageManager`)
- [just](https://just.systems/)

### Installation

```sh
pnpm install --frozen-lockfile
cp .env.example .env
```

### Running

```sh
just dev
```

The app will be available at `http://localhost:5173`.

## Development

```sh
# Check formatting and linting
just fmt
just lint

# Fix formatting and linting
just fmt-fix
just lint-fix

# Run type checker
just typecheck
```

## Testing

```sh
# Run unit tests
just test-unit

# Run all tests
just test-all

# Full pre-push check
just gate
```

## Deployment

Target: **https://loome.mattjmcnaughton.com**, served by non-root Caddy on Fly.io
in `ewr`, with HTTPS and scale-to-zero. See [the launch runbook](docs/deploy.md)
for app creation, DNS/TLS, GitHub credentials, verification, and rollback.
No Fly resources or DNS records have been provisioned by this scaffold.

Like Aleph, successful main CI triggers semantic-release; qualifying conventional
commits create a tag and GitHub release, then Fly remotely builds that tag.
Use `feat`, `fix`, or `perf` for changes that must deploy; `chore` and `docs` do
not cut releases. Manual Release workflow runs are dry-run only.
Unlike Aleph, there is no redundant GHCR image mirror or backend release command.

```sh
# Build Docker image
docker build -t loome .

# Run container
docker run -p 8080:8080 loome

# Verify the actual production image over HTTP
just compose-smoke
```

The browser smoke runs against a production Vite build. Unit/integration suites
are intentionally empty until application behavior is migrated; their commands
report that explicitly instead of requiring placeholder tests.

## Architecture

See [docs/architecture.md](docs/architecture.md) for project structure and design decisions.

## License

[MIT](LICENSE)
