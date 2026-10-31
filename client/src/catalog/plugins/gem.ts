import { whenInstalled } from "../compose";
import type { IPluginDefinition } from "../types";

export const gem: IPluginDefinition = {
  app: { isAvailable: whenInstalled("gem", "pulp-gem") },
  rest: { pulpType: "gem.gem", apiPath: "gem/gem" },
  entities: {
    repository: {
      compatibleRemoteTypes: ["gem.gem"],
      compatiblePublicationTypes: ["gem.gem"],
      contentChanges: "modify",
      archiveImport: false,
    },

    remote: {},

    distribution: {},

    publication: {},
  },

  content: [
    {
      pulpType: "gem.gem",
      apiPath: "gem/gem",
      uploadable: { mechanism: "create" },
    },
  ],
};
