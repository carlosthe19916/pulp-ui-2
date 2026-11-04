---
title: Replication
sidebar_position: 13
---

# Replication

Mirror a whole other ("upstream") Pulp: register it, run replication, and Pulp auto-creates the
matching remotes, repositories and distributions and syncs them — so the two servers serve the same
content. Use this when the servers **can** reach each other (otherwise see
[Export & import](./export-import.md)).

Manage it under **System Management → Upstream Pulps**.

## Replicate from another Pulp

1. Go to **System Management → Upstream Pulps** and **Register** the upstream (its URL and
   credentials).
2. Run **Replicate**. A **policy** controls what happens to local objects not present upstream:
   - `all` — mirror exactly, removing extras,
   - `labeled` — act only on labeled objects,
   - `nodelete` — add and update, never delete.
3. Optionally narrow the set with a **label filter**.

You can also replicate **between domains** on the same server.

:::note
Replication is a tech preview in Pulp.
:::
