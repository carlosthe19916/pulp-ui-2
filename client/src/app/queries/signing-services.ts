import { queryOptions, useQuery } from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  PaginatedSigningServiceResponseList,
  SigningServiceResponse,
  SigningServicesListData,
} from "@app/client";
import { useApiDomain } from "@app/hooks/useApiDomain";
import type { ListParams } from "./utils/listParams";
import { pulpApiPath, toProxyHref } from "./utils/pulpApi";
import type { IPulpDomain } from "./utils/pulpApi";
import { isEmptyDetailPayload } from "./utils/pulpHref";

export const SigningServicesQueryKey = "signing-services";

export type ISigningServiceListParams = ListParams<SigningServicesListData>;

export const signingServicesRootQueryOptions = queryOptions({
  queryKey: [SigningServicesQueryKey],
  queryFn: async (): Promise<null> => null,
});

export const signingServicesListQueryOptions = (
  domain: IPulpDomain,
  params: ISigningServiceListParams,
) =>
  queryOptions({
    queryKey: [
      ...signingServicesRootQueryOptions.queryKey,
      "list",
      domain,
      params,
    ],
    queryFn: async (): Promise<PaginatedSigningServiceResponseList> => {
      const response =
        await axiosInstance.get<PaginatedSigningServiceResponseList>(
          pulpApiPath("signing-services/", domain),
          {
            params: {
              ...params,
              ordering: params.ordering ? [params.ordering] : undefined,
            },
          },
        );
      return response.data;
    },
  });

export const signingServiceDetailQueryOptions = (href: string) =>
  queryOptions({
    queryKey: [...signingServicesRootQueryOptions.queryKey, "detail", href],
    queryFn: async (): Promise<SigningServiceResponse> => {
      const response = await axiosInstance.get<SigningServiceResponse>(
        toProxyHref(href),
      );
      if (isEmptyDetailPayload(response.data) || !response.data.name) {
        throw new Error("Empty signing service detail response");
      }
      return response.data;
    },
    enabled: !!href,
  });

export const useSigningServicesListQuery = (
  params: ISigningServiceListParams,
) => {
  const domain = useApiDomain();
  return useQuery(signingServicesListQueryOptions(domain, params));
};

export const useSigningServiceDetailQuery = (href: string) => {
  return useQuery(signingServiceDetailQueryOptions(href));
};
