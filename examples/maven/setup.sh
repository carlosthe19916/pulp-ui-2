#!/usr/bin/env bash
# Creates the Pulp objects of the Maven tutorial through the REST API (the same objects the
# tutorial creates in Pulp UI). Safe to re-run: existing objects are kept.
set -euo pipefail

cd "$(dirname "$0")"
source ../_lib/pulp.sh

MAVEN_CENTRAL_URL="${MAVEN_CENTRAL_URL:-https://repo1.maven.org/maven2/}"

# 1. Proxy Maven Central: remote + repository + distribution that pulls through.
remote="$(ensure remotes/maven/maven maven-central \
  "{\"name\":\"maven-central\",\"url\":\"${MAVEN_CENTRAL_URL}\"}")"
central="$(ensure repositories/maven/maven maven-central "{\"name\":\"maven-central\"}")"
ensure distributions/maven/maven maven-central \
  "{\"name\":\"maven-central\",\"base_path\":\"maven-central\",\"repository\":\"${central}\",\"remote\":\"${remote}\"}" >/dev/null

# 2. Hosted repositories for your own releases and snapshots.
for name in maven-releases maven-snapshots; do
  repo="$(ensure repositories/maven/maven "$name" "{\"name\":\"${name}\"}")"
  ensure distributions/maven/maven "$name" \
    "{\"name\":\"${name}\",\"base_path\":\"${name}\",\"repository\":\"${repo}\"}" >/dev/null
done

show_distributions distributions/maven/maven maven-
