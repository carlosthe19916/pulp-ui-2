---
name: rest-api-only
description: The UI calls only the Pulp REST API — no proxies to Galaxy, registry, PyPI or content app; show client setup instead; listed endpoints are out of scope.
status: Accepted
---

# 0007. The UI uses only the Pulp REST API

## Context

Some plugins also expose client-facing APIs (Galaxy, the container registry, PyPI, npm, the
content app). Reaching them needs extra proxy routes and, for the registry, bearer tokens.
They also reflect only served (latest) content.

## Rules

- [ ] The UI talks to the Pulp REST API only; no proxies to client-facing APIs.
- [ ] Data only available from client-facing APIs is left out, or read from the REST API where
      it offers an equivalent.
- [ ] Instead of client APIs, the UI shows copy-paste client setup and install commands.
- [ ] Out of scope: session login (basic auth and OIDC cover sign-in), deprecated and one-off
      endpoints, ops endpoints (liveness, schema).
- [ ] Lists use server-side paging, sorting and filtering; the UI never fetches everything to
      process it in the browser, except small fixed sets.

## Consequences

- One API, one auth model, one proxy. Browsing a distribution's files waits for the content
  app to offer JSON listings.
