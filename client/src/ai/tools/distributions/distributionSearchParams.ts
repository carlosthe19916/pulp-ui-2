import type { DistributionResponse } from "@app/client";
import { DROPDOWN_PAGE_SIZE } from "@app/constants";
import type { IDistributionListParams } from "@app/queries/distributions";

/** A server-side base path search sized like a picker, shared by the tool and its card. */
export const distributionSearchParams = (
  basePath: string,
): IDistributionListParams => ({
  limit: DROPDOWN_PAGE_SIZE,
  offset: 0,
  base_path__icontains: basePath,
  ordering: "base_path",
});

/**
 * The cross-type list omits `publication`, so a distribution with no repository or version
 * needs its own detail to tell a publication from nothing.
 */
export const needsDetail = (distribution: DistributionResponse): boolean =>
  !distribution.repository && !distribution.repository_version;

/** The typed detail's `publication`, which the generic type doesn't declare. */
export const publicationOf = (
  distribution: DistributionResponse | undefined,
): string | null => {
  const { publication } = (distribution ?? {}) as { publication?: unknown };
  return typeof publication === "string" ? publication : null;
};
