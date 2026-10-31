import { definePlugin } from "@plugin-sdk/definition";

/** pulpcore: the OpenPGP content types; a keyring repository and its distribution share `core.openpgp`. */
export const core = definePlugin({
  id: "core",
  packages: ["core", "pulpcore"],
  repository: {
    "core.openpgp": {
      apiPath: "core/openpgp_keyring",
      compatibleRemoteTypes: [],
      compatiblePublicationTypes: [],
      contentChanges: "modify",
    },
  },
  distribution: {
    // The keyring repository has role endpoints; its distribution does not.
    "core.openpgp": { apiPath: "core/openpgp", rolesManaged: false },
  },
  content: {
    "core.openpgp_publickey": {
      apiPath: "core/openpgp_publickey",
      upload: "create",
    },
    "core.openpgp_publicsubkey": { apiPath: "core/openpgp_publicsubkey" },
    "core.openpgp_signature": { apiPath: "core/openpgp_signature" },
    "core.openpgp_userattribute": { apiPath: "core/openpgp_userattribute" },
    "core.openpgp_userid": { apiPath: "core/openpgp_userid" },
    // Internal: no browsable collection endpoint.
    "core.publishedmetadata": {},
  },
  contentGuard: {
    "core.rbac": { apiPath: "core/rbac", downloaderRole: true },
    "core.content_redirect": { apiPath: "core/content_redirect" },
    "core.header": { apiPath: "core/header" },
    "core.envvar_header": { apiPath: "core/envvar_header" },
    "core.composite": { apiPath: "core/composite" },
  },
});
