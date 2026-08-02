import type { ResourceDescriptor } from "../types";

export const filePublicationDescriptor: ResourceDescriptor = {
  pulpType: "file.file",
  kind: "publication",
  label: "File",
  createFields: [
    {
      key: "repository",
      label: "Repository",
      type: "resource",
      resourceKind: "repository",
    },
    { key: "repository_version", label: "Repository Version", type: "text" },
  ],
  detailFields: [
    { key: "repository", label: "Repository", type: "text" },
    { key: "repository_version", label: "Repository Version", type: "text" },
    { key: "manifest", label: "Manifest", type: "text" },
  ],
  isAvailable: (plugins) =>
    plugins.some((p) => p.component === "file" || p.package === "pulp-file"),
};
