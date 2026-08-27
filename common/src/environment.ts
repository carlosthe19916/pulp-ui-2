/** Define process.env to contain `PulpEnvType` */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface ProcessEnv extends Partial<Readonly<PulpEnvType>> {}
  }
}

/**
 * The set of environment variables used by `@pulp-ui` packages.
 */
export type PulpEnvType = {
  NODE_ENV: "development" | "production" | "test";
  VERSION: string;

  /** UI upload file size limit in megabytes (MB), suffixed with "m" */
  UI_INGRESS_PROXY_BODY_SIZE: string;

  /** Authentication mode: none (anonymous), basic (username/password), oidc (SSO) */
  AUTH: "none" | "basic" | "oidc";

  /** SSO / OIDC client id */
  OIDC_CLIENT_ID?: string;

  /** SSO / OIDC server URL (Keycloak realm, Cognito domain, etc.) */
  OIDC_SERVER_URL?: string;

  /** SSO / OIDC scope */
  OIDC_SCOPE?: string;

  /** The listen port for the UI's server */
  PORT?: string;

  /** Target URL for the UI server's `/api` proxy */
  PULP_API_URL?: string;

  /**
   * Pulp `API_ROOT` the `/api` proxy rewrites to
   */
  PULP_API_ROOT?: string;

  /** Location of branding files (relative paths computed from the project source root) */
  BRANDING?: string;
};

/**
 * Keys in `PulpEnv` that are only used on the server and therefore do not
 * need to be sent to the client.
 */
export const SERVER_ENV_KEYS = ["PORT", "PULP_API_URL", "BRANDING"];

/**
 * Normalize Pulp `API_ROOT`: leading slash, no trailing slash.
 * `pulp` → `/pulp`, `/api/pulp/` → `/api/pulp`.
 */
export const normalizePulpApiRoot = (apiRoot: string): string => {
  return apiRoot.replace(/\/+$/, "").replace(/^(?!\/)/, "/");
};

/**
 * Rewrite a client path (`/api/pulp/...`) to Pulp's `API_ROOT`.
 */
export const rewritePulpApiPath = (path: string, apiRoot: string): string => {
  return path.replace(/^\/api\/pulp/, normalizePulpApiRoot(apiRoot));
};

/**
 * Create a `PulpEnv` from a partial `PulpEnv` with a set of default values.
 */
export const buildPulpEnv = ({
  NODE_ENV = "production",
  PORT,
  VERSION = "99.0.0",

  UI_INGRESS_PROXY_BODY_SIZE = "500m",

  AUTH = "basic",
  OIDC_CLIENT_ID,
  OIDC_SERVER_URL,
  OIDC_SCOPE,

  PULP_API_URL,
  PULP_API_ROOT = "/pulp",

  BRANDING,
}: Partial<PulpEnvType> = {}): PulpEnvType => ({
  NODE_ENV,
  PORT,
  VERSION,

  UI_INGRESS_PROXY_BODY_SIZE,

  AUTH,
  OIDC_CLIENT_ID,
  OIDC_SERVER_URL,
  OIDC_SCOPE,

  PULP_API_URL,
  PULP_API_ROOT,

  BRANDING,
});

/**
 * Default values for `PulpEnvType`.
 */
export const PULP_ENV_DEFAULTS = buildPulpEnv();

/**
 * Current `@pulp-ui` environment configurations from `process.env`.
 */
export const PULP_ENV = buildPulpEnv(process.env);
