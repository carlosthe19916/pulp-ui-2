---
name: view-state-persistence
description: A screen's view state — each list's filters, sort, page and page size, and each tab group's active tab — is kept where it chooses (the address, the browser tab, the browser, or only while on screen); lists and tab groups on one screen never clash, and bad or stale values fall back to defaults.
status: Accepted
---

# 0013. Where a screen's view state is kept

## Context

Lists lose their filters, sort and page on reload, on Back and when the user leaves and comes
back, and none of it can be shared as a link. Tabs have the same problem: a reload or a copied
link opens a detail page on its first tab. Not every list or tab group wants the same lifetime: a
main list should be shareable, a page size or a build tool is a personal preference, and a picker
in a dialog should start fresh. Screens also show several lists and tab groups at once, which
overwrite each other if they keep their state under the same names. A list and a tab are
different things, but they need the same answer.

## Rules

### Lists and tabs

- [ ] Each piece of view state (a list's filters, sort, page and page size; a tab group's active
      tab) is kept in one of four places, chosen per list or tab group:
  - **the address**: survives reload, travels with a copied link;
  - **the browser tab**: survives reload in that tab, not shared, gone when the tab closes;
  - **the browser**: survives a browser restart and is shared by all tabs;
  - **the screen**: gone when the list or tab group leaves the screen.
- [ ] Moving a piece of state from one place to another changes only where it's kept.
- [ ] Reloading, or opening a copied link, shows the screen the address describes.
- [ ] Changing a filter, the sort, the page or the tab doesn't add a Back step: Back leaves the
      screen.
- [ ] The address holds only what differs from the defaults, each piece as its own readable entry;
      a value with several items repeats its name, and nothing in it is encoded data.
- [ ] Lists and tab groups on one screen never overwrite each other. The screen's main ones use
      plain names; nested or reused ones are prefixed with a short name the screen chooses.
- [ ] A value that isn't valid any more falls back to its default instead of failing.
- [ ] State kept in the browser tab or the browser is kept per domain.

### Lists

- [ ] By default, a page's or a tab's main list keeps its state in the address; a list in a dialog,
      an expanded row, a drawer or a dashboard card keeps it on the screen only.
- [ ] Changing a filter, the sort or the page size goes back to the first page.
- [ ] Filters restored from the browser tab or the browser show in the toolbar like any other
      filter, and clearing filters clears them wherever they're kept.
- [ ] A link from another page that opens a filtered list shows those filters, and the list treats
      them like ones the user set.

### Tabs

- [ ] By default, a page's tabs and the tabs nested in them keep the active tab in the address;
      tabs in a dialog keep it on the screen only; a tab group that is a preference (a build tool)
      keeps it in the browser.
- [ ] A tab that isn't shown any more (an uninstalled plugin's tab, one the user may not see)
      opens the group's first tab instead.

## Consequences

- Detail pages can be linked and reloaded on any tab, and a tab's list keeps its place with it.
- Addresses grow with nested state (`?tab=content&content.section=packages`); defaults stay out.
- Links depend on tab and filter names, so renaming one breaks old links; the fallback rule
  degrades them to the default view rather than an error.
- State restored from the browser can surprise a user who didn't set it in this visit, which is
  why restored filters stay visible and clearable.
