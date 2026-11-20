---
title: Releases
slug: /releases
---

# Releases

Pulp UI is released automatically every week when something changed (and on demand). Each
release is published on GitHub with auto-generated notes describing exactly what it includes —
the pull requests merged since the previous release — and a matching container image on the
GitHub Container Registry.

- **Release notes & downloads:**
  [github.com/carlosthe19916/pulp-ui-2/releases](https://github.com/carlosthe19916/pulp-ui-2/releases)
- **Container images:**
  [ghcr.io/carlosthe19916/pulp-ui-2](https://github.com/carlosthe19916/pulp-ui-2/pkgs/container/pulp-ui-2)

Versions follow [Semantic Versioning](https://semver.org/). What changed since the previous
release decides the number:

- **new features** raise the minor number: `1.4.0` → `1.5.0`;
- **only fixes or dependency updates** raise the patch number: `1.4.0` → `1.4.1`;
- a week with no change to the UI itself (only documentation or tests, for example) has no
  release.

## Next major version

The next major version, 2.0, renders on the server and adds AI features. It is developed next
to the current one and published as pre-releases (`2.0.0-alpha.1`, then `-beta.N` and `-rc.N`).
Pre-releases are never marked Latest. Their images are tagged with their exact version, and the
`next` image tag follows the newest code of 2.0.

Once 2.0.0 is released, the 1.x line still gets fixes as patch releases (`1.N.1`, `1.N.2`).

| Image tag           | What it is                                   |
| ------------------- | -------------------------------------------- |
| `1.4.0`, `1.4`, `1` | a release (`1.4` and `1` move to newer ones) |
| `latest`            | the newest code of the current version       |
| `2.0.0-alpha.1`     | a pre-release of the next major version      |
| `next`              | the newest code of the next major version    |

## Verifying a release image

Every published image is keyless-signed and carries a build-provenance attestation and an
SBOM (via [Sigstore](https://www.sigstore.dev/)). Verify the provenance of a specific digest
with the GitHub CLI:

```bash
gh attestation verify oci://ghcr.io/carlosthe19916/pulp-ui-2:1.0.0 \
  --repo carlosthe19916/pulp-ui-2
```
