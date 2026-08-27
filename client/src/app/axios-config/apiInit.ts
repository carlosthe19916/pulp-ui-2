import axios from "axios";
import { User, UserManager } from "oidc-client-ts";

import ENV from "@app/env";
import {
  OIDC_CLIENT_ID,
  OIDC_SERVER_URL,
  oidcClientSettings,
  oidcSignoutArgs,
} from "@app/oidc";
import {
  loadCredentials,
  encodeBasicAuthHeader,
} from "@app/context/Auth/basicAuthHelpers";

function getOidcUser() {
  const oidcStorage = sessionStorage.getItem(
    `oidc.user:${OIDC_SERVER_URL}:${OIDC_CLIENT_ID}`,
  );
  if (!oidcStorage) {
    return null;
  }
  return User.fromStorageString(oidcStorage);
}

export const axiosInstance = axios.create({
  adapter: "fetch",
  withCredentials: false,
  // Match the OpenAPI spec's array serialization (`style: form, explode: false`):
  // arrays become comma-joined (`ordering=a,b`) and undefined/null values are
  // dropped from the query string.
  paramsSerializer: {
    serialize: (params) => {
      const sp = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        sp.append(key, Array.isArray(value) ? value.join(",") : String(value));
      }
      return sp.toString();
    },
  },
});

export const initInterceptors = () => {
  if (ENV.AUTH === "basic") {
    axiosInstance.interceptors.request.use((config) => {
      if (!config.headers.Authorization) {
        const credentials = loadCredentials();
        if (credentials) {
          config.headers.set(
            "Authorization",
            encodeBasicAuthHeader(credentials.username, credentials.password),
          );
        }
      }
      return config;
    });
    return;
  }

  if (ENV.AUTH !== "oidc") {
    return;
  }

  axiosInstance.interceptors.request.use((config) => {
    if (!config.headers.Authorization) {
      const token = getOidcUser()?.access_token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  });

  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response && error.response.status === 401) {
        const userManager = new UserManager(oidcClientSettings);
        try {
          const refreshedUser = await userManager.signinSilent();
          const access_token = refreshedUser?.access_token;

          const retryCounter = error.config.retryCounter || 1;

          const retryConfig = {
            ...error.config,
            headers: {
              ...error.config.headers,
              Authorization: `Bearer ${access_token}`,
            },
          };

          if (retryCounter < 2) {
            return axiosInstance({
              ...retryConfig,
              retryCounter: retryCounter + 1,
            });
          }
        } catch {
          await userManager.signoutRedirect(oidcSignoutArgs);
        }
      }

      return Promise.reject(error);
    },
  );
};
