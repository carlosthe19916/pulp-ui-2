#!/usr/bin/env bash
# Creates the Pulp objects of the RubyGems tutorial through the REST API (the same objects the
# tutorial creates in Pulp UI). Safe to re-run: existing objects are kept.
set -euo pipefail

cd "$(dirname "$0")"
source ../_lib/pulp.sh

RUBYGEMS_URL="${RUBYGEMS_URL:-https://index.rubygems.org/}"

# 1. Proxy rubygems.org: remote + distribution that pulls through. pulp_gem keeps cached gems
#    as content but doesn't add them to a repository, so the distribution needs none.
remote="$(ensure remotes/gem/gem rubygems-proxy \
  "{\"name\":\"rubygems-proxy\",\"url\":\"${RUBYGEMS_URL}\",\"policy\":\"on_demand\"}")"
ensure distributions/gem/gem rubygems-proxy \
  "{\"name\":\"rubygems-proxy\",\"base_path\":\"rubygems-proxy\",\"remote\":\"${remote}\"}" >/dev/null

# 2. Hosted repository for your own gems; it serves its latest publication.
hosted="$(ensure repositories/gem/gem gems-hosted '{"name":"gems-hosted"}')"
ensure distributions/gem/gem gems-hosted \
  "{\"name\":\"gems-hosted\",\"base_path\":\"gems-hosted\",\"repository\":\"${hosted}\"}" >/dev/null

show_distributions distributions/gem/gem
