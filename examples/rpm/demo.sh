#!/usr/bin/env bash
# Runs the client side of the RPM tutorial against Pulp, inside a Fedora container: build the
# hello-pulp package, upload it to rpm-hosted, then install packages from both repositories
# with dnf. Run ./setup.sh first. Requires podman.
set -euo pipefail

cd "$(dirname "$0")"
source ../_lib/pulp.sh

VERSION="${VERSION:-1.0.0}"
FEDORA="${FEDORA_IMAGE:-registry.fedoraproject.org/fedora:42}"
fedora() { podman run --rm --network host -v "$PWD:/work:Z" -w /work "$FEDORA" bash -euo pipefail -c "$1"; }

step "Build hello-pulp ${VERSION} with rpmbuild"
rm -rf build && mkdir build
fedora "dnf -q -y install rpm-build >/dev/null &&
  rpmbuild -bb --define '_topdir /tmp/rpm' --define 'pkg_version ${VERSION}' hello/hello.spec >/dev/null 2>&1 &&
  cp /tmp/rpm/RPMS/noarch/*.rpm build/"
ls build

step "Upload it to rpm-hosted (Upload content in Pulp UI)"
hosted="$(lookup repositories/rpm/rpm rpm-hosted)"
pulp_upload content/rpm/packages build/hello-pulp-*.rpm -F "repository=${hosted}"

step "Install from Pulp with dnf, using the .repo files Pulp generates"
fedora "rm -f /etc/yum.repos.d/*.repo &&
  curl -sSf -o /etc/yum.repos.d/rpm-upstream.repo ${CONTENT_URL}/rpm-upstream/config.repo &&
  curl -sSf -o /etc/yum.repos.d/rpm-hosted.repo ${CONTENT_URL}/rpm-hosted/config.repo &&
  dnf -y -q --nogpgcheck install bear hello-pulp-${VERSION} && hello-pulp && rpm -q bear"

step "Done. Open Pulp UI: Content Management > Repositories > rpm-hosted"
