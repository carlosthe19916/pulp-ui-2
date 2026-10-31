import { definePlugin } from "@plugin-sdk/definition";

/** Maven: Java artifacts, served from a repository or pulled through a remote. */
export const maven = definePlugin({
  id: "maven",
  packages: ["maven", "pulp-maven"],
  remote: { "maven.maven": { apiPath: "maven/maven" } },
  repository: {
    // A pull-through cache: no sync or publish.
    "maven.maven": {
      apiPath: "maven/maven",
      compatibleRemoteTypes: [],
      compatiblePublicationTypes: [],
      contentChanges: "modify",
      actions: {
        "repair-metadata": { path: "repair_metadata/", target: "repository" },
        "repair-packages": { path: "repair_packages/", target: "repository" },
        "repair-index-pages": {
          path: "repair_index_pages/",
          target: "repository",
        },
        "build-path-index": { path: "build_path_index/", target: "repository" },
        "compact-path-index": {
          path: "compact_path_index/",
          target: "repository",
        },
      },
    },
  },
  distribution: { "maven.maven": { apiPath: "maven/maven" } },
  content: {
    "maven.artifact": { apiPath: "maven/artifact", upload: "upload" },
    "maven.metadata": { apiPath: "maven/metadata", upload: "upload" },
    "maven.package": { apiPath: "maven/package" },
    // Internal index page: no browsable collection endpoint.
    "maven.index-page": {},
  },
});
