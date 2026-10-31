import { definePlugin } from "@plugin-sdk/definition";

/** npm: Node packages, synced and served (also pulled through a remote). */
export const npm = definePlugin({
  id: "npm",
  packages: ["npm", "pulp-npm"],
  remote: { "npm.npm": { apiPath: "npm/npm" } },
  repository: {
    // Syncs but has no publications.
    "npm.npm": {
      apiPath: "npm/npm",
      compatibleRemoteTypes: ["npm.npm"],
      compatiblePublicationTypes: [],
      contentChanges: "modify",
    },
  },
  distribution: { "npm.npm": { apiPath: "npm/npm" } },
  content: { "npm.package": { apiPath: "npm/packages", upload: "upload" } },
});
