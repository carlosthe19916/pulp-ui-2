import { getPlugin } from "@catalog";
import type { DistributionResponse } from "@app/client";
import { useDistributionsListQuery } from "@app/queries/distributions";
import { usePublicationsListQuery } from "@app/queries/publications";

const LIMIT = 100;

const publicationOf = (distribution: DistributionResponse): string | null =>
  (distribution as { publication?: string | null }).publication ?? null;

/**
 * Distributions serving a repository: those pointing at it directly plus, for plugins
 * that publish, those serving one of its publications. Distributions can't be filtered
 * by publication, so the plugin's publication-backed distributions are narrowed to this
 * repository's publications.
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
