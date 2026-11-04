#!/usr/bin/env bash
# Creates the Pulp objects of the Python tutorial through the REST API (the same objects the
# tutorial creates in Pulp UI). Safe to re-run: existing objects are kept.
set -euo pipefail

cd "$(dirname "$0")"
source ../_lib/pulp.sh

PYPI_URL="${PYPI_URL:-https://pypi.org/}"

# 1. Proxy pypi.org: remote + repository + distribution that pulls through.
remote="$(ensure remotes/python/python pypi-proxy \
  "{\"name\":\"pypi-proxy\",\"url\":\"${PYPI_URL}\",\"policy\":\"on_demand\"}")"
proxy="$(ensure repositories/python/python pypi-proxy '{"name":"pypi-proxy"}')"
ensure distributions/python/pypi pypi-proxy \
  "{\"name\":\"pypi-proxy\",\"base_path\":\"pypi-proxy\",\"repository\":\"${proxy}\",\"remote\":\"${remote}\"}" >/dev/null

# 2. Hosted index for your own packages; twine uploads to it.
hosted="$(ensure repositories/python/python pypi-hosted '{"name":"pypi-hosted"}')"
ensure distributions/python/pypi pypi-hosted \
  "{\"name\":\"pypi-hosted\",\"base_path\":\"pypi-hosted\",\"repository\":\"${hosted}\"}" >/dev/null

show_distributions distributions/python/pypi pypi-
