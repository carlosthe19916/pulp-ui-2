---
title: Replication
sidebar_position: 13
---

# Replication

Mirror another ("upstream") Pulp: register it, and replication auto-creates the matching remotes,
repositories and distributions, then syncs them. Use this when the two servers **can** reach each
other (otherwise see [Export & import](./export-import.md)).

Manage it under **System Management → Upstream Pulps**.

## Common tasks

- **Register an Upstream Pulp** (URL + credentials).
- **Replicate** — run the sync; policies control what's created/removed (`all`, `labeled`,
  `nodelete`) and a label filter narrows the set.
- Replicate **between domains** on the same server.

:::note
Outline page — full walkthrough and screenshots to follow. Replication is a tech preview in Pulp.
:::
