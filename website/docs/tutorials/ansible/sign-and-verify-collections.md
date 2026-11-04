---
title: Sign and verify collections
sidebar_label: Sign and verify
sidebar_position: 3
---

# Sign and verify collections

**Goal:** sign the collections you host so clients can trust them, and verify signatures on collections you mirror — the way Automation Hub serves signed, certified collections.

## Sign collections you host

1. An admin first configures a signing service on the server — see [Signing services](../../administration/signing-services.md).
2. Open the hosted repository → **Actions → Sign collections**.
3. Choose the **signing service** (required) and pick the **collection versions** to sign.
4. Run it. The signatures become `collection_signature` content in the repository and are served alongside each collection.

:::tip
You can also upload an existing signature with **Upload content → collection signature** (it needs the signed collection's reference).
:::

## Verify signatures on mirrored collections

Trust works the other way for content you pull in:

| Where                                           | Setting                | Effect                                                                    |
| ----------------------------------------------- | ---------------------- | ------------------------------------------------------------------------- |
| Repository form → **Signature verification**    | **GPG key** (`gpgkey`) | Public key Pulp uses to verify signatures on synced/uploaded collections. |
| Collection remote → **Signed collections only** | On                     | Mirror only versions that carry a signature.                              |

## Related

- [Ansible Galaxy server](../ansible.mdx) · [Sync from Automation Hub](./sync-from-automation-hub.md)
- [Signing services](../../administration/signing-services.md)
- Depth: [pulp_ansible signatures](https://pulpproject.org/pulp_ansible/docs/user/guides/signature/)
