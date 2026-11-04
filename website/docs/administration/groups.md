---
title: Groups
sidebar_position: 3
---

# Groups

A group collects users so you grant access once to the group instead of to each person — the same
idea as groups/teams in Artifactory or Nexus. Manage them under **Administration → Groups**.

## Create a group and add people

1. Go to **Administration → Groups** and click **Create**; give it a name.
2. Open the group and use the **Users** tab to add or remove members.
3. Grant the group its [roles](./roles-and-permissions.md) — every member inherits them.

## Good to know

- Grant roles to groups, not individuals, so access follows team membership.
- Groups are **global** — not scoped to a [domain](./domains.md).
- Delete a group from its row; members keep any roles granted to them directly or via other groups.
