#!/usr/bin/env bash
# Runs the client side of the Maven tutorial against Pulp: resolve through the cache, deploy a
# snapshot and a release, then build an app that consumes the release. Run ./setup.sh first.
set -euo pipefail

cd "$(dirname "$0")"
[[ -f .env ]] && set -a && source .env && set +a

export PULP_URL="${PULP_URL:-http://localhost:5003}"
export PULP_DOMAIN="${PULP_DOMAIN-}"
export PULP_USER="${PULP_USER:-admin}"
export PULP_PASSWORD="${PULP_PASSWORD:-password}"
export PULP_CONTENT_URL="${PULP_CONTENT_URL:-${PULP_URL}/pulp/content${PULP_DOMAIN:+/${PULP_DOMAIN}}}"
export PULP_DEPLOY_URL="${PULP_DEPLOY_URL:-${PULP_URL}/pulp/maven${PULP_DOMAIN:+/${PULP_DOMAIN}}}"
VERSION="${VERSION:-1.0.0}"

# A throwaway local repository, so every artifact really comes from Pulp.
LOCAL_REPO="$PWD/.m2-demo"
mvn() { command mvn -B -ntp -s "$PWD/settings.xml" -Dmaven.repo.local="$LOCAL_REPO" "$@"; }
step() { printf '\n==> %s\n' "$*"; }

rm -rf "$LOCAL_REPO"

step "Build hello-lib, resolving plugins and dependencies through ${PULP_CONTENT_URL}/maven-central/"
mvn -f hello-lib/pom.xml -Drevision="${VERSION%.*}.$((${VERSION##*.} + 1))-SNAPSHOT" deploy

step "Release hello-lib ${VERSION} to ${PULP_DEPLOY_URL}/maven-releases/"
mvn -f hello-lib/pom.xml -Drevision="${VERSION}" deploy

step "Build and run hello-app with an empty local repository"
rm -rf "$LOCAL_REPO/org/example"
mvn -q -f hello-app/pom.xml -Dhello-lib.version="${VERSION}" compile exec:java

step "Done. Open Pulp UI: Content Management > Repositories > maven-releases"
