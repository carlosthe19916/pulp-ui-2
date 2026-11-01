---
name: detail-pages-and-expandable-rows
description: Repository is the hub; which entities get a tabbed page (including the Publication page: Details, Access, Delete only) and which are expandable rows; Sync/Publish only when the plugin can.
status: Accepted (amended by 0010, 0011 and 0012)
---

# 0003. Repository is the hub; which entities get a page

## Context

In Pulp, versions, publications and distributions all hang off a repository. Publications and
distributions are small records: a reference to what they serve and a few settings. Still, a
publication has more than a row can show (what it was published from, the distributions serving
it, its plugin's publishing settings, its roles), and it needs an address others can link to.

## Rules

- [ ] Objects with depth get a page with tabs: Repository (Details, Content
      ([0012](0012-repository-content-tab.md)), Versions, Publications, Distributions, Access,
      plus plugin tabs), Repository version, Remote (Details, Tasks,
      Access), Distribution (Details, Tasks, Access; [0011](0011-distribution-detail-page.md)),
      Publication (Details, Access),
      Content (Details, Artifacts, Repositories), Task, Task group, User and Group.
- [ ] A publication's Access tab shows only for types with roles. Its Details shows what it was
      published from (the repository and its version), the distributions serving it, its
      settings grouped and labelled the way its create form groups them, and its type, creation
      time and PRN.
- [ ] A publication's id links to its page from the Publications list, from a repository's
      Publications tab and from the Details of a distribution serving it.
- [ ] A publication is immutable: its one action is Delete, in its list row and on its page
      (which then returns to the Publications list). The page is the one place to read a
      publication and manage its roles.
- [ ] The Repository page is where its content is viewed and changed, and shows how to consume
      it (client setup for the serving distribution).
- [ ] Sync appears only for repositories whose plugin can sync; Publish only for those that
      can publish.
- [ ] A tab's content never adds its own page section; the page owns the layout.

## Consequences

- Almost all repository work happens without leaving the repository page.
- Publications can be linked to directly, and their access has a home next to their details.
- Creating a publication returns to the list, since the create task hasn't produced the object
  yet when the form leaves.
