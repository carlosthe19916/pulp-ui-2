#!/usr/bin/env bash
# Creates the Pulp objects of the Maven tutorial through the REST API (the same objects the
# tutorial creates in Pulp UI). Safe to re-run: existing objects are kept.
set -euo pipefail

cd "$(dirname "$0")"
[[ -f .env ]] && set -a && source .env && set +a

PULP_URL="${PULP_URL:-http://localhost:5003}"
PULP_API_ROOT="${PULP_API_ROOT:-/pulp/}"
PULP_DOMAIN="${PULP_DOMAIN-}"
PULP_USER="${PULP_USER:-admin}"
PULP_PASSWORD="${PULP_PASSWORD:-password}"
MAVEN_CENTRAL_URL="${MAVEN_CENTRAL_URL:-https://repo1.maven.org/maven2/}"

API="${PULP_URL}${PULP_API_ROOT}${PULP_DOMAIN:+${PULP_DOMAIN}/}api/v3"

pulp() {
  local method="$1" path="$2"
  shift 2
  curl -sSf -u "${PULP_USER}:${PULP_PASSWORD}" -X "$method" \
    -H "Content-Type: application/json" "$@" "${API}/${path}"
}

# Prints the href of the named object, creating it from the JSON body when missing.
ensure() {
  local collection="$1" name="$2" body="$3" href
  href="$(pulp GET "${collection}/?name=${name}" | jq -r '.results[0].pulp_href // empty')"
  if [[ -z "$href" ]]; then
    local response
    response="$(pulp POST "${collection}/" -d "$body")"
    href="$(jq -r '.pulp_href // empty' <<<"$response")"
    if [[ -z "$href" ]]; then
      # Distributions are created by a task: wait for it, then look the object up again.
      wait_task "$(jq -r '.task' <<<"$response")"
      href="$(pulp GET "${collection}/?name=${name}" | jq -r '.results[0].pulp_href')"
    fi
    echo "created ${collection} ${name}" >&2
  else
    echo "exists  ${collection} ${name}" >&2
  fi
  echo "$href"
}

wait_task() {
  local task="${PULP_URL}$1" state
  for _ in $(seq 60); do
    state="$(curl -sSf -u "${PULP_USER}:${PULP_PASSWORD}" "$task" | jq -r '.state')"
    case "$state" in
      completed) return 0 ;;
      failed | canceled) echo "task ${task} ${state}" >&2 && return 1 ;;
    esac
    sleep 1
  done
  echo "task ${task} timed out" >&2 && return 1
}

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

echo
echo "Distributions (read URLs for settings.xml):"
pulp GET "distributions/maven/maven/?name__startswith=maven-" |
  jq -r '.results[] | "  \(.name): \(.base_url)"'
