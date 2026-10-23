import { queryOptions, useQuery } from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  AnsibleCollectionsListData,
  PaginatedansibleCollectionResponseList,
  PaginatedTagResponseList,
} from "@app/client";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import type { ListParams } from "./utils/listParams";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import { pulpApiPath } from "./utils/pulpApi";
import type { IPulpDomain } from "./utils/pulpApi";

export const AnsibleCollectionsQueryKey = "ansible-collections";

export type IAnsibleCollectionListParams =
  ListParams<AnsibleCollectionsListData>;

/** Plugin-only reads: collections (namespace + name groups) and version tags. */
export const ansibleCollectionKeys = {
  all: () => [AnsibleCollectionsQueryKey] as const,
  list: () => [...ansibleCollectionKeys.all(), "list"] as const,
  tags: () => [...ansibleCollectionKeys.all(), "tags"] as const,
  listQuery: (domain: IPulpDomain, params: IAnsibleCollectionListParams) =>
    [...ansibleCollectionKeys.list(), domain, params] as const,
  tagsQuery: (domain: IPulpDomain) =>
    [...ansibleCollectionKeys.tags(), domain] as const,
};

export const ansibleCollectionsListQueryOptions = ({
  domain,
  params,
}: {
  domain: IPulpDomain;
  params: IAnsibleCollectionListParams;
}) =>
  queryOptions<PaginatedansibleCollectionResponseList, DrfAxiosError>({
    queryKey: ansibleCollectionKeys.listQuery(domain, params),
    queryFn: async () =>
      (
        await axiosInstance.get<PaginatedansibleCollectionResponseList>(
          pulpApiPath("ansible/collections/", domain),
          {
            params: {
              ...params,
              ordering: params.ordering ? [params.ordering] : undefined,
            },
          },
        )
      ).data,
  });

export const useAnsibleCollectionsListQuery = ({
  params,
}: {
  params: IAnsibleCollectionListParams;
}) => {
  const domain = useSelectedDomain();
  return useQuery(ansibleCollectionsListQueryOptions({ domain, params }));
};

/** Every collection version tag with its use count (one page holds them all). */
export const ansibleTagsQueryOptions = ({ domain }: { domain: IPulpDomain }) =>
  queryOptions<PaginatedTagResponseList, DrfAxiosError>({
    queryKey: ansibleCollectionKeys.tagsQuery(domain),
    queryFn: async () =>
      (
        await axiosInstance.get<PaginatedTagResponseList>(
          pulpApiPath("pulp_ansible/tags/", domain),
          { params: { limit: 1000 } },
        )
      ).data,
  });

export const useAnsibleTagsQuery = () => {
  const domain = useSelectedDomain();
  return useQuery(ansibleTagsQueryOptions({ domain }));
};
