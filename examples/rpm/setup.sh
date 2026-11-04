#!/usr/bin/env bash
# Creates the Pulp objects of the RPM tutorial through the REST API (the same objects the
# tutorial creates in Pulp UI). Safe to re-run: existing objects are kept.
set -euo pipefail

cd "$(dirname "$0")"
source ../_lib/pulp.sh

# A small public repository; replace it with a distribution mirror such as
# https://dl.fedoraproject.org/pub/epel/9/Everything/x86_64/ for real use.
UPSTREAM_URL="${UPSTREAM_URL:-https://fixtures.pulpproject.org/rpm-unsigned/}"

# 1. Mirror an upstream repository: remote (on demand) + repository that publishes itself + sync.
remote="$(ensure remotes/rpm/rpm rpm-upstream \
  "{\"name\":\"rpm-upstream\",\"url\":\"${UPSTREAM_URL}\",\"policy\":\"on_demand\"}")"
mirror="$(ensure repositories/rpm/rpm rpm-upstream \
  "{\"name\":\"rpm-upstream\",\"remote\":\"${remote}\",\"autopublish\":true}")"
echo "syncing rpm-upstream" >&2
pulp_sync "$mirror" "$remote"
ensure distributions/rpm/rpm rpm-upstream \
  "{\"name\":\"rpm-upstream\",\"base_path\":\"rpm-upstream\",\"repository\":\"${mirror}\",\"generate_repo_config\":true}" >/dev/null

# 2. Hosted repository for your own packages, published on every upload.
hosted="$(ensure repositories/rpm/rpm rpm-hosted '{"name":"rpm-hosted","autopublish":true}')"
ensure distributions/rpm/rpm rpm-hosted \
  "{\"name\":\"rpm-hosted\",\"base_path\":\"rpm-hosted\",\"repository\":\"${hosted}\",\"generate_repo_config\":true}" >/dev/null

show_distributions distributions/rpm/rpm rpm-
