import type { ResourceDescriptor } from "../types";

export const fileRemoteDescriptor: ResourceDescriptor = {
  pulpType: "file.file",
  kind: "remote",
  label: "File",
  createFields: [
    { key: "name", label: "Name", type: "text", required: true },
    { key: "url", label: "URL", type: "text", required: true },
    {
      key: "policy",
      label: "Policy",
      type: "select",
      defaultValue: "immediate",
      options: [
        { value: "immediate", label: "Immediate" },
        { value: "on_demand", label: "On Demand" },
        { value: "streamed", label: "Streamed" },
      ],
    },
  ],
  editFields: [
    { key: "url", label: "URL", type: "text" },
    {
      key: "policy",
      label: "Policy",
      type: "select",
      options: [
        { value: "immediate", label: "Immediate" },
        { value: "on_demand", label: "On Demand" },
        { value: "streamed", label: "Streamed" },
      ],
    },
    { key: "tls_validation", label: "TLS Validation", type: "boolean" },
    {
      key: "download_concurrency",
      label: "Download Concurrency",
      type: "number",
    },
    { key: "max_retries", label: "Max Retries", type: "number" },
  ],
  detailFields: [
    { key: "url", label: "URL", type: "text" },
    { key: "policy", label: "Policy", type: "text" },
    { key: "tls_validation", label: "TLS Validation", type: "boolean" },
    {
      key: "download_concurrency",
      label: "Download Concurrency",
      type: "number",
    },
    { key: "max_retries", label: "Max Retries", type: "number" },
    { key: "total_timeout", label: "Total Timeout", type: "number" },
  ],
  isAvailable: (plugins) =>
    plugins.some((p) => p.component === "file" || p.package === "pulp-file"),
};
