import { queryOptions, useQuery } from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  AnsibleCollectionsListData,
  PaginatedansibleCollectionResponseList,
} from "@app/client";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";

import type { ListParams } from "./utils/listParams";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import type { IPulpDomain } from "./utils/pulpApi";
import { pulpApiPath } from "./utils/pulpApi";

export const AnsibleCollectionsQueryKey = "ansible-collections";

export type IAnsibleCollectionListParams =
  ListParams<AnsibleCollectionsListData>;

/** Plugin-only reads: collections (namespace + name groups). */
export const ansibleCollectionKeys = {
  all: () => [AnsibleCollectionsQueryKey] as const,
  list: () => [...ansibleCollectionKeys.all(), "list"] as const,
  listQuery: (domain: IPulpDomain, params: IAnsibleCollectionListParams) =>
    [...ansibleCollectionKeys.list(), domain, params] as const,
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
