#!/usr/bin/env bash
# Run oci-env with compose.env against the pinned workspace (see setup.sh), installing the
# plugin set chosen with plugins.sh. Arguments go to oci-env, e.g. `compose logs -f`.
set -euo pipefail

# shellcheck source=common.sh
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

require_setup
sync_profiles

if [ -f "$SELECTION_FILE" ]; then
  stale=$(comm -23 <(selected_plugins | sort) <(all_plugins | sort) | paste -sd' ' -)
  [ -z "$stale" ] ||
    die "selected plugins no longer in compose.env: $stale; choose again with npm run backend:plugins"
  DEV_SOURCE_PATH="$(cat "$SELECTION_FILE")"
  export DEV_SOURCE_PATH
fi

# Ignore a globally exported OCI_ENV_PATH, and use a project of our own (containers and
# volumes) instead of compose.env's, apart from any other oci-env stack.
export OCI_ENV_PATH="$BACKEND_DIR/oci_env"
export SRC_DIR="$BACKEND_DIR"
export COMPOSE_PROJECT_NAME="${PULP_BACKEND_PROJECT:-pulp_ui_2_pinned}"

exec "$VENV_DIR/bin/oci-env" -e "$REPO_ROOT/compose.env" "$@"
