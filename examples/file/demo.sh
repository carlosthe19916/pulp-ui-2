#!/usr/bin/env bash
# Runs the client side of the generic files tutorial against Pulp: download a mirrored file,
# package hello as a tarball, upload it to files-hosted, then download and verify it.
# Run ./setup.sh first.
set -euo pipefail

cd "$(dirname "$0")"
source ../_lib/pulp.sh

VERSION="${VERSION:-1.0.0}"
ARTIFACT="hello-${VERSION}.tar.gz"
RELATIVE_PATH="hello/${VERSION}/${ARTIFACT}"

step "Download a mirrored file: ${CONTENT_URL}/files-upstream/1.iso"
rm -rf build && mkdir build
curl -sSf -o build/1.iso "${CONTENT_URL}/files-upstream/1.iso"
curl -sSf "${CONTENT_URL}/files-upstream/PULP_MANIFEST" | grep '^1.iso,'
sha256sum build/1.iso

step "Package hello ${VERSION} and upload it as ${RELATIVE_PATH} (Upload content in Pulp UI)"
tar -czf "build/${ARTIFACT}" -C hello .
hosted="$(lookup repositories/file/file files-hosted)"
if curl -sSf -o /dev/null "${CONTENT_URL}/files-hosted/${RELATIVE_PATH}" 2>/dev/null; then
  echo "${RELATIVE_PATH} is already in files-hosted, skipping the upload"
else
  pulp_upload content/file/files "build/${ARTIFACT}" \
    -F "repository=${hosted}" -F "relative_path=${RELATIVE_PATH}"
fi

step "Download it from Pulp, check it against the PULP_MANIFEST, and run it"
mkdir build/download
curl -sSf -o "build/download/${ARTIFACT}" "${CONTENT_URL}/files-hosted/${RELATIVE_PATH}"
expected="$(curl -sSf "${CONTENT_URL}/files-hosted/PULP_MANIFEST" | grep "^${RELATIVE_PATH}," | cut -d, -f2)"
echo "${expected}  build/download/${ARTIFACT}" | sha256sum -c -
tar -xzf "build/download/${ARTIFACT}" -C build/download && sh build/download/hello.sh

step "Done. Open Pulp UI: Content Management > Repositories > files-hosted"
