# Shared helpers for the examples' setup.sh and demo.sh: source it after `cd` into the example.
# Reads PULP_URL, PULP_API_ROOT, PULP_DOMAIN, PULP_USER and PULP_PASSWORD from the environment
# or .env, and talks to the Pulp REST API with curl and jq.

# Fail inside $(...) too, so an HTTP error stops the script instead of looping.
shopt -s inherit_errexit

[[ -f .env ]] && set -a && source .env && set +a

PULP_URL="${PULP_URL:-http://localhost:5003}"
PULP_API_ROOT="${PULP_API_ROOT:-/pulp/}"
PULP_DOMAIN="${PULP_DOMAIN-}"
PULP_USER="${PULP_USER:-admin}"
PULP_PASSWORD="${PULP_PASSWORD:-password}"

API="${PULP_URL}${PULP_API_ROOT}${PULP_DOMAIN:+${PULP_DOMAIN}/}api/v3"
# Content app root, the base_url of a distribution without its base path.
CONTENT_URL="${PULP_URL}/pulp/content${PULP_DOMAIN:+/${PULP_DOMAIN}}"

step() { printf '\n==> %s\n' "$*"; }

# pulp METHOD PATH [curl args...]: PATH is relative to the API root, or a full pulp_href.
pulp() {
  local method="$1" path="$2" url
  shift 2
  if [[ "$path" == /* ]]; then url="${PULP_URL}${path}"; else url="${API}/${path}"; fi
  curl -sSf -u "${PULP_USER}:${PULP_PASSWORD}" -X "$method" "$@" "$url"
}

pulp_json() {
  local method="$1" path="$2"
  shift 2
  pulp "$method" "$path" -H "Content-Type: application/json" "$@"
}

# Waits for a task and prints the first resource it created, if any.
wait_task() {
  local task="$1" body state
  [[ -n "$task" && "$task" != null ]] || { echo "no task to wait for" >&2 && return 1; }
  for _ in $(seq 300); do
    body="$(pulp GET "$task")"
    state="$(jq -r '.state' <<<"$body")"
    case "$state" in
      completed) jq -r '.created_resources[0] // empty' <<<"$body" && return 0 ;;
      failed | canceled)
        echo "task ${task} ${state}: $(jq -c '.error' <<<"$body")" >&2
        return 1
        ;;
    esac
    sleep 1
  done
  echo "task ${task} timed out" >&2 && return 1
}

# Prints the href of the named object, or nothing.
lookup() {
  local collection="$1" name="$2"
  pulp GET "${collection}/?name=${name}" | jq -r '.results[0].pulp_href // empty'
}

# Prints the href of the named object, creating it from the JSON body when missing.
ensure() {
  local collection="$1" name="$2" body="$3" href response
  href="$(lookup "$collection" "$name")"
  if [[ -n "$href" ]]; then
    echo "exists  ${collection} ${name}" >&2
  else
    response="$(pulp_json POST "${collection}/" -d "$body")"
    href="$(jq -r '.pulp_href // empty' <<<"$response")"
    if [[ -z "$href" ]]; then
      # Distributions are created by a task.
      wait_task "$(jq -r '.task' <<<"$response")" >/dev/null
      href="$(lookup "$collection" "$name")"
    fi
    echo "created ${collection} ${name}" >&2
  fi
  echo "$href"
}

# pulp_sync REPOSITORY_HREF REMOTE_HREF: syncs and waits.
pulp_sync() {
  local response
  response="$(pulp_json POST "${1}sync/" -d "{\"remote\":\"$2\"}")"
  wait_task "$(jq -r '.task' <<<"$response")" >/dev/null
}

# pulp_upload CONTENT_COLLECTION FILE [curl -F args...]: uploads FILE into a repository and waits.
# Pass the repository with -F repository=<href>.
pulp_upload() {
  local collection="$1" file="$2" response
  shift 2
  response="$(pulp POST "${collection}/" -F "file=@${file}" "$@")"
  wait_task "$(jq -r '.task' <<<"$response")" >/dev/null
}

# pulp_publish PUBLICATION_COLLECTION REPOSITORY_HREF: publishes the latest version and waits.
pulp_publish() {
  local response
  response="$(pulp_json POST "${1}/" -d "{\"repository\":\"$2\"}")"
  wait_task "$(jq -r '.task' <<<"$response")" >/dev/null
}

# Prints each matching distribution with its base URL.
show_distributions() {
  local collection="$1" prefix="${2-}"
  echo
  echo "Distributions:"
  pulp GET "${collection}/?name__startswith=${prefix}" |
    jq -r '.results[] | "  \(.name): \(.base_url // .client_url // .registry_path)"'
}
