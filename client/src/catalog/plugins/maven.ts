import { distributionBase, remoteBase, repositoryBase } from "../base-fields";
import { whenInstalled } from "../compose";
import type { IEntityField } from "../field-types";
import type { IPluginDefinition, IRepositoryAction } from "../types";

const mavenRepositoryExtras: IEntityField[] = [
  {
    key: "remote",
    label: "Remote",
    type: "asyncResource",
    resourceKind: "remote",
  },
  { key: "retain_checkpoints", label: "Retained Checkpoints", type: "number" },
];

const mavenDistributionExtras: IEntityField[] = [
  {
    key: "repository",
    label: "Repository",
    type: "asyncResource",
    resourceKind: "repository",
  },
  {
    key: "remote",
    label: "Remote",
    type: "asyncResource",
    resourceKind: "remote",
  },
];

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
      form: {
        isWizard: false,
        createFields: [...repositoryBase.create, ...mavenRepositoryExtras],
        editFields: [...repositoryBase.edit, ...mavenRepositoryExtras],
      },
      compatibleRemoteTypes: [],
      compatiblePublicationTypes: [],
      contentChanges: "modify",
      archiveImport: false,
      actions: mavenActions,
    },

    // Maven remote: no fields beyond the pulpcore remote base.
    remote: {
      form: {
        isWizard: true,
        createFields: remoteBase.create,
        editFields: remoteBase.edit,
      },
    },

    // Maven distribution: serves a repository, or pull-through via a remote.
    distribution: {
      form: {
        isWizard: false,
        createFields: [...distributionBase.create, ...mavenDistributionExtras],
        editFields: [...distributionBase.edit, ...mavenDistributionExtras],
      },
    },
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
