import { whenInstalled } from "../compose";
import type { IPluginDefinition } from "../types";

/** File: the pulpcore reference plugin — implements all five entity types. */
export const file: IPluginDefinition = {
  app: { isAvailable: whenInstalled("file", "pulp-file") },
  rest: { pulpType: "file.file", apiPath: "file/file" },
  entities: {
    repository: {
      compatibleRemoteTypes: ["file.file", "file.git"],
      compatiblePublicationTypes: ["file.file"],
      contentChanges: "modify",
      archiveImport: false,
    },

    // File remote (file.file) + Git remote (file.git) — two variants of the slot.
    // A FileRepository's backend REMOTE_TYPES is [FileRemote, FileGitRemote], so
    // both can be synced from; declaring the git variant here lets the sync UI
    // offer it and lets users create one.
    remote: [
      {},
      {
        rest: { pulpType: "file.git", apiPath: "file/git" },
      },
    ],

    distribution: {},

    publication: {},
  },

  // File content: one uploadable type. The collection path (file/files) differs
  // from the pulp_type (file.file).
  content: [
    {
      pulpType: "file.file",
      apiPath: "file/files",
      uploadable: {
        mechanism: "upload",
        fields: [
          {
            key: "relative_path",
            label: "Relative Path",
            type: "text",
            required: true,
          },
        ],
      },
    },
  ],
};
