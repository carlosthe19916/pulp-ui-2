---
title: Manage namespaces
sidebar_label: Manage namespaces
sidebar_position: 5
---

# Manage namespaces

**Goal:** group related container repositories under a shared prefix and control who can push to
them — the way Docker Hub organizations or Quay organizations work.

A namespace is the first path segment of an image name: in
`localhost:5003/default/myteam/app`, `myteam` is the namespace. Every repository under it shares
that prefix.

## Create or delete a namespace

1. **Content Management → Container Namespaces.**
2. **Create** a namespace by name — then anyone allowed can push `…/<namespace>/<image>` into it.
3. Use the row action to **Delete** a namespace you no longer need.

Namespaces are also created implicitly: the first `podman push` to a new prefix makes one.

## Control who can push

Grant roles on a namespace from its **Manage access** / **Access** action, so only certain users or
groups can create and push repositories under it. See
[Granting access to objects](../../administration/object-access.md).

:::info[Not yet in Pulp UI]
Per-namespace **quotas and tag-retention policies** (storage limits, auto-expiring old tags) —
Harbor and Quay offer these at the project/org level. Pulp UI manages membership and access, not
quotas. For now, prune at the repository level and reclaim space with
[maintenance](../../administration/maintenance.md).
:::

## Related

- [Granting access to objects](../../administration/object-access.md)
- [Container registry tutorial](../container.mdx) · plugin docs:
  [pulp_container](https://pulpproject.org/pulp_container/)
