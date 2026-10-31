---
name: detail-pages-and-expandable-rows
description: Repository is the hub; which entities get a tabbed page and which are expandable rows; Sync/Publish only when the plugin can.
status: Accepted (amended by 0010 and 0011)
---

# 0003. Repository is the hub; which entities get a page

## Context

In Pulp, versions, publications and distributions all hang off a repository. Publications and
distributions are small records: a reference to what they serve and a few settings.

## Rules

- [ ] Objects with depth get a page with tabs: Repository (Details, Versions, Publications,
      Distributions, Access, plus plugin tabs), Repository version, Remote (Details, Tasks,
      Access), Distribution (Details, Tasks, Access; [0011](0011-distribution-detail-page.md)),
      Content (Details, Artifacts, Repositories), Task, Task group, User and Group.
- [ ] Publications have no detail page: their details expand inline in the list.
- [ ] The Repository page is where its content is viewed and changed, and shows how to consume
      it (client setup for the serving distribution).
- [ ] Sync appears only for repositories whose plugin can sync; Publish only for those that
      can publish.
- [ ] A tab's content never adds its own page section; the page owns the layout.

## Consequences

- Almost all repository work happens without leaving the repository page.
- Publications can't be linked to directly.
