/** Define process.env to contain `PulpEnvType` */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface ProcessEnv extends Partial<Readonly<PulpEnvType>> {}
  }
}

/**
 * The set of environment variables used by `@pulp-ui` packages.
 */
export type PulpEnvType = {
  NODE_ENV: "development" | "production" | "test";
  VERSION: string;

  /** Controls how mock data is injected on the client */
  MOCK: string;

  /** UI upload file size limit in megabytes (MB), suffixed with "m" */
  UI_INGRESS_PROXY_BODY_SIZE: string;

  /** The listen port for the UI's server */
  PORT?: string;

  /** Target URL for the UI server's `/api` proxy */
  PULP_API_URL?: string;

  /** Pulp Domain */
  PULP_DOMAIN?: string;

  /** Location of branding files (relative paths computed from the project source root) */
  BRANDING?: string;
};

/**
 * Keys in `PulpEnv` that are only used on the server and therefore do not
 * need to be sent to the client.
 */
export const SERVER_ENV_KEYS = ["PORT", "PULP_API_URL", "BRANDING"];

/**
 * Create a `PulpEnv` from a partial `PulpEnv` with a set of default values.
 */
export const buildPulpEnv = ({
  NODE_ENV = "production",
  PORT,
  VERSION = "99.0.0",
  MOCK = "off",

  UI_INGRESS_PROXY_BODY_SIZE = "500m",

  PULP_API_URL,
  PULP_DOMAIN = "calunga-ui-dev",

  BRANDING,
}: Partial<PulpEnvType> = {}): PulpEnvType => ({
  NODE_ENV,
  PORT,
  VERSION,
  MOCK,

  UI_INGRESS_PROXY_BODY_SIZE,

  PULP_API_URL: PULP_API_URL,
  PULP_DOMAIN: PULP_DOMAIN,

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
