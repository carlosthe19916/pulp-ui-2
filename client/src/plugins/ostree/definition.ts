import { definePlugin } from "@plugin-sdk/definition";

/** OSTree: commit-based OS trees; content also arrives by importing an uploaded archive. */
export const ostree = definePlugin({
  id: "ostree",
  packages: ["ostree", "pulp-ostree"],
  remote: { "ostree.ostree": { apiPath: "ostree/ostree" } },
  repository: {
    "ostree.ostree": {
      apiPath: "ostree/ostree",
      compatibleRemoteTypes: ["ostree.ostree"],
      compatiblePublicationTypes: [],
      contentChanges: "modify",
      archiveImport: true,
    },
  },
  distribution: { "ostree.ostree": { apiPath: "ostree/ostree" } },
  content: {
    "ostree.content": { apiPath: "ostree/content" },
    "ostree.commit": { apiPath: "ostree/commits" },
    "ostree.config": { apiPath: "ostree/configs" },
    "ostree.object": { apiPath: "ostree/objects" },
    "ostree.refs": { apiPath: "ostree/refs" },
    "ostree.summary": { apiPath: "ostree/summaries" },
  },
});
