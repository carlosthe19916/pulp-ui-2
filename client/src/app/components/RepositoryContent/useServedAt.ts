import { useServingDistributions } from "@app/hooks/useServingDistributions";
import { useDistributionDetailQuery } from "@app/queries/distributions";

import type { IServedAt } from "./browseTypes";

const asString = (value: unknown): string =>
  typeof value === "string" ? value : "";

/**
 * Where a repository's content is served (`base_url`, `registry_path`), from the first
 * distribution serving it; empty strings when none does.
 */
export const useServedAt = ({
  repositoryHref,
  repositoryType,
}: {
  repositoryHref: string;
  repositoryType: string;
}): IServedAt => {
  const { distributions } = useServingDistributions({
    repositoryHref,
    pulpType: repositoryType,
  });
  const listed = distributions[0];
  // `registry_path` is only on the typed detail; the aggregate list omits it.
  const { data: detail } = useDistributionDetailQuery({
    href: listed?.pulp_href ?? null,
  });

  return {
    baseUrl: asString(
      (listed as Record<string, unknown> | undefined)?.base_url,
    ),
    registryPath: asString(
      (detail as Record<string, unknown> | undefined)?.registry_path,
    ),
  };
};
