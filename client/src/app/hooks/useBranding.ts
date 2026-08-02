import { useMemo } from "react";

import { brandingStrings } from "@pulp-ui/common";
import type { BrandingStrings } from "@pulp-ui/common";

/**
 * Access branding strings via a hook so consumers share a stable React API if
 * branding resolution becomes dynamic later.
 */
export const useBranding = (): BrandingStrings => {
  return useMemo(() => brandingStrings, []);
};

export default useBranding;
