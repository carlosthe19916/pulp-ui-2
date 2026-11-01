---
name: list-state-persistence
description: A list's filters, sort, page and page size are kept where the list chooses (the address, the browser tab, the browser, or only while on screen); several lists on one screen never clash, and bad or stale values fall back to defaults.
status: Accepted
---

# 0013. Where a list's state is kept

## Context

Every paged list loses its filters, sort and page on reload, on Back, and when the user leaves
and comes back, and none of it can be shared as a link. Not every list wants the same lifetime:
a main list should be shareable, a page size is a personal preference, and a picker inside a
dialog should start fresh each time. Screens also show more than one list at once: a tab and the
dialog it opens, or a shared task list placed inside many pages. If those lists keep their state
in the address under the same names, they overwrite each other.

## Rules

- [ ] Each piece of a list's state (filters, sort, page, page size) is kept in one of four places,
      chosen per list and per piece:
  - **the address**: survives reload, travels with a copied link;
  - **the browser tab**: survives reload in that tab, not shared, gone when the tab closes;
  - **the browser**: survives a browser restart and is shared by all tabs;
  - **the screen**: gone when the list leaves the screen.
- [ ] By default, a list that is a page's or a tab's main content keeps everything in the address,
      and a list inside a dialog keeps everything on the screen only.
- [ ] Moving a piece of state from one place to another changes only where it's kept: the list
      looks and behaves the same.
- [ ] Reloading, or opening a copied link, shows the list with the filters, sort and page that the
      address holds.
- [ ] Changing a filter, the sort or the page doesn't add a Back step: Back leaves the list.
- [ ] The address holds only what differs from the list's defaults: an unfiltered first page has a
      clean address. Each filter is its own readable entry, a filter with several values repeats
      its name, and nothing in it is encoded data.
- [ ] Several lists on one screen never overwrite each other's state. The screen's main list uses
      plain names; every other list's entries are prefixed with a short name that the screen
      showing it chooses, so a shared list placed in two screens is prefixed differently in each.
- [ ] A value that is not valid any more (an unknown sort, a removed filter, a page past the end,
      a page size not offered) falls back to that piece's default instead of failing or showing
      an empty list.
- [ ] Changing a filter, the sort or the page size goes back to the first page.
- [ ] Filters restored from the tab or the browser show in the toolbar like any other filter, and
      clearing filters clears them wherever they're kept.
- [ ] State kept in the tab or the browser is kept per domain: switching domain doesn't carry one
      domain's filters or page into another.
- [ ] A link from another page that opens a filtered list (for example a repository's tasks) shows
      those filters, and the list treats them like ones the user set.

## Consequences

- Main lists can be bookmarked and shared, and reload and Back no longer lose the user's place.
- A list can remember a preference such as its page size across sessions without cluttering
  links.
- Reused lists work anywhere, because the screen that shows them names their entries; the
  addresses of screens with nested lists are longer.
- State restored from the tab or the browser can surprise a user who didn't set it in this visit,
  which is why restored filters stay visible and clearable.
- Links into a list depend on its entry names, so renaming a filter breaks old links. The
  fallback rule degrades them to the default list rather than an error.
