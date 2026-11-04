#!/usr/bin/env bash
# Creates the Pulp objects of the npm tutorial through the REST API (the same objects the
# tutorial creates in Pulp UI). Safe to re-run: existing objects are kept.
set -euo pipefail

cd "$(dirname "$0")"
source ../_lib/pulp.sh

NPM_REGISTRY_URL="${NPM_REGISTRY_URL:-https://registry.npmjs.org/}"

# 1. Proxy registry.npmjs.org: remote + repository + distribution that pulls through.
remote="$(ensure remotes/npm/npm npm-proxy \
  "{\"name\":\"npm-proxy\",\"url\":\"${NPM_REGISTRY_URL}\",\"policy\":\"on_demand\"}")"
proxy="$(ensure repositories/npm/npm npm-proxy '{"name":"npm-proxy"}')"
ensure distributions/npm/npm npm-proxy \
  "{\"name\":\"npm-proxy\",\"base_path\":\"npm-proxy\",\"repository\":\"${proxy}\",\"remote\":\"${remote}\"}" >/dev/null

# 2. Hosted repository for your own packages.
hosted="$(ensure repositories/npm/npm npm-hosted '{"name":"npm-hosted"}')"
ensure distributions/npm/npm npm-hosted \
  "{\"name\":\"npm-hosted\",\"base_path\":\"npm-hosted\",\"repository\":\"${hosted}\"}" >/dev/null

show_distributions distributions/npm/npm npm-
