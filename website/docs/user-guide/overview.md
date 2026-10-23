---
title: Overview
sidebar_position: 1
---

# User guide

Pulp UI is organized around the same concepts as Pulp itself. The navigation groups them as follows:

- **Content Management** — [Remotes](./remotes.md), [Repositories](./repositories.md), [Publications](./publications.md), [Distributions](./distributions.md) and [Content](./content.md).
- **Monitoring** — [Tasks](./tasks.md).
- **System Management** — [Domains](./domains.md) and signing services.
- **Administration** — [Users, groups and roles](./access-management.md).

## How the pieces fit together

```
Remote ──sync──▶ Repository ──▶ Repository version ──▶ Publication ──▶ Distribution ──▶ Clients
```

1. A **remote** describes where content comes from.
2. Syncing a **repository** from a remote creates a new immutable **repository version**.
3. A **publication** generates the metadata clients need for a given version.
4. A **distribution** serves that publication (or a repository version directly) at a URL.

The exact steps depend on the content type: some plugins, such as Container, distribute repository versions without a publication.

:::info
Many operations, like syncs, updates and deletions, run as background tasks in Pulp. Pulp UI shows their progress next to the affected resource and in the [Tasks](./tasks.md) view.
:::
