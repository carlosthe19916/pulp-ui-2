import type { IResourceDescriptor } from "../types";

export const fileDistributionDescriptor: IResourceDescriptor = {
  pulpType: "file.file",
  kind: "distribution",
  label: "File",
  createFields: [
    { key: "name", label: "Name", type: "text", required: true },
    { key: "base_path", label: "Base Path", type: "text", required: true },
    {
      key: "repository",
      label: "Repository",
      type: "resource",
      resourceKind: "repository",
    },
    {
      key: "publication",
      label: "Publication",
      type: "resource",
      resourceKind: "publication",
    },
  ],
  editFields: [
    { key: "base_path", label: "Base Path", type: "text" },
    {
      key: "repository",
      label: "Repository",
      type: "resource",
      resourceKind: "repository",
    },
    {
      key: "publication",
      label: "Publication",
      type: "resource",
      resourceKind: "publication",
    },
    { key: "content_guard", label: "Content Guard", type: "text" },
  ],
  detailFields: [
    { key: "base_path", label: "Base Path", type: "text" },
    { key: "base_url", label: "Base URL", type: "text" },
    { key: "repository", label: "Repository", type: "text" },
    { key: "publication", label: "Publication", type: "text" },
    { key: "content_guard", label: "Content Guard", type: "text" },
  ],
  browseCardFields: [
    { key: "base_path", label: "Base path", type: "text" },
    { key: "base_url", label: "Base URL", type: "text" },
  ],
  isAvailable: (plugins) =>
    plugins.some((p) => p.component === "file" || p.package === "pulp-file"),
};
