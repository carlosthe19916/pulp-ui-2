---
title: Disconnected and multi-site
description: Move Pulp content across an air gap, replicate a server you can reach, or fetch on-demand bytes from a closer mirror.
sidebar_label: Disconnected and multi-site
sidebar_position: 5
---

# Disconnected and multi-site

A full RPM or Debian mirror is the usual reason to run more than one Pulp. Three mechanisms cover the cases. They are not interchangeable.

## Air gap: export and import

When the servers cannot reach each other, export a repository to a `.tar` plus a table of contents, carry it across, and import it. The destination needs the same plugins at a matching X.Y version. Export and import paths must be allowlisted on the server.

Export refuses [on-demand](./download-policies.md) content. Sync with `immediate` first so the artifacts exist. This is the path for a disconnected RPM or Debian mirror, and for file repositories.

OSTree's disconnected path is different: import an `archive`-mode repository tarball into an OSTree repository. See [OSTree](../tutorials/ostree.mdx).

## Servers that can reach each other: replication

Replication registers another Pulp and creates the matching remotes, repositories and distributions, then syncs them. A policy decides what happens to local objects the upstream does not have: `all` mirrors exactly and removes extras, `labeled` acts only on labeled objects, `nodelete` adds and updates. A label filter narrows the set. Replication also works between domains on one server.

Replication is a tech preview in Pulp.

## Closer bytes: alternate content sources

An alternate content source is a closer copy Pulp tries first when an on-demand download needs a file, then falls back to the original upstream. It does not change the repository or the remote the client is configured against. RPM, Debian and File support it. Refresh the source after you add it so Pulp knows which paths it covers.

A File publication writes a `PULP_MANIFEST`, so a second Pulp can also sync that manifest directly. See [Files](../tutorials/file.mdx).
