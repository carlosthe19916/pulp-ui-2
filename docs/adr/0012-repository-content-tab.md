---
name: repository-content-tab
description: A repository's latest-version content (Browse and All content) has its own Content tab next to Details; Details is an overview whose content count opens that tab.
status: Accepted
---

# 0012. A repository's content has its own tab

## Context

[0003](0003-detail-pages-and-expandable-rows.md) made the Repository page the place where its
content is viewed and changed, and the content sat at the bottom of the Details tab. That content
view is a page of its own (Browse and All content, per-type sub-tabs, bulk selection, a detail
drawer), so Details became a long page where the overview is lost above a second set of tabs.

## Rules

- [ ] The Repository page has a Content tab right after Details, titled with the latest version's
      unit count. It shows the latest version's content as [0004](0004-how-content-is-viewed.md)
      describes (Browse and All content), with the same selection and Remove as before.
- [ ] A repository whose latest version is empty shows an empty state on the Content tab.
- [ ] Details is an overview: About and "Use this repository". Its content count opens the
      Content tab, with a per-type breakdown when the version holds more than one type.
- [ ] Content changes (upload, add, remove all, plugin actions) stay in the page's actions menu,
      so they're reachable from any tab.

## Consequences

- Details is short and reads at a glance; content gets the full width and height of a tab.
- Reaching the content takes one click more than before.
