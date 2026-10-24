import { distributionBase, repositoryBase } from "../baseFields";
import { whenInstalled } from "../compose";
import type { IEntityField } from "../fieldTypes";
import type { IPluginDefinition } from "../types";

/** OpenPGP keyrings (repository) and their distributions share one pulp_type. */
const openpgp = { pulpType: "core.openpgp" };

const keyringDistributionExtras: IEntityField[] = [
  {
    key: "repository",
    label: "Keyring",
    type: "asyncResource",
    resourceKind: "repository",
  },
  { key: "repository_version", label: "Keyring version", type: "text" },
];

/**
 * pulpcore: the OpenPGP content types and keyring (pulp_type `core.openpgp`).
 * `rest.pulpType` is the synthetic `"core"`, never a real pulp_type.
 */
export const core: IPluginDefinition = {
  app: { isAvailable: whenInstalled("core", "pulpcore") },
  rest: { pulpType: "core", apiPath: "core" },
  entities: {
    repository: {
      rest: { ...openpgp, apiPath: "core/openpgp_keyring" },
      form: {
        isWizard: false,
        createFields: repositoryBase.create,
        editFields: repositoryBase.edit,
      },
      compatibleRemoteTypes: [],
      compatiblePublicationTypes: [],
      contentChanges: "modify",
      archiveImport: false,
    },
    distribution: {
      rest: { ...openpgp, apiPath: "core/openpgp" },
      form: {
        isWizard: false,
        createFields: [
          ...distributionBase.create,
          ...keyringDistributionExtras,
        ],
        editFields: [...distributionBase.edit, ...keyringDistributionExtras],
      },
    },
  },
  content: [
    {
      pulpType: "core.openpgp_publickey",
      apiPath: "core/openpgp_publickey",
      uploadable: { mechanism: "create", fields: [] },
    },
    {
      pulpType: "core.openpgp_publicsubkey",
      apiPath: "core/openpgp_publicsubkey",
    },
    {
      pulpType: "core.openpgp_signature",
      apiPath: "core/openpgp_signature",
    },
    {
      pulpType: "core.openpgp_userattribute",
      apiPath: "core/openpgp_userattribute",
    },
    {
      pulpType: "core.openpgp_userid",
      apiPath: "core/openpgp_userid",
    },
    // Internal — no browsable collection endpoint, so no apiPath.
    { pulpType: "core.publishedmetadata" },
  ],
};
