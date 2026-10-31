import type { PulpApi } from "./pulp-api";

/** The signing service the dev/e2e backend seeds (compose profile `pulp-ui-2/signing`). */
export const SIGNING_SERVICE = "pulp-ui-dev-signing";

/** The seeded signing service's href, or `undefined` when the backend lacks it. */
export const signingServiceHref = async (
  api: PulpApi,
): Promise<string | undefined> =>
  (
    await api.findByName<{ pulp_href: string }>(
      "signing-services",
      SIGNING_SERVICE,
    )
  )?.pulp_href;
