---
title: Sign RPM packages and metadata
sidebar_label: Sign content
sidebar_position: 2
---

# Sign RPM packages and metadata

**Goal:** have Pulp GPG-sign your RPMs and/or the repository metadata so `dnf` can verify them — like signed repositories in Satellite or Artifactory.

Prerequisites: an RPM repository (see the [RPM tutorial](../rpm.mdx)), and a **signing service** set up on the server by an admin (see [Signing services](../../administration/signing-services.md)).

## Turn on signing

In the **repository form → Signing** section:

| Field                         | Signs                                           |
| ----------------------------- | ----------------------------------------------- |
| `metadata_signing_service`    | The repository metadata (`repomd.xml`).         |
| `package_signing_service`     | The RPM packages themselves.                    |
| `package_signing_fingerprint` | Which GPG key the package signing service uses. |

Save, then **Publish** (or add content with **Auto-publish** on) so the next version is signed. There is no separate "sign" action for RPM — signing is a property of the repository.

## Verify on the client

Point `dnf` at the public key and enable checking in the generated `.repo` file:

```ini
gpgcheck=1
repo_gpgcheck=1
gpgkey=<url to your public key>
```

Set these through the repository's **Client repo config** so every distribution's `config.repo` carries them.

## Related

- [Signing services](../../administration/signing-services.md) · [Serve content](../../using-pulp/serve-content.md)
- Depth: [Sign metadata](https://pulpproject.org/pulp_rpm/docs/user/guides/metadata_signing/)
