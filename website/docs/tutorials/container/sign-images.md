---
title: Sign images
sidebar_label: Sign images
sidebar_position: 3
---

# Sign images

**Goal:** sign the image manifests in a repository so clients can verify provenance — Pulp's
equivalent of cosign signing in Quay or a signed Harbor project.

Set up a repository with the [Container registry tutorial](../container.mdx). Signing needs a
**signing service** configured on the server by an administrator — see
[Signing services](../../administration/signing-services.md).

## Sign on a schedule: the repository's Signing section

1. Open (or create) the repository → **Edit** → **Signing** section.
2. Set **Manifest signing service**. New and re-signed content in the repository is signed with it.

## Sign now: the Sign images action

Available on both regular and push repositories.

1. Repository **kebab (⋮) → Sign images**.
2. Optionally override the **manifest signing service**, set a **future base path**, and a
   **tags list** to limit which tags are signed.
3. Confirm. It runs as a [task](../../using-pulp/monitor-tasks.md).

## Verifying upstream signatures

To mirror a registry that publishes cosign/sigstore signatures, set the **Sigstore** download URL
in the **remote → Signatures** section so Pulp fetches signatures alongside images during sync.

:::info[Not yet in Pulp UI]
Enforcing a signature **policy at pull time** (reject unsigned images) — Quay and Harbor can gate
pulls on signatures. Pulp UI signs and stores signatures but does not configure client-side
enforcement. For now, verify with `cosign` / podman policy on the client. See
[image signing](https://pulpproject.org/pulp_container/docs/admin/guides/sign-image/).
:::

## Related

- [Signing services](../../administration/signing-services.md) (admin setup)
- [Container registry tutorial](../container.mdx) · plugin docs:
  [pulp_container](https://pulpproject.org/pulp_container/)
