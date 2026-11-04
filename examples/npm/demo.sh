#!/usr/bin/env bash
# Runs the client side of the npm tutorial against Pulp: install through the cache, publish
# @example/hello-lib, then install it in hello-app. Run ./setup.sh first.
set -euo pipefail

cd "$(dirname "$0")"
source ../_lib/pulp.sh

VERSION="${VERSION:-1.0.0}"
export NPM_PROXY_URL="${CONTENT_URL}/npm-proxy/"
export NPM_HOSTED_URL="${CONTENT_URL}/npm-hosted/"
NPM_PUBLISH_URL="${PULP_URL}/npm/${PULP_DOMAIN:+${PULP_DOMAIN}/}npm-hosted/"
export NPM_PUBLISH_HOST_PATH="${NPM_PUBLISH_URL#*://}"
NPM_AUTH="$(printf '%s:%s' "$PULP_USER" "$PULP_PASSWORD" | base64)"
export NPM_AUTH

# A throwaway copy and npm cache, so every package really comes from Pulp.
WORK="$PWD/.npm-demo"
rm -rf "$WORK" && mkdir -p "$WORK" && cp -r hello-lib hello-app "$WORK/"
NPMRC="$PWD/.npmrc"
npm() { command npm --userconfig "$NPMRC" --cache "$WORK/cache" --no-audit --no-fund "$@"; }

step "Publish @example/hello-lib ${VERSION} to ${NPM_PUBLISH_URL}"
npm --prefix "$WORK/hello-lib" pkg set version="${VERSION}"
(cd "$WORK/hello-lib" && npm publish --@example:registry="${NPM_PUBLISH_URL}")

step "Install hello-app: @example/* from ${NPM_HOSTED_URL}, the rest through ${NPM_PROXY_URL}"
(cd "$WORK/hello-app" && npm install && node index.js)

step "Done. Open Pulp UI: Content Management > Repositories > npm-hosted"
