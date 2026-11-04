---
title: Export & import
sidebar_position: 12
---

# Export & import

Move repositories between Pulp servers that **can't reach each other** — the air-gapped case: export
to a `.tar`, carry it across the gap, import on the far side. (For servers that _can_ reach each
other, use [Replication](./replication.md) instead.)

Manage it under **System Management → Export & Import**.

## Flow

```
PulpExporter ──▶ export .tar (+ TOC) ──▶ transfer ──▶ PulpImporter ──▶ import
```

1. **Exporters** tab — create an exporter (what to export and where to write the `.tar`), then run it.
2. Move the resulting `.tar` to the destination server.
3. **Importers** tab — create an importer that maps the incoming repositories to local ones, then run
   it against the `.tar`.
4. **Runs** table — track export and import jobs and their results.

## Constraints

- No [on-demand](../concepts/download-policies.md) content — the artifacts must actually exist.
- The destination must have the **same plugins** installed, at matching X.Y versions.
- Export and import paths must be allowlisted on the server.
