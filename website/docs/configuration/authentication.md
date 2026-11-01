---
title: Authentication
sidebar_position: 2
---

# Authentication

Set the `AUTH` environment variable to choose how users sign in.

## `basic` (default)

Users sign in with their Pulp username and password through a login form. Pulp UI sends them to Pulp with HTTP Basic authentication. Credentials are kept in the browser's storage.

```bash
-e AUTH=basic
```

## `oidc`

Users sign in through an OpenID Connect identity provider such as Keycloak. Pulp UI obtains an access token and sends it to Pulp as a `Bearer` token, so your Pulp server must be configured to accept tokens from the same provider.

```bash
-e AUTH=oidc \
-e OIDC_SERVER_URL=https://sso.example.com/realms/pulp \
-e OIDC_CLIENT_ID=pulp-ui \
-e OIDC_SCOPE=openid
```

Register Pulp UI in your identity provider as a public client, with the Pulp UI URL as a valid redirect URI.

## `none`

Pulp UI skips the login screen and sends requests to Pulp anonymously. Only use this when Pulp allows anonymous access, or when an upstream proxy handles authentication.
