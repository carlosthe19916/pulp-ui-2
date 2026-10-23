---
name: navigation-and-domains
description: Five sidebar groups; domain-owned objects carry the domain in the URL; plugin pages appear only when installed.
status: Accepted
---

# 0002. Navigation follows Pulp's areas; pages are domain-scoped

## Context

Pulp can split its data into domains. Most objects belong to one domain; users, groups, roles,
access policies, signing services and domains themselves are global.

## Rules

- [ ] The sidebar has five groups: **Main** (dashboard), **System Management**, **Content
      Management**, **Monitoring**, **Administration**. New pages join one of them.
- [ ] Pages for domain-owned objects carry the domain in the URL; a domain selector switches
      it. Global objects have no domain in the URL.
- [ ] Plugin-specific pages live in Content Management and appear only when that plugin is
      installed.
- [ ] When domains are disabled on the server, the Domains page says so instead of failing.

## Consequences

- A copied link always opens the same domain.
