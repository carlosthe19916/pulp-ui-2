---
name: dashboard
description: The dashboard has an instance section (health, storage, details, the user's recent tasks) and a domain section (task activity, trend, inventory, failed tasks); every signed-in user sees it, scoped by what they may read.
status: Accepted
---

# 0015. The dashboard: one instance section, one domain section

## Context

Pulp answers some questions for the whole installation and others only per domain. Its status
(database, cache, API and content servers, workers, storage, versions) is public and covers the
instance. Workers can be listed only by superusers, and no role grants it. Tasks and content
belong to one domain, and a list only returns what the user may see. No endpoint adds counts
up across domains, and most users can't list the domains they may not see, so a dashboard
covering every domain would cost one request per card per domain and still be wrong for most
users. The Tasks API can't filter by who started a task.

## Rules

- [ ] The dashboard is every signed-in user's landing page. Its address carries a domain like
      every domain page, and it has the domain selector.
- [ ] The page has two sections, in this order: **Pulp instance**, then **Domain _name_**.
      Selecting a domain changes only the domain section.
- [ ] Each card answers one question, follows a PatternFly dashboard card type (aggregate
      status, utilization, trend, details, events), loads on its own and refreshes itself.
      Links to other pages sit in the card's footer.
- [ ] **System health** (aggregate status): database, cache, API servers, content servers and
      workers, each with its state; anything wrong is called out, and a green check says when
      everything is fine. The number of missing workers and the link to the Workers page are
      shown only to superusers, who are the only ones who can open it.
- [ ] **Storage** (utilization): used out of total, when the server reports it.
- [ ] **Details**: the Pulp version, the installed plugins with their versions, the content
      origin, and whether domains are enabled.
- [ ] **Your recent tasks** (events): the last tasks this browser started, in any domain, with
      their state, each linked to its task. Signing out forgets them.
- [ ] **Task activity** (aggregate status): running, waiting, and failed in the last 24 hours,
      each linked to the Tasks list filtered to it, and how many online workers are busy. When
      domains are enabled it says the counts cover this domain only.
- [ ] **Tasks over the last 7 days** (trend): completed and failed tasks per day, with a
      legend, a tooltip per bar and the same numbers as a table.
- [ ] **Content** (aggregate status): repositories, remotes, distributions, publications and,
      when a plugin can scan, vulnerability reports, each linked to its list.
- [ ] **Recent failed tasks** (events): failed tasks newest first, paged, with their error.
- [ ] The dashboard doesn't list workers; the Workers page does
      ([0014](0014-workers-list.md)).

## Consequences

- One request per card instead of one per card per domain, and nothing a user may not see.
- "Busy workers" is exact with domains disabled; with domains enabled it counts only this
  domain's running tasks, and the card says so.
- Recent tasks are per browser: tasks started elsewhere, or before signing in here, don't show.
