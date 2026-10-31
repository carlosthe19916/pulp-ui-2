---
name: relationship-views
description: A graph of how objects connect is an extra, read-only view next to the tabs that list the same objects; it loads only when opened, shows one page per relation and says what it can't show.
status: Proposed
---

# 0009. Relationship graphs are an extra view

## Context

How a repository is served spans several objects: its remote, versions, publications and
distributions. Each has its own tab, so seeing the whole chain means opening several tabs, and
distributions serving a publication appear in none of them. A graph shows the chain at once,
but a canvas is hard to use with a keyboard or screen reader, and its library is large.

## Rules

- [ ] A graph is never the only place an object or link appears: the same objects are listed
      in a tab or page.
- [ ] The graph and its library load only when its tab is opened.
- [ ] A graph is read-only: it has no actions; selecting an object opens its page, or its tab
      when it has no page.
- [ ] Each relation shows one page of objects; the rest collapse into a "+N more" node that
      opens the tab listing them.
- [ ] Links the API can't look up are named in a note above the graph, not guessed.
- [ ] A running task on an object shows on its node.

## Consequences

- The serving chain, including distributions serving a publication, is visible in one place.
- Distributions pinned to a specific repository version aren't drawn: Pulp can't filter them
  by repository.
- A new page size, one page per relation, joins the ones list reads allow; the list-reads
  code rule needs to say so once this is accepted.
