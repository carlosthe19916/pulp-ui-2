import type { UseQueryOptions } from "@tanstack/react-query";
import { queryOptions, useQuery } from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  PaginatedSigningServiceResponseList,
  SigningServiceResponse,
  SigningServicesListData,
} from "@app/client";
import { useDefaultDomain } from "@app/hooks/useDefaultDomain";

import type { ListParams } from "./utils/listParams";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import type { IPulpDomain } from "./utils/pulpApi";
import { pulpApiPath, toProxyHref } from "./utils/pulpApi";

export const SigningServicesQueryKey = "signing-services";

export type ISigningServiceListParams = ListParams<SigningServicesListData>;

/**
 * Query-key factory mirroring the REST paths; identifying segments precede params so a
 * prefix invalidates all variants.
 */
export const signingServiceKeys = {
  all: () => [SigningServicesQueryKey] as const,
  list: () => [...signingServiceKeys.all(), "list"] as const,
  detail: (href: string) =>
    [...signingServiceKeys.all(), "detail", href] as const,

  listQuery: (domain: IPulpDomain, params: ISigningServiceListParams) =>
    [...signingServiceKeys.list(), domain, params] as const,
};

type SigningServiceListOptions = Omit<
  UseQueryOptions<PaginatedSigningServiceResponseList, DrfAxiosError>,
  "queryKey" | "queryFn"
>;

export const signingServicesListQueryOptions = ({
  domain,
  params,
  options,
}: {
  domain: IPulpDomain;
  params: ISigningServiceListParams;
  options?: SigningServiceListOptions;
}) =>
  queryOptions<PaginatedSigningServiceResponseList, DrfAxiosError>({
    ...options,
    queryKey: signingServiceKeys.listQuery(domain, params),
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

export const signingServiceDetailQueryOptions = ({
  href,
  options,
}: {
  href: string;
  options?: Omit<
    UseQueryOptions<SigningServiceResponse, DrfAxiosError>,
    "queryKey" | "queryFn"
  >;
}) =>
  queryOptions<SigningServiceResponse, DrfAxiosError>({
    ...options,
    queryKey: signingServiceKeys.detail(href),
    queryFn: async (): Promise<SigningServiceResponse> => {
      const response = await axiosInstance.get<SigningServiceResponse>(
        toProxyHref(href),
      );
      return response.data;
    },
  });

export const useSigningServicesListQuery = ({
  params,
  options,
}: {
  params: ISigningServiceListParams;
  options?: SigningServiceListOptions;
}) => {
  const domain = useDefaultDomain();
  return useQuery(signingServicesListQueryOptions({ domain, params, options }));
};

export const useSigningServiceDetailQuery = ({ href }: { href: string }) =>
  useQuery({
    ...signingServiceDetailQueryOptions({ href }),
    enabled: !!href,
  });
