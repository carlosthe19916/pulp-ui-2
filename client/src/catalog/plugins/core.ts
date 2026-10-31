import { whenInstalled } from "../compose";
import type { IPluginDefinition } from "../types";

/** OpenPGP keyrings (repository) and their distributions share one pulp_type. */
const openpgp = { pulpType: "core.openpgp" };

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
      compatibleRemoteTypes: [],
      compatiblePublicationTypes: [],
      contentChanges: "modify",
      archiveImport: false,
    },
    distribution: {
      rest: { ...openpgp, apiPath: "core/openpgp" },
      // The keyring repository has role endpoints; its distribution does not.
      rolesManaged: false,
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
