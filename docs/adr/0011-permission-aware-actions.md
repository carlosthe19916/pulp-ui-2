---
name: permission-aware-actions
description: Actions the user lacks permission for are disabled with a tooltip, not hidden; nothing disabled until permissions load; Access tab / Manage access.
status: Accepted
---

# 0011. Actions the user can't run are disabled, not hidden

## Context

Pulp enforces role-based access per object. Without checks, users click actions that then
fail with a permission error.

## Rules

- [ ] Object pages read the user's permissions on that object.
- [ ] Buttons and menu actions the user can't run stay visible, disabled, with the tooltip
      "You don't have permission to … this." Small inline controls (e.g. a label's remove
      button) may be omitted instead.
- [ ] Until permissions load, or when they can't be read, nothing is disabled; the server
      still enforces.
- [ ] Objects with roles offer an **Access** tab (repository, remote) or a **Manage access**
      action (distribution, publication and others) to grant users and groups roles on them.

## Consequences

- Users see what exists and why they can't use it; the UI is never the only line of defence.
