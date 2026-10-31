import { definePlugin } from "@plugin-sdk/definition";

/** pulp_certguard: content guards that admit clients presenting a certificate. */
export const certguard = definePlugin({
  id: "certguard",
  packages: ["certguard", "pulp-certguard"],
  // Unlike pulpcore's guards, these have no per-object role endpoints.
  contentGuard: {
    "certguard.x509": { apiPath: "certguard/x509", rolesManaged: false },
    "certguard.rhsm": { apiPath: "certguard/rhsm", rolesManaged: false },
  },
});
