import { useMemo } from "react";

import { brandingStrings } from "@pulp-ui/common";
import type { IBrandingStrings } from "@pulp-ui/common";

/** A hook so consumers keep a stable API if branding resolution becomes dynamic. */
export const useBranding = (): IBrandingStrings => {
  return useMemo(() => brandingStrings, []);
};

export default useBranding;
