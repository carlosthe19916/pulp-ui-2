---
title: Mark collections
sidebar_label: Mark collections
sidebar_position: 5
---

# Mark collections

**Goal:** tag collection versions with labels like `certified` or `stable` that clients can filter on — the way Automation Hub marks collections as certified.

A mark is a label attached to a collection version. Marks are applied through actions, not by uploading content (deprecations, marks, namespaces, and roles are view-only content).

## Add or remove a mark

1. Open the repository → **Actions → Mark collections**.
2. Enter the **value** — the label text, e.g. `certified`.
3. Pick the **collection versions** to mark.
4. Run it. To remove a mark, use **Actions → Unmark collections** with the same value and versions.

| Action | Effect                                      |
| ------ | ------------------------------------------- |
| Mark   | Adds the label to the chosen versions.      |
| Unmark | Removes the label from the chosen versions. |

Clients querying the Galaxy API can then filter by the mark — useful for a "certified" view over a shared repository.

## Related

- [Sign and verify collections](./sign-and-verify-collections.md) — stronger, cryptographic trust
- [Copy and move collections](./copy-and-move-collections.md) — promotion
- Depth: [pulp_ansible collections](https://pulpproject.org/pulp_ansible/docs/user/guides/collections/)
