import { definePlugin } from "@plugin-sdk/definition";

/** File: the pulpcore reference plugin; its Git remote syncs files from a Git ref. */
export const file = definePlugin({
  id: "file",
  packages: ["file", "pulp-file"],
  remote: {
    "file.file": { apiPath: "file/file" },
    "file.git": { apiPath: "file/git" },
  },
  repository: {
    "file.file": {
      apiPath: "file/file",
      compatibleRemoteTypes: ["file.file", "file.git"],
      compatiblePublicationTypes: ["file.file"],
      contentChanges: "modify",
    },
  },
  distribution: { "file.file": { apiPath: "file/file" } },
  publication: { "file.file": { apiPath: "file/file" } },
  // The content collection (file/files) differs from the type (file.file).
  content: { "file.file": { apiPath: "file/files", upload: "upload" } },
  acs: { apiPath: "file/file", remoteType: "file.file" },
});
