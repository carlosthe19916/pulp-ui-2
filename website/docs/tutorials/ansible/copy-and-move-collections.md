---
title: Copy and move collections
sidebar_label: Copy and move
sidebar_position: 4
---

# Copy and move collections

**Goal:** promote a tested collection version from one repository to another — for example from `staging` to `release` — without re-uploading it.

Pulp copies by reference, so promotion is instant and uses no extra storage (see [Promote content](../../using-pulp/promote-content.md)).

## Copy or move

1. Open the source repository → **Actions → Copy collection versions** (keeps it in both repos) or **Move collection versions** (removes it from the source).
2. Pick the **collection versions** to promote.
3. Choose one or more **destination repositories**.
4. Optionally set a **signing service** to sign the versions as they land.
5. Run it. Each destination gets a new [version](../../using-pulp/versions-and-rollback.md).

| Action | Source after | Use for                                      |
| ------ | ------------ | -------------------------------------------- |
| Copy   | keeps it     | Publishing to release while keeping staging. |
| Move   | removes it   | Handing content off between repos.           |

## Rebuild metadata

If a repository's Galaxy metadata looks stale after bulk changes, run **Actions → Rebuild metadata** (optionally narrow by namespace, name, or version) to regenerate it.

## Related

- [Promote content](../../using-pulp/promote-content.md) — the general pattern
- [Sign and verify collections](./sign-and-verify-collections.md) · [Mark collections](./mark-collections.md)
- Depth: [pulp_ansible copy](https://pulpproject.org/pulp_ansible/docs/user/guides/copy/)
