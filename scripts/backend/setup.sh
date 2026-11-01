#!/usr/bin/env bash
# Build the pinned backend workspace (.backend/, or $PULP_BACKEND_DIR): clone every
# plugin-versions.txt repo, force it onto its ref (local edits are discarded), and install
# the oci-env CLI from the pinned oci_env. Safe to re-run.
set -euo pipefail

# shellcheck source=common.sh
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

if [ -d "$BACKEND_DIR" ] && [ ! -f "$MARKER_FILE" ] && [ -n "$(ls -A "$BACKEND_DIR")" ]; then
  die "$BACKEND_DIR is not empty and was not created by this script; refusing to reset" \
    "checkouts in it. Point PULP_BACKEND_DIR at a new folder."
fi
mkdir -p "$BACKEND_DIR"
touch "$MARKER_FILE"

manifest=$(pinned_repos | awk '$1 != "oci_env" {print $1}' | sort)
if [ "$manifest" != "$(all_plugins | sort)" ]; then
  echo "plugin-versions.txt plugins differ from compose.env DEV_SOURCE_PATH:" >&2
  diff <(all_plugins | sort) <(echo "$manifest") >&2 || true
  exit 1
fi

pinned_repos | while read -r repo ref; do
  dir="$BACKEND_DIR/$repo"
  url="https://github.com/pulp/$repo.git"
  if [ ! -d "$dir/.git" ]; then
    rm -rf "$dir"
    git init -q "$dir"
    git -C "$dir" remote add origin "$url"
  fi
  git -C "$dir" remote set-url origin "$url"
  # FETCH_HEAD handles tags, branches and SHAs alike.
  git -C "$dir" fetch -q --depth 1 --force origin "$ref"
  git -C "$dir" checkout -q --force --detach FETCH_HEAD
  # No -x: keep ignored files (oci_env/.compiled, *.egg-info).
  git -C "$dir" clean -q -fd
  log "$(printf '%-18s %-9s %s' "$repo" "$ref" "$(git -C "$dir" rev-parse --short HEAD)")"
done

[ -x "$VENV_DIR/bin/oci-env" ] || python3 -m venv "$VENV_DIR"
PIP_DISABLE_PIP_VERSION_CHECK=1 "$VENV_DIR/bin/pip" install -q -e "$BACKEND_DIR/oci_env/client"
log "oci-env installed in $VENV_DIR"

sync_profiles

echo
echo "Backend ready in $BACKEND_DIR. Start it with: npm run backend:start"
