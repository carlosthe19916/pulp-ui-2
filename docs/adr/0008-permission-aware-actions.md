---
name: permission-aware-actions
description: Actions the user lacks permission for are disabled with a tooltip, not hidden; nothing disabled until permissions load; Access tab / Manage access; forbidden or unknown objects show an error state in place of the page.
status: Accepted
---

# 0008. Actions the user can't run are disabled, not hidden

## Context

Pulp enforces role-based access per object. Without checks, users click actions that then
fail with a permission error.

## Rules

- [ ] Object pages read the user's permissions on that object.
- [ ] A superuser has every permission: nothing is disabled for them. Pulp leaves superuser
      status out of the per-object permissions, so the UI checks it separately.
- [ ] Buttons and menu actions the user can't run stay visible, disabled, with the tooltip
      "You don't have permission to … this." Small inline controls (e.g. a label's remove
      button) may be omitted instead.
- [ ] Until permissions load, or when they can't be read, nothing is disabled; the server
      still enforces.
- [ ] Users and groups are granted roles on an object from its page's **Access** tab
      (repository, remote, distribution), or from a **Manage access** row action for objects
      without a page (publication and others).
- [ ] A forbidden or unknown object shows an error or unauthorized state in place of the page,
      rather than a broken or empty page.

## Consequences

- Users see what exists and why they can't use it; the UI is never the only line of defence.
