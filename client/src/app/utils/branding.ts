import type { IBrandingStrings } from "@pulp-ui/common";
import { brandingStrings } from "@pulp-ui/common";

/** Indirection so consumers keep a stable API if branding resolution becomes dynamic. */
export const getBranding = (): IBrandingStrings => brandingStrings;
