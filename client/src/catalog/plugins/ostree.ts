import { whenInstalled } from "../compose";
import type { IPluginDefinition } from "../types";

export const ostree: IPluginDefinition = {
  app: { isAvailable: whenInstalled("ostree", "pulp-ostree") },
  rest: { pulpType: "ostree.ostree", apiPath: "ostree/ostree" },
  entities: {
    repository: {
      compatibleRemoteTypes: ["ostree.ostree"],
      compatiblePublicationTypes: [],
      contentChanges: "modify",
      archiveImport: true,
    },

    remote: {},

    distribution: {},
  },

  content: [
    {
      pulpType: "ostree.content",
      apiPath: "ostree/content",
    },
    {
      pulpType: "ostree.commit",
      apiPath: "ostree/commits",
    },
    {
      pulpType: "ostree.config",
      apiPath: "ostree/configs",
    },
    {
      pulpType: "ostree.object",
      apiPath: "ostree/objects",
    },
    { pulpType: "ostree.refs", apiPath: "ostree/refs" },
    {
      pulpType: "ostree.summary",
      apiPath: "ostree/summaries",
    },
  ],
};
