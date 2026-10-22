import type { IServedAt } from "@app/components/PluginBrowse";
import { useServingDistributions } from "@app/hooks/useServingDistributions";
import { useDistributionDetailQuery } from "@app/queries/distributions";

const asString = (value: unknown): string =>
  typeof value === "string" ? value : "";

/**
 * Where a repository's content is served, from the first distribution serving it:
 * `base_url` from the aggregate list (the content URL the "Use this repository" card
 * shows) and `registry_path` from the typed detail, which the aggregate list omits.
 * Empty strings when nothing serves the repository.
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
