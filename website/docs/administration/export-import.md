---
title: Export & import
sidebar_position: 12
---

# Export & import

Move repositories between Pulp servers that **can't reach each other** — the air-gapped case. (For
servers that _can_ reach each other, use [Replication](./replication.md) instead.)

Manage it under **System Management → Export & Import**.

## Flow

```
PulpExporter ──▶ export .tar (+ TOC) ──▶ transfer ──▶ PulpImporter ──▶ import
```

- **Exporters** tab — define what to export and where.
- **Importers** tab — define how to map incoming repositories.
- **Runs** table — track export/import jobs.

## Constraints

- No on-demand content — artifacts must actually exist.
- The destination must have the **same plugins** installed, at matching X.Y versions.
- Export/import paths must be allowlisted on the server.

:::note
Outline page — full walkthrough and screenshots to follow.
:::
