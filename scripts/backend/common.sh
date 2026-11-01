# shellcheck shell=bash
# Shared settings and helpers for the pinned local backend; sourced by the scripts beside it.
# Keep it bash 3.2 compatible (macOS).

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Absolute, without creating it: only setup.sh creates the workspace.
BACKEND_DIR="${PULP_BACKEND_DIR:-$REPO_ROOT/.backend}"
case "$BACKEND_DIR" in /*) ;; *) BACKEND_DIR="$PWD/$BACKEND_DIR" ;; esac
BACKEND_DIR="${BACKEND_DIR%/}"

VENV_DIR="$BACKEND_DIR/.venv"
# Marks a folder setup.sh created, so it never force-resets checkouts it doesn't own.
MARKER_FILE="$BACKEND_DIR/.pulp-ui-backend"
# Active plugin set as a DEV_SOURCE_PATH value; no file means every plugin.
SELECTION_FILE="$BACKEND_DIR/plugins"

log() { echo "==> $*"; }
die() {
  echo "error: $*" >&2
  exit 1
}

require_setup() {
  [ -f "$MARKER_FILE" ] && [ -x "$VENV_DIR/bin/oci-env" ] ||
    die "no pinned backend in $BACKEND_DIR; run: npm run backend:setup"
}

# "<repo> <ref>" per plugin-versions.txt row.
pinned_repos() {
  grep -vE '^[[:space:]]*(#|$)' "$REPO_ROOT/plugin-versions.txt" | awk '{print $1, $2}'
}

# compose.env's DEV_SOURCE_PATH, one plugin per line, in its order.
all_plugins() {
  grep '^DEV_SOURCE_PATH=' "$REPO_ROOT/compose.env" | cut -d= -f2- | tr -d "\"'" | tr ':' '\n'
}

# The active plugin set, one per line; no output means every plugin.
selected_plugins() {
  if [ -f "$SELECTION_FILE" ]; then tr ':' '\n' <"$SELECTION_FILE"; fi
}

# Plugin names as users type them: pulp_rpm -> rpm, pulpcore left out.
short_names() {
  grep -vx pulpcore | sed 's/^pulp_//' | paste -sd' ' -
}

# oci-env resolves profile pulp-ui-2/<name> as SRC_DIR/pulp-ui-2/profiles/<name> and runs it
# from /src in the container, where a symlink would not resolve: copy instead.
sync_profiles() {
  mkdir -p "$BACKEND_DIR/pulp-ui-2/profiles"
  cp -a "$REPO_ROOT/profiles/." "$BACKEND_DIR/pulp-ui-2/profiles/"
}
