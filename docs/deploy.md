# Deploying Loome

This is a static React SPA, built with Node 22 and pnpm 10.33.0 and served by
non-root Caddy on port 8080. Fly terminates HTTPS. No application secrets, API,
database, migrations, volumes, or scheduled Machines are needed. `VITE_*` values
are public build-time values: never put credentials in them.

The app name follows Aleph's convention: `loome-prod-mattjmcnaughton` in `ewr`.
The custom domain is `loome.mattjmcnaughton.com`; GitHub is still
`mattjmcnaughton/lomme`. Availability of the Fly name is not yet verified.
The complete practice application is migrated. The Fly deployment job is
explicitly paused (`false && ...` in `release.yml`) until credentials and launch
authorization are supplied. CI and GitHub releases may still run on main.

## One-time launch (operator approval required)

These commands change shared infrastructure; they are a runbook, not operations
already performed. Authenticate Fly locally before starting.

1. Create the app without regenerating the checked-in config:

   ```sh
   flyctl apps create loome-prod-mattjmcnaughton
   ```

2. Deploy and verify the Fly origin. `--ha=false` prevents Fly's default redundant
   second Machine; `fly.toml` permits scale-to-zero and a single 256 MB Machine.

   ```sh
   flyctl deploy --app loome-prod-mattjmcnaughton --remote-only --ha=false
   curl -fsS https://loome-prod-mattjmcnaughton.fly.dev/healthz
   flyctl checks list -a loome-prod-mattjmcnaughton
   ```

3. Request the certificate and inspect Fly's exact DNS/validation instructions:

   ```sh
   flyctl certs add loome.mattjmcnaughton.com -a loome-prod-mattjmcnaughton
   flyctl certs setup loome.mattjmcnaughton.com -a loome-prod-mattjmcnaughton
   flyctl ips list -a loome-prod-mattjmcnaughton
   ```

   Allocate missing IPs as instructed by Fly. Manage DNS in
   `mattjmcnaughton/nuage`, as with Aleph. For this subdomain, use the CNAME target
   Fly reports (normally `loome-prod-mattjmcnaughton.fly.dev`), or its A/AAAA
   records, not conflicting records at the same hostname. Add the certificate
   validation records shown by `certs setup`. If Cloudflare proxying is enabled,
   use Full (strict), never Flexible, and follow Fly's ownership instructions.

4. Verify HTTPS and the SPA in a browser:

   ```sh
   flyctl certs check loome.mattjmcnaughton.com -a loome-prod-mattjmcnaughton
   curl -fsS https://loome.mattjmcnaughton.com/healthz
   curl -fsSI https://loome.mattjmcnaughton.com/
   ```

   Expect `ok`, an HTML page, loaded JS/CSS, and no console errors. Deep links
   must serve the SPA; missing `/assets/*` files must return 404. HTML is
   revalidated while hashed assets are immutable. The first idle request may
   cold-start the Machine. Future audio capture requires this HTTPS origin.

5. Enable CD only when ready to deploy qualifying merges. Generate an app-scoped
   deploy token with `flyctl tokens create deploy -a loome-prod-mattjmcnaughton`,
   then store it privately as GitHub Actions secret `FLY_API_TOKEN` in
   `mattjmcnaughton/lomme`. After launch authorization, remove the explicit
   `false &&` deployment pause from `release.yml` while keeping its existing
   release/event conditions. Do not paste tokens into chat or source files.

## Release flow

CI runs formatting, lint, project-reference typechecking, Vitest, the Chromium
production-build browser workflows, and a Docker production-image HTTP smoke.
Co-located tests cover domain, session, storage and playback behavior; the
separate integration directory currently has no additional tests.

Only a successful same-repository **push** CI run on **main** can publish.
The release workflow also checks that main still equals the tested SHA, avoiding
Aleph's untested-newer-tip race. Releases are serialized and never cancelled
mid-deployment. Semantic-release analyzes conventional commits: `feat` produces a
minor release; `fix`/`perf` a patch; a breaking change a major. Other types do not
release. The first qualifying commit produces the initial release.

The generated changelog is committed with `[skip ci]`, and the resulting version
tag is the source Fly builds with `--remote-only`. No npm package is published.
There is no GHCR mirror: Fly's registry holds deployed images. A manual Release
workflow dispatch is always a dry-run; it cannot tag, publish, or deploy.
Branch protection must permit the release bot's changelog commit, as in Aleph.

## Redeploy and rollback (operator approval required)

Inspect releases and logs first:

```sh
flyctl releases -a loome-prod-mattjmcnaughton --image
flyctl logs -a loome-prod-mattjmcnaughton
```

Redeploy a reviewed tag using the same deploy command, or choose a known-good
immutable image from the release list:

```sh
flyctl deploy --app loome-prod-mattjmcnaughton \
  --image registry.fly.io/loome-prod-mattjmcnaughton:<known-good-deployment-tag> \
  --remote-only --ha=false
```

Then repeat health, asset, and browser checks. There is no server data to migrate
or roll back; future browser-local storage formats may still need compatibility.
