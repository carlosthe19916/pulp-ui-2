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
const ADVANCED = "Advanced";

/** Common remote fields (pulpcore RemoteSerializer base), grouped for the wizard. */
const remoteCommon: IEntityField[] = [
  {
    key: "policy",
    label: "Policy",
    type: "select",
    defaultValue: "immediate",
    group: GENERAL,
    options: [
      { value: "immediate", label: "Immediate" },
      { value: "on_demand", label: "On Demand" },
      { value: "streamed", label: "Streamed" },
    ],
  },
  { key: "proxy_url", label: "Proxy URL", type: "text", group: AUTH },
  { key: "username", label: "Username", type: "text", group: AUTH },
  { key: "password", label: "Password", type: "text", group: AUTH },
  { key: "proxy_username", label: "Proxy Username", type: "text", group: AUTH },
  { key: "proxy_password", label: "Proxy Password", type: "text", group: AUTH },
  {
    key: "tls_validation",
    label: "TLS Validation",
    type: "boolean",
    group: TLS,
  },
  { key: "ca_cert", label: "CA Certificate", type: "textarea", group: TLS },
  {
    key: "client_cert",
    label: "Client Certificate",
    type: "textarea",
    group: TLS,
  },
  { key: "client_key", label: "Client Key", type: "textarea", group: TLS },
  {
    key: "download_concurrency",
    label: "Download Concurrency",
    type: "number",
    group: ADVANCED,
  },
  { key: "max_retries", label: "Max Retries", type: "number", group: ADVANCED },
  {
    key: "total_timeout",
    label: "Total Timeout",
    type: "number",
    group: ADVANCED,
  },
  {
    key: "connect_timeout",
    label: "Connect Timeout",
    type: "number",
    group: ADVANCED,
  },
  {
    key: "sock_connect_timeout",
    label: "Socket Connect Timeout",
    type: "number",
    group: ADVANCED,
  },
  {
    key: "sock_read_timeout",
    label: "Socket Read Timeout",
    type: "number",
    group: ADVANCED,
  },
  { key: "rate_limit", label: "Rate Limit", type: "number", group: ADVANCED },
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
    },
    { key: "url", label: "URL", type: "text", required: true, group: GENERAL },
    ...remoteCommon,
  ],
  edit: [
    { key: "name", label: "Name", type: "text", group: GENERAL },
    { key: "url", label: "URL", type: "text", group: GENERAL },
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
      type: "resource",
      resourceKind: "repository",
      required: true,
    },
  ],
  edit: [],
};
