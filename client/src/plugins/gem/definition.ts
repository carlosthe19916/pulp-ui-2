import { definePlugin } from "@plugin-sdk/definition";

/** Gem: Ruby gems, synced, published and served (also pulled through a remote). */
export const gem = definePlugin({
  id: "gem",
  packages: ["gem", "pulp-gem"],
  remote: { "gem.gem": { apiPath: "gem/gem" } },
  repository: {
    "gem.gem": {
      apiPath: "gem/gem",
      compatibleRemoteTypes: ["gem.gem"],
      compatiblePublicationTypes: ["gem.gem"],
      contentChanges: "modify",
    },
  },
  distribution: { "gem.gem": { apiPath: "gem/gem" } },
  publication: { "gem.gem": { apiPath: "gem/gem" } },
  content: { "gem.gem": { apiPath: "gem/gem", upload: "create" } },
});
