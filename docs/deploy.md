# Deploying Lomme

This is a static React SPA, built with Node 22 and pnpm 10.33.0 and served by
non-root Caddy on port 8080. Fly terminates HTTPS. No application secrets, API,
database, migrations, volumes, or scheduled Machines are needed. `VITE_*` values
are public build-time values: never put credentials in them.

The app name follows Aleph's convention: `lomme-prod-mattjmcnaughton` in `ewr`,
in the `mattjmcnaughton` organization (Fly CLI slug `personal`). The custom
domain is `lomme.mattjmcnaughton.com`; GitHub is `mattjmcnaughton/lomme`.
Automatic Fly deployment is enabled for newly published releases after successful
main push CI. It uses the app-scoped GitHub Actions secret `FLY_API_TOKEN`;
manual Fly launches are separate.

The earlier misspelled Fly app is not automatically deleted or redirected.
Browser storage belongs to each origin: export personal work from an old origin
and import it at the new one. `lomme-library`, `pocket-session`, supported track
versions, and `.pocket.json` files retain their compatibility contracts.

## One-time launch (operator approval required)

These commands change shared infrastructure; they are a runbook, not operations
already performed. Authenticate Fly locally before starting.

1. Create the app without regenerating the checked-in config:

   ```sh
   flyctl apps create lomme-prod-mattjmcnaughton --org personal
   ```

2. Deploy and verify the Fly origin. `--ha=false` prevents Fly's default redundant
   second Machine; `fly.toml` permits scale-to-zero and a single 256 MB Machine.

   ```sh
   flyctl deploy --app lomme-prod-mattjmcnaughton --remote-only --ha=false
   curl -fsS https://lomme-prod-mattjmcnaughton.fly.dev/healthz
   flyctl checks list -a lomme-prod-mattjmcnaughton
   ```

3. Request the certificate and inspect Fly's exact DNS/validation instructions:

   ```sh
   flyctl certs add lomme.mattjmcnaughton.com -a lomme-prod-mattjmcnaughton
   flyctl certs setup lomme.mattjmcnaughton.com -a lomme-prod-mattjmcnaughton
   flyctl ips list -a lomme-prod-mattjmcnaughton
   ```

   Allocate missing IPs as instructed by Fly. Manage DNS in
   `mattjmcnaughton/nuage`, as with Aleph. For this subdomain, use the CNAME target
   Fly reports (normally `lomme-prod-mattjmcnaughton.fly.dev`), or its A/AAAA
   records, not conflicting records at the same hostname. Add the certificate
   validation records shown by `certs setup`. If Cloudflare proxying is enabled,
   use Full (strict), never Flexible, and follow Fly's ownership instructions.

4. Verify HTTPS and the SPA in a browser:

   ```sh
   flyctl certs check lomme.mattjmcnaughton.com -a lomme-prod-mattjmcnaughton
   curl -fsS https://lomme.mattjmcnaughton.com/healthz
   curl -fsSI https://lomme.mattjmcnaughton.com/
   ```

   Expect `ok`, an HTML page, loaded JS/CSS, and no console errors. Deep links
   must serve the SPA; missing `/assets/*` files must return 404. HTML is
   revalidated while hashed assets are immutable. The first idle request may
   cold-start the Machine. Future audio capture requires this HTTPS origin.

5. Configure the app-scoped credential for automatic deployment:

   ```sh
   flyctl tokens create deploy -a lomme-prod-mattjmcnaughton \
     --name lomme-github-actions --expiry 2160h
   ```

   Store the entire token privately as GitHub Actions secret `FLY_API_TOKEN` in
   `mattjmcnaughton/lomme`. This token expires after 90 days. Before expiry,
   create a replacement, update the secret, verify a deployment, then revoke the
   old token. Do not use an organization-wide token for CI or paste tokens into
   chat or source files.

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
flyctl releases -a lomme-prod-mattjmcnaughton --image
flyctl logs -a lomme-prod-mattjmcnaughton
```

Redeploy a reviewed tag using the same deploy command, or choose a known-good
immutable image from the release list:

```sh
flyctl deploy --app lomme-prod-mattjmcnaughton \
  --image registry.fly.io/lomme-prod-mattjmcnaughton:<known-good-deployment-tag> \
  --remote-only --ha=false
```

Then repeat health, asset, and browser checks. There is no server data to migrate
or roll back; future browser-local storage formats may still need compatibility.
