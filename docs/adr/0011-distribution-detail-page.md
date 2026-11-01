---
name: distribution-detail-page
description: Distributions get a tabbed detail page (Details, Tasks, Access) that the list, the repository's Distributions tab and the edit page link to; publications still expand inline.
status: Accepted
---

# 0011. Distributions have a detail page

## Context

[0003](0003-detail-pages-and-expandable-rows.md) kept distributions as expandable rows: a
reference to what they serve and a few settings. Since
[0010](0010-plugin-form-pages.md) gave them a per-plugin edit page, a distribution has settings
worth reading on their own (serving URL, client setup, source, content guard, plugin options),
its own task history and roles, and an edit page with nothing to return to.

## Rules

- [ ] A distribution has a page with tabs: Details, Tasks, and Access (for types with roles).
- [ ] Details shows where and how it is served (base URL, client setup, the repository, version
      or publication it serves), its settings grouped and labelled the way its form groups them,
      and its labels, creation time and PRN.
- [ ] Its name links to the page from the Distributions list and from a repository's
      Distributions tab; the edit page's breadcrumb links back to it, and saving or cancelling
      an edit returns to it.
- [ ] The page offers Edit and Delete; deleting returns to the Distributions list.
- [ ] The detail page is the one place to read a distribution and manage its roles; list rows
      offer Edit and Delete.

## Consequences

- Distributions can be linked to directly, and their tasks and access have a home.
- Creating a distribution still returns to the list: the create task hasn't produced the object
  yet when the form leaves.
