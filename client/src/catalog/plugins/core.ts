import { whenInstalled } from "../compose";
import type { IPluginDefinition } from "../types";

/**
 * pulpcore — the platform. It has no CRUD entities of its own, but it owns the
 * OpenPGP content types (and the internal `core.publishedmetadata`). `rest.pulpType`
 * is the synthetic key `"core"` (never a real content pulp_type, so it can't collide
 * with a content type); the plugin carries only `content`, no `entities`.
 */
export const core: IPluginDefinition = {
  app: { isAvailable: whenInstalled("core", "pulpcore") },
  rest: { pulpType: "core", apiPath: "core" },
  entities: {},
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
