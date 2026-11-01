#!/usr/bin/env bash
# Show or choose which plugins the pinned backend installs.
set -euo pipefail

# shellcheck source=common.sh
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

usage() {
  cat <<EOF
Usage: npm run backend:plugins [-- <plugin>... | all | none]

  (no arguments)     show the active and the available plugins
  <plugin>...        install only these, e.g. rpm container (pulpcore is always included)
  all                install every plugin in compose.env
  none               install no plugins, only pulpcore (with its file and certguard)

Switching removes the backend's containers and data (compose down -v): rows of a removed
plugin break Pulp's generic endpoints. Run npm run backend:start afterwards.
EOF
}

# "pulpcore:pulp_rpm" -> "rpm"; "pulpcore" -> "none"; empty -> "all".
describe() {
  local names
  [ -n "$1" ] || { echo all && return; }
  names=$(tr ':' '\n' <<<"$1" | short_names)
  echo "${names:-none (pulpcore only)}"
}

case "${1:-}" in -h | --help) usage && exit 0 ;; esac
require_setup

available=$(all_plugins)
current=$(selected_plugins | paste -sd: -)

if [ $# -eq 0 ]; then
  echo "Active:    $(describe "$current")"
  echo "Available: $(short_names <<<"$available")"
  exit 0
fi

wanted="pulpcore"
for arg in "$@"; do
  name=$(tr '[:upper:]' '[:lower:]' <<<"$arg")
  case "$name" in
    all) wanted="$available" && break ;;
    none | core | pulpcore) continue ;;
    pulp_*) ;;
    *) name="pulp_$name" ;;
  esac
  grep -qx "$name" <<<"$available" ||
    die "unknown plugin '$arg'; available: $(short_names <<<"$available")"
  wanted+=$'\n'"$name"
done

# In compose.env order; the full set is stored as "no selection".
new=$(grep -Fxf <(echo "$wanted") <<<"$available" | paste -sd: -)
[ "$new" != "$(paste -sd: - <<<"$available")" ] || new=""

if [ "$new" = "$current" ]; then
  echo "Already active: $(describe "$new")"
  exit 0
fi

log "Switching plugins: $(describe "$current") -> $(describe "$new")"
log "Removing the backend's containers and data"
out=$("$(dirname "${BASH_SOURCE[0]}")/oci-env.sh" compose down -v 2>&1) || die "compose down failed:"$'\n'"$out"

if [ -n "$new" ]; then echo "$new" >"$SELECTION_FILE"; else rm -f "$SELECTION_FILE"; fi

echo
echo "Active: $(describe "$new")"
echo "Next:   npm run backend:start (then npm run seed for sample data)"
