---
title: Alternate content sources
sidebar_label: Alternate content sources
sidebar_position: 10
---

# Alternate content sources (ACS)

An ACS registers a **closer or faster mirror** that Pulp prefers when fetching package bytes within a
[domain](./domains.md) — for example a local-disk copy of a big repo, or another Pulp nearby. It
speeds up [on-demand](../concepts/download-policies.md) downloads without changing your repositories
or remotes.

Manage them under **System Management → Alternate Content Sources** (shown when an ACS-capable plugin,
such as RPM or File, is installed).

## Add an alternate source

1. Go to **System Management → Alternate Content Sources** and click **Create**.
2. Point it at the mirror (an ACS wraps a Remote plus the paths to index).
3. **Refresh** it so Pulp indexes what the mirror offers.

Afterwards, when any repository in the domain needs a matching file, Pulp fetches it from the ACS
first and falls back to the original upstream if it's missing.
