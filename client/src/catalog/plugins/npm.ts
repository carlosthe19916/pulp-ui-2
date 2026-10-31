import { whenInstalled } from "../compose";
import type { IPluginDefinition } from "../types";

export const npm: IPluginDefinition = {
  app: { isAvailable: whenInstalled("npm", "pulp-npm") },
  rest: { pulpType: "npm.npm", apiPath: "npm/npm" },
  entities: {
    // npm repository: supports sync but has no publications (publish stays off).
    repository: {
      compatibleRemoteTypes: ["npm.npm"],
      compatiblePublicationTypes: [],
      contentChanges: "modify",
      archiveImport: false,
    },

    remote: {},

    distribution: {},
  },

  content: [
    {
      pulpType: "npm.package",
      apiPath: "npm/packages",
      uploadable: {
        mechanism: "upload",
        fields: [
          { key: "relative_path", label: "Relative path", type: "text" },
          { key: "name", label: "Name", type: "text" },
          { key: "version", label: "Version", type: "text" },
        ],
      },
    },
  ],
};
