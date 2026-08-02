import axios from "axios";

import { createClient } from "@app/client/client";

function getCsrfToken(): string | undefined {
  const match = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : undefined;
}

let onUnauthorized: (() => void) | null = null;

export const setOnUnauthorized = (cb: () => void) => {
  onUnauthorized = cb;
};

/**
 * Header used to mark requests (e.g. the initial session probe) whose 401
 * responses are expected and shouldn't trigger the global unauthorized
 * handler (which redirects to the login page).
 */
export const SKIP_AUTH_REDIRECT_HEADER = "X-Skip-Auth-Redirect";

export const client = createClient({
  baseURL: "",
  axios: axios,
  throwOnError: true,
});

client.instance.defaults.withCredentials = true;

client.instance.interceptors.request.use((config) => {
  const method = config.method?.toUpperCase();
  if (method && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const token = getCsrfToken();
    if (token) {
      config.headers.set("X-CSRFToken", token);
    }
  }
  return config;
});

client.instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const skipRedirect =
        error.config?.headers?.[SKIP_AUTH_REDIRECT_HEADER] === "true";
      if (!skipRedirect) {
        onUnauthorized?.();
      }
    }
    return Promise.reject(error);
  },
);
