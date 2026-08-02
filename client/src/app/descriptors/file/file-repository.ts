import type { ResourceDescriptor } from "../types";

export const fileRepositoryDescriptor: ResourceDescriptor = {
  pulpType: "file.file",
  kind: "repository",
  label: "File",
  supportsSync: true,
  supportsPublish: true,
  createFields: [
    { key: "name", label: "Name", type: "text", required: true },
    { key: "description", label: "Description", type: "textarea" },
    {
      key: "remote",
      label: "Remote",
      type: "resource",
      resourceKind: "remote",
    },
    {
      key: "autopublish",
      label: "Auto-publish",
      type: "boolean",
      defaultValue: false,
    },
  ],
  editFields: [
    { key: "description", label: "Description", type: "textarea" },
    {
      key: "remote",
      label: "Remote",
      type: "resource",
      resourceKind: "remote",
    },
    {
      key: "retain_repo_versions",
      label: "Retain repo versions",
      type: "number",
    },
    { key: "autopublish", label: "Auto-publish", type: "boolean" },
  ],
  detailFields: [
    { key: "autopublish", label: "Auto-publish", type: "boolean" },
    { key: "manifest", label: "Manifest", type: "text" },
  ],
  isAvailable: (plugins) =>
    plugins.some((p) => p.component === "file" || p.package === "pulp-file"),
};
