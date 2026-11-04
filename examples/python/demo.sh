#!/usr/bin/env bash
# Runs the client side of the Python tutorial against Pulp: install build tools through the
# cache, upload example-hello-lib with twine, then install it in hello-app. Run ./setup.sh first.
set -euo pipefail

cd "$(dirname "$0")"
source ../_lib/pulp.sh

VERSION="${VERSION:-1.0.0}"
PYPI="${PULP_URL}/pypi/${PULP_DOMAIN:+${PULP_DOMAIN}/}"
export PIP_INDEX_URL="${PYPI}pypi-proxy/simple/"
export PIP_EXTRA_INDEX_URL="${PYPI}pypi-hosted/simple/"
export PIP_NO_CACHE_DIR=1 PIP_DISABLE_PIP_VERSION_CHECK=1
UPLOAD_URL="${PYPI}pypi-hosted/legacy/"

# A throwaway virtual environment, so every package really comes from Pulp.
VENV="$PWD/.venv-demo"
rm -rf "$VENV" dist && python3 -m venv "$VENV"
py() { "$VENV/bin/python" "$@"; }

step "Install build and twine through ${PIP_INDEX_URL}"
py -m pip install -q build twine

step "Build example-hello-lib ${VERSION} and upload it to ${UPLOAD_URL}"
HELLO_LIB_VERSION="$VERSION" py -m build -q -o dist hello-lib
existing="$(curl -sSf "${PIP_EXTRA_INDEX_URL}example-hello-lib/" 2>/dev/null || true)"
for file in dist/*; do
  if grep -q "${file#dist/}" <<<"$existing"; then
    echo "${file#dist/} is already in pypi-hosted, skipping it"
  else
    py -m twine upload --non-interactive --disable-progress-bar \
      --repository-url "$UPLOAD_URL" -u "$PULP_USER" -p "$PULP_PASSWORD" "$file"
  fi
done

step "Install hello-app's requirements and run it"
py -m pip install -q -r hello-app/requirements.txt
py hello-app/app.py

step "Done. Open Pulp UI: Content Management > Repositories > pypi-hosted"
