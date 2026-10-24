import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  AsyncOperationResponse,
  ExportersCorePulpListData,
  PaginatedPulpExporterResponseList,
  PaginatedPulpExportResponseList,
  PulpExporterResponse,
} from "@app/client";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";

import { taskKeys } from "./tasks";
import type { ListParams } from "./utils/listParams";
import type { IMutationCallbacks } from "./utils/mutationCallbacks";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import type { IPulpDomain } from "./utils/pulpApi";
import { pulpApiPath, toProxyHref } from "./utils/pulpApi";

export const ExportersQueryKey = "exporters";

/** Pulp and filesystem exporters share the base fields; extras ride along. */
export type Exporter = Pick<
  PulpExporterResponse,
  "pulp_href" | "pulp_created" | "name" | "path"
> &
  Record<string, unknown>;

export type IExporterListParams = ListParams<ExportersCorePulpListData>;

export const exporterKeys = {
  all: () => [ExportersQueryKey] as const,
  list: () => [...exporterKeys.all(), "list"] as const,
  detail: (href: string) => [...exporterKeys.all(), "detail", href] as const,
  exports: (href: string) => [...exporterKeys.detail(href), "exports"] as const,
  listQuery: (
    domain: IPulpDomain,
    apiPath: string,
    params: IExporterListParams,
  ) => [...exporterKeys.list(), domain, apiPath, params] as const,
};

/** One exporter type's list (`exporters/<apiPath>/`; there is no aggregate). */
export const exportersListQueryOptions = ({
  domain,
  apiPath,
  params,
}: {
  domain: IPulpDomain;
  apiPath: string;
  params: IExporterListParams;
}) =>
  queryOptions<PaginatedPulpExporterResponseList, DrfAxiosError>({
    queryKey: exporterKeys.listQuery(domain, apiPath, params),
    queryFn: async () =>
      (
        await axiosInstance.get<PaginatedPulpExporterResponseList>(
          pulpApiPath(`exporters/${apiPath}/`, domain),
          {
            params: {
              ...params,
              ordering: params.ordering ? [params.ordering] : undefined,
            },
          },
        )
      ).data,
  });

export const useExportersListQuery = ({
  apiPath,
  params,
}: {
  apiPath: string;
  params: IExporterListParams;
}) => {
  const domain = useSelectedDomain();
  return useQuery(exportersListQueryOptions({ domain, apiPath, params }));
};

/** An exporter's past exports, newest first. */
export const exportsListQueryOptions = ({ href }: { href: string }) =>
  queryOptions<PaginatedPulpExportResponseList, DrfAxiosError>({
    queryKey: exporterKeys.exports(href),
    queryFn: async () =>
      (
        await axiosInstance.get<PaginatedPulpExportResponseList>(
          `${toProxyHref(href)}exports/`,
          { params: { limit: 20 } },
        )
      ).data,
  });

export const useExportsListQuery = ({ href }: { href: string }) =>
  useQuery(exportsListQueryOptions({ href }));

export const useExporterCreateMutation = (
  options?: IMutationCallbacks<
    Exporter,
    { apiPath: string; body: Record<string, unknown> }
  >,
) => {
  const domain = useSelectedDomain();
  const queryClient = useQueryClient();
  return useMutation<
    Exporter,
    DrfAxiosError,
    { apiPath: string; body: Record<string, unknown> }
  >({
    mutationFn: async ({ apiPath, body }) =>
      (
        await axiosInstance.post<Exporter>(
          pulpApiPath(`exporters/${apiPath}/`, domain),
          body,
        )
      ).data,
    onSuccess: (data, vars) => {
      void queryClient.invalidateQueries({ queryKey: exporterKeys.list() });
      options?.onSuccess?.(data, vars);
    },
    onError: options?.onError,
  });
};

/** Pulp answers with the exporter or, when it must, a task. */
export const useExporterUpdateMutation = (
  options?: IMutationCallbacks<
    Exporter | AsyncOperationResponse,
    { href: string; body: Record<string, unknown> }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    Exporter | AsyncOperationResponse,
    DrfAxiosError,
    { href: string; body: Record<string, unknown> }
  >({
    mutationFn: async ({ href, body }) =>
      (
        await axiosInstance.patch<Exporter | AsyncOperationResponse>(
          toProxyHref(href),
          body,
        )
      ).data,
    onSuccess: (data, vars) => {
      void queryClient.invalidateQueries({ queryKey: exporterKeys.list() });
      options?.onSuccess?.(data, vars);
    },
    onError: options?.onError,
  });
};

export const useExporterDeleteMutation = (
  options?: IMutationCallbacks<AsyncOperationResponse, Exporter>,
) => {
  const queryClient = useQueryClient();
  return useMutation<AsyncOperationResponse, DrfAxiosError, Exporter>({
    mutationFn: async (exporter) =>
      (
        await axiosInstance.delete<AsyncOperationResponse>(
          toProxyHref(exporter.pulp_href ?? ""),
        )
      ).data,
    onSuccess: (data, exporter) => {
      void queryClient.invalidateQueries({ queryKey: exporterKeys.list() });
      void queryClient.invalidateQueries({ queryKey: taskKeys.list() });
      options?.onSuccess?.(data, exporter);
    },
    onError: options?.onError,
  });
};

/** Runs an export (`{exporter}exports/`); starts a task. */
export const useExportMutation = (
  options?: IMutationCallbacks<
    AsyncOperationResponse,
    { href: string; body: Record<string, unknown> }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    AsyncOperationResponse,
    DrfAxiosError,
    { href: string; body: Record<string, unknown> }
  >({
    mutationFn: async ({ href, body }) =>
      (
        await axiosInstance.post<AsyncOperationResponse>(
          `${toProxyHref(href)}exports/`,
          body,
        )
      ).data,
    onSuccess: (data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: exporterKeys.exports(vars.href),
      });
      void queryClient.invalidateQueries({ queryKey: taskKeys.list() });
      options?.onSuccess?.(data, vars);
    },
    onError: options?.onError,
  });
};
