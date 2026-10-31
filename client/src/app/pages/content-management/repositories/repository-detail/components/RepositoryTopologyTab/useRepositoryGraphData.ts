import type { RepositoryResponse } from "@app/client";
import { useDistributionsListQuery } from "@app/queries/distributions";
import { usePublicationsListQuery } from "@app/queries/publications";
import { useRemoteDetailQuery } from "@app/queries/remotes";
import { getPulpType } from "@catalog";

import type { ITopologyPublication } from "./buildRepositoryGraph";

/** Rows per relation drawn; the rest collapse into a "+N more" node. */
export const TOPOLOGY_PAGE_SIZE = 10;

/**
 * Everything the topology graph needs, by filters only: the remote, the newest
 * publications (typed, so they list their distributions), the distributions serving the
 * repository and those serving the shown publications.
 */
export const useRepositoryGraphData = ({
  repository,
  pulpType,
}: {
  repository: RepositoryResponse;
  pulpType: string;
}) => {
  const href = repository.pulp_href ?? "";
  const publicationType =
    getPulpType(pulpType)?.entities.repository?.compatiblePublicationTypes[0];
  const publicationApiPath = publicationType
    ? getPulpType(publicationType)?.entities.publication?.apiPath
    : undefined;

  const remote = useRemoteDetailQuery({ href: repository.remote ?? null });
  const publications = usePublicationsListQuery({
    apiPath: publicationApiPath,
    params: {
      repository: href,
      ordering: "-pulp_created",
      limit: TOPOLOGY_PAGE_SIZE,
    },
    options: { enabled: !!publicationApiPath },
  });
  const directDistributions = useDistributionsListQuery({
    params: { repository: href, ordering: "name", limit: TOPOLOGY_PAGE_SIZE },
  });

  const publicationResults = (publications.data?.results ??
    []) as ITopologyPublication[];
  const servingHrefs = publicationResults.flatMap(
    (publication) => publication.distributions ?? [],
  );
  const publicationDistributions = useDistributionsListQuery({
    params: { pulp_href__in: servingHrefs, limit: servingHrefs.length },
    options: { enabled: servingHrefs.length > 0 },
  });

  return {
    // A remote the user can't read still shows, unnamed.
    remote: repository.remote
      ? (remote.data ?? { pulp_href: repository.remote, name: "Remote" })
      : undefined,
    publications: publicationResults,
    publicationCount: publications.data?.count ?? 0,
    distributions: [
      ...(directDistributions.data?.results ?? []),
      ...(publicationDistributions.data?.results ?? []),
    ],
    directDistributionCount: directDistributions.data?.count ?? 0,
    isLoading:
      (!!publicationApiPath && publications.isLoading) ||
      directDistributions.isLoading ||
      (servingHrefs.length > 0 && publicationDistributions.isLoading),
    // A failed lookup would otherwise drop served publications' distributions silently.
    error:
      publications.error ??
      directDistributions.error ??
      publicationDistributions.error,
  };
};
