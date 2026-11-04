---
slug: why-pulp-deserves-a-ui
title: Why Pulp deserves a UI
authors: [carlos]
tags: [pulp, ui]
---

Pulp is serious infrastructure. It mirrors upstreams, hosts your own packages, and
serves RPMs, container images, Python wheels, Ansible collections and more to a lot
of consumers. It is API-first by design: everything it does is a REST call, which
makes it a joy to automate.

But "API-first" quietly becomes "API-only" in day-to-day use. And there is a class of
work where that hurts.

{/* truncate */}

## The API is great — until you need to look

Automation is only half of what people do with a repository manager. The other half
is _looking_:

- What is actually in this repository, and which version is published?
- Why did last night's sync fail?
- Which distribution serves this content, and at what URL?
- Who has access to this domain?

Answering these over the raw API means stringing together calls, copying hrefs
between requests, and polling tasks by hand. It is doable, but it is slow, and it
rewards people who already know Pulp's data model inside out. That is a steep wall
for a developer who just needs to check one thing, or for a teammate on their first
week.

## A UI is not a replacement — it is a different tool

Pulp UI does not try to replace the API or the CLI. Scripts and pipelines should
keep talking to the API; that is what it is best at.

What a console adds is a fast path for the things the API is _worst_ at:

- **Discovery.** Browse repositories, versions and content without knowing the
  endpoints first.
- **Debugging.** Follow a sync task to the error message instead of polling a task
  href in a loop.
- **Onboarding.** Hand someone a URL, not a curl tutorial. The model becomes visible:
  remotes feed repositories, repositories produce publications, distributions serve
  them.

The CLI and the UI are complementary. You reach for whichever is faster for the task
in front of you.

## Important projects earn first-class consoles

Pulp sits in the same category as Artifactory and Nexus — and those ship a web UI as
a matter of course, because a tool this central to a release pipeline is used by more
than one kind of person. Platform engineers, developers and administrators all touch
it, and not all of them live in a terminal.

Pulp has always had the hard part: a solid, well-documented, plugin-driven API. A UI
is how that power reaches more people, with less ceremony.

That is what [Pulp UI](/docs/intro) is for. This blog is where we will write about
building it.
