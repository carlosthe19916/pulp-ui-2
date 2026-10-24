import type { DistributionResponse } from "@app/client";
import { useDistributionsListQuery } from "@app/queries/distributions";
import { usePublicationsListQuery } from "@app/queries/publications";
import { getPlugin } from "@catalog";

const LIMIT = 100;

const publicationOf = (distribution: DistributionResponse): string | null =>
  (distribution as { publication?: string | null }).publication ?? null;

/**
 * Distributions serving a repository: directly, or (for plugins that publish) through one
 * of its publications.
 */
export const useServingDistributions = ({
  repositoryHref,
  pulpType,
}: {
  repositoryHref: string;
  pulpType: string;
}) => {
  const plugin = getPlugin(pulpType);
  const distributionApiPath = plugin?.entities.distribution?.apiPath;
  const canPublish =
    (plugin?.entities.repository?.compatiblePublicationTypes.length ?? 0) > 0;

  const direct = useDistributionsListQuery({
    params: { repository: repositoryHref, limit: LIMIT },
  });
  // Only the typed collection returns `publication`.
  const typed = useDistributionsListQuery({
    apiPath: distributionApiPath,
    params: { limit: LIMIT },
    options: { enabled: canPublish && !!distributionApiPath },
  });
  const published = (typed.data?.results ?? []).filter(publicationOf);
  // Distributions can't be filtered by publication: keep those serving this
  // repository's publications.
  const own = usePublicationsListQuery({
    params: {
      repository: repositoryHref,
      pulp_href__in: published.flatMap((d) => publicationOf(d) ?? []),
      fields: ["pulp_href"],
      limit: LIMIT,
    },
    options: { enabled: published.length > 0 },
  });

  const ownHrefs = (own.data?.results ?? []).map((p) => p.pulp_href);
  return {
    distributions: [
      ...(direct.data?.results ?? []),
      ...published.filter((d) => ownHrefs.includes(publicationOf(d) ?? "")),
    ],
    isLoading: direct.isLoading || typed.isLoading || own.isLoading,
  };
};
