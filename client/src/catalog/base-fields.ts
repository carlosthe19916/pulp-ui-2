import type { IEntityField } from "./field-types";

/**
 * Common field groups shared by an entity type's plugins (pulpcore serializer
 * fields). Plugins spread these and add extras. `create` has the required fields,
 * `edit` mirrors them all-optional.
 */
interface IBaseFields {
  create: IEntityField[];
  edit: IEntityField[];
}

// Remote field groups double as wizard steps (the remote form is large).
const GENERAL = "General";
const AUTH = "Authentication";
const TLS = "TLS";
const TIMEOUTS = "Timeouts";
const LIMITS = "Limits";

/** Common remote fields (pulpcore RemoteSerializer base), grouped for the wizard. */
const remoteCommon: IEntityField[] = [
  {
    key: "policy",
    label: "Policy",
    type: "select",
    defaultValue: "immediate",
    group: GENERAL,
    helpText:
      "Download policy used when syncing. 'immediate' downloads all content now; " +
      "'on_demand' downloads content as clients request it and saves it; 'streamed' " +
      "downloads on request but never saves it.",
    options: [
      { value: "immediate", label: "Immediate" },
      { value: "on_demand", label: "On Demand" },
      { value: "streamed", label: "Streamed" },
    ],
  },
  {
    key: "proxy_url",
    label: "Proxy URL",
    type: "text",
    group: AUTH,
    helpText: "The proxy URL. Format: scheme://host:port",
  },
  {
    key: "username",
    label: "Username",
    type: "text",
    group: AUTH,
    helpText: "The username to be used for authentication when syncing.",
  },
  {
    key: "password",
    label: "Password",
    type: "text",
    group: AUTH,
    helpText: "The password to be used for authentication when syncing.",
  },
  {
    key: "proxy_username",
    label: "Proxy Username",
    type: "text",
    group: AUTH,
    helpText: "The username to authenticate to the proxy.",
  },
  {
    key: "proxy_password",
    label: "Proxy Password",
    type: "text",
    group: AUTH,
    helpText: "The password to authenticate to the proxy.",
  },
  {
    key: "tls_validation",
    label: "TLS Validation",
    type: "boolean",
    group: TLS,
    helpText:
      "If enabled, the server's TLS certificate is validated against the CA certificate.",
  },
  {
    key: "ca_cert",
    label: "CA Certificate",
    type: "textarea",
    group: TLS,
    helpText:
      "A PEM encoded CA certificate used to validate the server certificate presented " +
      "by the remote server.",
  },
  {
    key: "client_cert",
    label: "Client Certificate",
    type: "textarea",
    group: TLS,
    helpText: "A PEM encoded client certificate used for authentication.",
  },
  {
    key: "client_key",
    label: "Client Key",
    type: "textarea",
    group: TLS,
    helpText: "A PEM encoded private key used for authentication.",
  },
  {
    key: "total_timeout",
    label: "Total Timeout",
    type: "number",
    group: TIMEOUTS,
    helpText:
      "aiohttp total timeout (seconds) for download connections. Null uses the aiohttp " +
      "library default.",
  },
  {
    key: "connect_timeout",
    label: "Connect Timeout",
    type: "number",
    group: TIMEOUTS,
    helpText:
      "aiohttp connect timeout (seconds) for download connections. Null uses the " +
      "aiohttp library default.",
  },
  {
    key: "sock_connect_timeout",
    label: "Socket Connect Timeout",
    type: "number",
    group: TIMEOUTS,
    helpText:
      "aiohttp socket connect timeout (seconds). Null uses the aiohttp library default.",
  },
  {
    key: "sock_read_timeout",
    label: "Socket Read Timeout",
    type: "number",
    group: TIMEOUTS,
    helpText:
      "aiohttp socket read timeout (seconds). Null uses the aiohttp library default.",
  },
  {
    key: "download_concurrency",
    label: "Download Concurrency",
    type: "number",
    group: LIMITS,
    helpText:
      "Total number of simultaneous connections. If unset, the default value is used.",
  },
  {
    key: "max_retries",
    label: "Max Retries",
    type: "number",
    group: LIMITS,
    helpText:
      "Maximum number of retry attempts after a download failure. If unset, the " +
      "default (3) is used.",
  },
  {
    key: "rate_limit",
    label: "Rate Limit",
    type: "number",
    group: LIMITS,
    helpText: "Limits requests per second for each concurrent downloader.",
  },
];

/** Remotes: the pulpcore RemoteSerializer common field set (wizard-grouped). */
export const remoteBase: IBaseFields = {
  create: [
    {
      key: "name",
      label: "Name",
      type: "text",
      required: true,
      group: GENERAL,
      helpText: "A unique name for this remote.",
    },
    {
      key: "url",
      label: "URL",
      type: "text",
      required: true,
      group: GENERAL,
      helpText: "The URL of an external content source.",
    },
    ...remoteCommon,
  ],
  edit: [
    {
      key: "name",
      label: "Name",
      type: "text",
      group: GENERAL,
      helpText: "A unique name for this remote.",
    },
    {
      key: "url",
      label: "URL",
      type: "text",
      group: GENERAL,
      helpText: "The URL of an external content source.",
    },
    ...remoteCommon,
  ],
};

/** Repositories: the pulpcore RepositorySerializer common field set. */
export const repositoryBase: IBaseFields = {
  create: [
    { key: "name", label: "Name", type: "text", required: true },
    { key: "description", label: "Description", type: "textarea" },
    { key: "retain_repo_versions", label: "Retained Versions", type: "number" },
  ],
  edit: [
    { key: "name", label: "Name", type: "text" },
    { key: "description", label: "Description", type: "textarea" },
    { key: "retain_repo_versions", label: "Retained Versions", type: "number" },
  ],
};

/** Distributions: the pulpcore DistributionSerializer common field set. */
export const distributionBase: IBaseFields = {
  create: [
    { key: "name", label: "Name", type: "text", required: true },
    { key: "base_path", label: "Base Path", type: "text", required: true },
    { key: "hidden", label: "Hidden", type: "boolean" },
  ],
  edit: [
    { key: "name", label: "Name", type: "text" },
    { key: "base_path", label: "Base Path", type: "text" },
    { key: "hidden", label: "Hidden", type: "boolean" },
  ],
};

/**
 * Publications: created against a repository and immutable afterwards (no PATCH /
 * PUT), so `edit` is empty.
 */
export const publicationBase: IBaseFields = {
  create: [
    {
      key: "repository",
      label: "Repository",
      type: "asyncResource",
      resourceKind: "repository",
      required: true,
    },
  ],
  edit: [],
};
