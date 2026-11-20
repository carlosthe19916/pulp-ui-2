import { queryOptions, useQuery } from "@tanstack/react-query";

import type {
  AnsibleCollectionsListData,
  PaginatedansibleCollectionResponseList,
} from "@app/client";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import type { ListParams } from "@app/queries/utils/listParams";
import type { DrfAxiosError } from "@app/queries/utils/openapiErrorTypes";
import type { IPulpDomain } from "@app/queries/utils/pulpApi";
import { pulpGet } from "@app/queries/utils/pulpRequest";

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
        await pulpGet({
          endpoint: "ansible/collections/",
          domain,
          params: {
            ...params,
            ordering: params.ordering ? [params.ordering] : undefined,
          },
        })
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
