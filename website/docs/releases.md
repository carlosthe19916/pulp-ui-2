---
title: Releases
slug: /releases
---

# Releases

Pulp UI is released automatically every week (and on demand). Each release is published on
GitHub with auto-generated notes describing exactly what it includes — the pull requests
merged since the previous release — and a matching container image on the GitHub Container
Registry.

- **Release notes & downloads:**
  [github.com/carlosthe19916/pulp-ui-2/releases](https://github.com/carlosthe19916/pulp-ui-2/releases)
- **Container images:**
  [ghcr.io/carlosthe19916/pulp-ui-2](https://github.com/carlosthe19916/pulp-ui-2/pkgs/container/pulp-ui-2)

Versions follow a `MAJOR.MINOR` scheme (for example `0.1`, `0.2`, `0.3`). The minor number
increments with each weekly release; the major number is bumped manually for significant
milestones.

## Verifying a release image

Every published image is keyless-signed and carries a build-provenance attestation and an
SBOM (via [Sigstore](https://www.sigstore.dev/)). Verify the provenance of a specific digest
with the GitHub CLI:

```bash
gh attestation verify oci://ghcr.io/carlosthe19916/pulp-ui-2:0.1 \
  --repo carlosthe19916/pulp-ui-2
```
