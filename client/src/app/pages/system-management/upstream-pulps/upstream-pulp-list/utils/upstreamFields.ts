import type { IEntityField } from "@app/utils/entityField";

const qSelect: IEntityField = {
  key: "q_select",
  label: "Distribution filter",
  type: "text",
  helpText:
    'Replicate only matching upstream distributions, e.g. pulp_label_select="stage=prod".',
};

export const UPSTREAM_FIELDS: IEntityField[] = [
  { key: "name", label: "Name", type: "text", required: true },
  {
    key: "base_url",
    label: "Base URL",
    type: "text",
    required: true,
    helpText: "Transport, host and port, e.g. https://pulp.example.com",
  },
  {
    key: "api_root",
    label: "API root",
    type: "text",
    required: true,
    defaultValue: "/pulp/",
  },
  { key: "domain", label: "Upstream domain", type: "text" },
  {
    key: "policy",
    label: "Replication policy",
    type: "select",
    defaultValue: "all",
    options: [
      { value: "all", label: "Manage all local objects" },
      { value: "labeled", label: "Manage only replicated objects" },
      { value: "nodelete", label: "Never delete local objects" },
    ],
  },
  qSelect,
  { key: "username", label: "Username", type: "text" },
  {
    key: "password",
    label: "Password",
    type: "text",
    helpText: "Not shown once saved; leave empty to keep it.",
  },
  {
    key: "tls_validation",
    label: "Validate TLS",
    type: "boolean",
    defaultValue: true,
  },
  { key: "ca_cert", label: "CA certificate", type: "textarea" },
  { key: "client_cert", label: "Client certificate", type: "textarea" },
  {
    key: "client_key",
    label: "Client key",
    type: "textarea",
    helpText: "Not shown once saved; leave empty to keep it.",
  },
  {
    key: "download_concurrency",
    label: "Download concurrency",
    type: "number",
  },
  { key: "max_retries", label: "Max retries", type: "number" },
  { key: "total_timeout", label: "Total timeout (s)", type: "number" },
];

export const REPLICATE_FIELDS: IEntityField[] = [
  { ...qSelect, helpText: `${qSelect.helpText} Overrides the saved filter.` },
];
