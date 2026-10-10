import { useQuery, useSuspenseQuery } from "@tanstack/react-query";

import type {
  FileFileContentResponse,
  FileFileDistributionResponse,
  FileFilePublicationResponse,
  FileFileRepositoryResponse,
} from "@app/client";
import { useApiDomain } from "@app/hooks/useApiDomain";

import type { IDistributionListParams } from "./distributions";
import type { IFileContentListParams } from "./file-content";
import { artifactDetailQueryOptions } from "./artifacts";
import { contentRootQueryOptions } from "./content";
import {
  distributionsListQueryOptions,
  distributionsRootQueryOptions,
} from "./distributions";
import { fileContentListQueryOptions } from "./file-content";
import { publicationsRootQueryOptions } from "./publications";
import { repositoriesRootQueryOptions } from "./repositories";
import { entityDetailQueryOptions } from "./utils/entityCrud";
import { buildContentHref, buildDistributionHref } from "./utils/pulpHref";

/** Browse pages are read-only and public, so use a longer staleTime to cut refetches. */
const BROWSE_STALE_TIME = 5 * 60 * 1000;

export const useBrowseDistributionsQuery = (
  params: IDistributionListParams,
) => {
  const domain = useApiDomain();
  return useQuery({
    ...distributionsListQueryOptions(domain, params),
    staleTime: BROWSE_STALE_TIME,
  });
};

export const useBrowseDistributionDetailQuery = (distId: string) => {
  const domain = useApiDomain();
  return useQuery({
    ...entityDetailQueryOptions<FileFileDistributionResponse>(
      distributionsRootQueryOptions.queryKey,
      buildDistributionHref(distId, domain),
    ),
    staleTime: BROWSE_STALE_TIME,
  });
};

export const useSuspenseBrowseDistributionDetailQuery = (distId: string) => {
  const domain = useApiDomain();
  return useSuspenseQuery({
    ...entityDetailQueryOptions<FileFileDistributionResponse>(
      distributionsRootQueryOptions.queryKey,
      buildDistributionHref(distId, domain),
    ),
    staleTime: BROWSE_STALE_TIME,
  });
};

export const useBrowseRepositoryDetailQuery = (href: string) => {
  return useQuery({
    ...entityDetailQueryOptions<FileFileRepositoryResponse>(
      repositoriesRootQueryOptions.queryKey,
      href,
    ),
    staleTime: BROWSE_STALE_TIME,
    enabled: !!href,
  });
};

export const useBrowsePublicationDetailQuery = (href: string) => {
  return useQuery({
    ...entityDetailQueryOptions<FileFilePublicationResponse>(
      publicationsRootQueryOptions.queryKey,
      href,
    ),
    staleTime: BROWSE_STALE_TIME,
    enabled: !!href,
  });
};

export const useBrowseFileContentListQuery = (
  params: IFileContentListParams,
  options?: { enabled?: boolean },
) => {
  const domain = useApiDomain();
  return useQuery({
    ...fileContentListQueryOptions(domain, params, options),
    staleTime: BROWSE_STALE_TIME,
  });
};

export const useBrowseContentDetailQuery = (contentId: string) => {
  const domain = useApiDomain();
  return useQuery({
    ...entityDetailQueryOptions<FileFileContentResponse>(
      contentRootQueryOptions.queryKey,
      buildContentHref(contentId, domain),
    ),
    staleTime: BROWSE_STALE_TIME,
  });
};

export const useSuspenseBrowseContentDetailQuery = (contentId: string) => {
  const domain = useApiDomain();
  return useSuspenseQuery({
    ...entityDetailQueryOptions<FileFileContentResponse>(
      contentRootQueryOptions.queryKey,
      buildContentHref(contentId, domain),
    ),
    staleTime: BROWSE_STALE_TIME,
  });
};

export const useBrowseArtifactDetailQuery = (href: string) => {
  return useQuery({
    ...artifactDetailQueryOptions(href),
    staleTime: BROWSE_STALE_TIME,
    enabled: !!href,
  });
};
