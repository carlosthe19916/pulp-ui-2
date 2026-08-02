import type { ResourceDescriptor } from "../types";

export const fileContentDescriptor: ResourceDescriptor = {
  pulpType: "file.file",
  kind: "content",
  label: "File",
  supportsUpload: true,
  createFields: [
    {
      key: "relative_path",
      label: "Relative Path",
      type: "text",
      required: true,
    },
    { key: "file", label: "File", type: "file", required: true },
    {
      key: "repository",
      label: "Repository",
      type: "resource",
      resourceKind: "repository",
    },
  ],
  detailFields: [
    { key: "relative_path", label: "Relative Path", type: "text" },
    { key: "sha256", label: "SHA-256", type: "text" },
    { key: "md5", label: "MD5", type: "text" },
    { key: "sha1", label: "SHA-1", type: "text" },
    { key: "sha512", label: "SHA-512", type: "text" },
  ],
  isAvailable: (plugins) =>
    plugins.some((p) => p.component === "file" || p.package === "pulp-file"),
};
