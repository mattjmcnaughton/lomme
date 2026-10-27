# lomme

A programmable practice band for improvising and comping

Lomme is a frontend-only practice instrument: 100 presets, editable and split-chord
charts, synthesized drums/bass/keys, transposition, mix and practice modes, a
fretboard, and a personal library. No API, database, authentication service, or
application secrets are required.

Practice edits stay in the session until **Save to library**. Save updates a
personal arrangement; **Save a copy** creates another. **Export track** downloads
a complete `.pocket.json` file; **Load track** validates and adds an independent
personal arrangement. Browser recovery is not a backup—export work you want to
keep. Bring your own AI uses a downloadable prompt, not an internal AI service.

Generated with Copier from `mattjmcnaughton/templates/templates/frontend-react`
at revision `72a28b9be899c6ccd39f06f8482d55e460556acd`, with optional libraries off.
The application and GitHub repository are named **Lomme** (`lomme`).

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

Target: **https://lomme.mattjmcnaughton.com**, served by non-root Caddy on Fly.io
in `ewr`, with HTTPS and scale-to-zero. See [the launch runbook](docs/deploy.md)
for app creation, DNS/TLS, GitHub credentials, verification, and rollback.
Automatic Fly deployment is paused until the GitHub credential is configured
and the deployment job is explicitly enabled.

Like Aleph, successful main CI triggers semantic-release; qualifying conventional
commits create a tag and GitHub release, then Fly remotely builds that tag.
Use `feat`, `fix`, or `perf` for changes that must deploy; `chore` and `docs` do
not cut releases. Manual Release workflow runs are dry-run only.
Unlike Aleph, there is no redundant GHCR image mirror or backend release command.

```sh
# Build Docker image
docker build -t lomme .

# Run container
docker run -p 8080:8080 lomme

# Verify the actual production image over HTTP
just compose-smoke
```

Chromium workflows run against a production Vite build. Co-located tests cover
musical rules, portable compatibility, stable saved identity, real local storage,
and playback lifecycle using behavioral fakes. `pnpm track:check <file>` validates
a track independently of the UI; `pnpm track:assets` regenerates public assets.

## Architecture

See [docs/architecture.md](docs/architecture.md) for project structure and design decisions.

## License

[MIT](LICENSE)
