import { useQuery } from "@tanstack/react-query";

import { useApiDomain } from "@app/hooks/useApiDomain";

import type { DistributionListParams } from "./distributions";
import type { FileContentListParams } from "./file-content";
import { artifactDetailQueryOptions } from "./artifacts";
import { distributionsListQueryOptions } from "./distributions";
import {
  fileContentDetailQueryOptions,
  fileContentListQueryOptions,
} from "./file-content";
import { fileDistributionDetailQueryOptions } from "./file-distributions";
import { filePublicationDetailQueryOptions } from "./file-publications";
import { fileRepositoryDetailQueryOptions } from "./file-repositories";

/**
 * Browse-specific query wrappers.
 *
 * Browse pages are read-only and public, so we use a longer staleTime
 * to reduce unnecessary refetches while the consumer is browsing.
 */
const BROWSE_STALE_TIME = 5 * 60 * 1000; // 5 minutes

export const useBrowseDistributionsQuery = (
  params: DistributionListParams = {},
) => {
  const domain = useApiDomain();
  return useQuery({
    ...distributionsListQueryOptions(domain, params),
    staleTime: BROWSE_STALE_TIME,
  });
};

export const useBrowseDistributionDetailQuery = (href: string) => {
  return useQuery({
    ...fileDistributionDetailQueryOptions(href),
    staleTime: BROWSE_STALE_TIME,
  });
};

export const useBrowseRepositoryDetailQuery = (href: string) => {
  return useQuery({
    ...fileRepositoryDetailQueryOptions(href),
    staleTime: BROWSE_STALE_TIME,
    enabled: !!href,
  });
};

export const useBrowsePublicationDetailQuery = (href: string) => {
  return useQuery({
    ...filePublicationDetailQueryOptions(href),
    staleTime: BROWSE_STALE_TIME,
    enabled: !!href,
  });
};

export const useBrowseFileContentListQuery = (
  params: FileContentListParams = {},
  options?: { enabled?: boolean },
) => {
  const domain = useApiDomain();
  return useQuery({
    ...fileContentListQueryOptions(domain, params, options),
    staleTime: BROWSE_STALE_TIME,
  });
};

export const useBrowseContentDetailQuery = (href: string) => {
  return useQuery({
    ...fileContentDetailQueryOptions(href),
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
