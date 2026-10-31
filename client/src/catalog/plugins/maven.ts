import { whenInstalled } from "../compose";
import type { IPluginDefinition, IRepositoryAction } from "../types";

const mavenActions: IRepositoryAction[] = [
  {
    key: "repair-metadata",
    label: "Repair metadata",
    path: "repair_metadata/",
    target: "repository",
    description: "Regenerates every maven-metadata.xml file and its checksums.",
    fields: [],
  },
  {
    key: "repair-packages",
    label: "Repair packages",
    path: "repair_packages/",
    target: "repository",
    description:
      "Reconciles the latest version's packages with the POMs it holds.",
    fields: [],
  },
  {
    key: "repair-index-pages",
    label: "Repair index pages",
    path: "repair_index_pages/",
    target: "repository",
    description: "Regenerates the HTML index page of every directory.",
    fields: [],
  },
  {
    key: "build-path-index",
    label: "Build path index",
    path: "build_path_index/",
    target: "repository",
    description: "Builds the initial path index.",
    fields: [],
  },
  {
    key: "compact-path-index",
    label: "Compact path index",
    path: "compact_path_index/",
    target: "repository",
    description: "Rebases the latest completed path index.",
    fields: [],
  },
];

export const maven: IPluginDefinition = {
  app: { isAvailable: whenInstalled("maven", "pulp-maven") },
  rest: { pulpType: "maven.maven", apiPath: "maven/maven" },
  entities: {
    // Maven repository: a pull-through cache — no sync or publish (both stay off).
    repository: {
      compatibleRemoteTypes: [],
      compatiblePublicationTypes: [],
      contentChanges: "modify",
      archiveImport: false,
      actions: mavenActions,
    },

    remote: {},

    distribution: {},
  },

  content: [
    {
      pulpType: "maven.artifact",
      apiPath: "maven/artifact",
      uploadable: {
        mechanism: "upload",
        fields: [
          {
            key: "relative_path",
            label: "Relative path",
            type: "text",
            required: true,
          },
        ],
      },
    },
    {
      pulpType: "maven.metadata",
      apiPath: "maven/metadata",
      uploadable: {
        mechanism: "upload",
        fields: [
          {
            key: "relative_path",
            label: "Relative path",
            type: "text",
            required: true,
          },
        ],
      },
    },
    {
      pulpType: "maven.package",
      apiPath: "maven/package",
    },
    // Internal index page — no browsable collection endpoint, so no apiPath.
    { pulpType: "maven.index-page" },
  ],
};
