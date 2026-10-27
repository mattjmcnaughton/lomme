#!/usr/bin/env bash
set -euo pipefail
image="lomme-smoke:${GITHUB_SHA:-local}"
container=""
cleanup() {
  if [ -n "$container" ]; then
    docker logs "$container"
    docker rm -f "$container" >/dev/null
  fi
}
trap cleanup EXIT
docker build --target production -t "$image" .
container=$(docker run -d -p 127.0.0.1::8080 "$image")
port=$(docker port "$container" 8080/tcp | head -1 | cut -d: -f2)
base="http://127.0.0.1:$port"
curl --retry 20 --retry-all-errors --retry-delay 1 --max-time 2 -fsS "$base/healthz" | grep -qx ok
html=$(curl -fsS "$base/")
grep -q '<div id="root">' <<< "$html"
asset=$(grep -oE '/assets/[^" ]+\.js' <<< "$html" | head -1)
test -n "$asset"
curl -fsS "$base$asset" >/dev/null
curl -fsS "$base/practice/session" | grep -q '<div id="root">'
test "$(curl -s -o /dev/null -w '%{http_code}' "$base/assets/missing.js")" = 404
echo 'Production smoke passed: health, SPA, JavaScript, deep link, missing asset.'
