import type { OidcClientSettings } from "oidc-client-ts";

import { ENV } from "./env";

export const OIDC_SERVER_URL =
  ENV.OIDC_SERVER_URL || "http://localhost:8090/realms/pulp";
export const OIDC_CLIENT_ID = ENV.OIDC_CLIENT_ID || "frontend";

export const oidcSignoutArgs = {
  extraQueryParams: {
    client_id: OIDC_CLIENT_ID,
    logout_uri: window.location.origin,
  },
};

export const oidcClientSettings: OidcClientSettings = {
  authority: OIDC_SERVER_URL,
  client_id: OIDC_CLIENT_ID,
  redirect_uri: window.location.origin,
  post_logout_redirect_uri: window.location.origin,
  response_type: "code",
  scope: ENV.OIDC_SCOPE || "openid",
};
