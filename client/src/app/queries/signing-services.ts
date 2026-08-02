import { queryOptions, useQuery } from "@tanstack/react-query";

import { client } from "@app/axios-config/apiInit";
import type {
  PaginatedSigningServiceResponseList,
  SigningServiceResponse,
} from "@app/client";
import { signingServicesList, signingServicesRead } from "@app/client";
import { PULP_DOMAIN } from "@app/Constants";

export const SigningServicesQueryKey = "signing-services";

type SigningServiceOrdering = NonNullable<
  Parameters<typeof signingServicesList>[0]["query"]
>["ordering"];

interface SigningServiceListParams {
  limit?: number;
  offset?: number;
  ordering?: NonNullable<SigningServiceOrdering>[number];
  name?: string;
}

export const signingServicesRootQueryOptions = queryOptions({
  queryKey: [SigningServicesQueryKey],
  queryFn: async (): Promise<null> => null,
});

export const signingServicesListQueryOptions = (
  params: SigningServiceListParams = {},
) =>
  queryOptions({
    queryKey: [...signingServicesRootQueryOptions.queryKey, "list", params],
    queryFn: async (): Promise<PaginatedSigningServiceResponseList> => {
      const response = await signingServicesList({
        client,
        path: { pulp_domain: PULP_DOMAIN },
        query: {
          limit: params.limit ?? 20,
          offset: params.offset,
          ordering: params.ordering ? [params.ordering] : undefined,
          name: params.name,
        },
      });
      if (!response.data) {
        throw new Error("Empty signing services list response");
      }
      return response.data;
    },
  });

export const signingServiceDetailQueryOptions = (href: string) =>
  queryOptions({
    queryKey: [...signingServicesRootQueryOptions.queryKey, "detail", href],
    queryFn: async (): Promise<SigningServiceResponse> => {
      const response = await signingServicesRead({
        client,
        path: { signing_service_href: href },
      });
      if (!response.data) {
        throw new Error("Empty signing service detail response");
      }
      return response.data;
    },
    enabled: !!href,
  });

export const useSigningServicesListQuery = (
  params: SigningServiceListParams = {},
) => {
  return useQuery(signingServicesListQueryOptions(params));
};

export const useSigningServiceDetailQuery = (href: string) => {
  return useQuery(signingServiceDetailQueryOptions(href));
};
