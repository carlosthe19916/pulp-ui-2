import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  ImportersCorePulpListData,
  ImportResponse,
  PaginatedImportResponseList,
  PaginatedPulpImporterResponseList,
  PulpImportCheckResponse,
  PulpImporterResponse,
} from "@app/client";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { taskKeys } from "./tasks";
import type { ListParams } from "./utils/listParams";
import type { IMutationCallbacks } from "./utils/mutationCallbacks";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import { pulpApiPath, toProxyHref } from "./utils/pulpApi";
import type { IPulpDomain } from "./utils/pulpApi";

export const ImportersQueryKey = "importers";

export type IImporterListParams = ListParams<ImportersCorePulpListData>;

export const importerKeys = {
  all: () => [ImportersQueryKey] as const,
  list: () => [...importerKeys.all(), "list"] as const,
  detail: (href: string) => [...importerKeys.all(), "detail", href] as const,
  imports: (href: string) => [...importerKeys.detail(href), "imports"] as const,
  listQuery: (domain: IPulpDomain, params: IImporterListParams) =>
    [...importerKeys.list(), domain, params] as const,
};

export const importersListQueryOptions = ({
  domain,
  params,
}: {
  domain: IPulpDomain;
  params: IImporterListParams;
}) =>
  queryOptions<PaginatedPulpImporterResponseList, DrfAxiosError>({
    queryKey: importerKeys.listQuery(domain, params),
    queryFn: async () =>
      (
        await axiosInstance.get<PaginatedPulpImporterResponseList>(
          pulpApiPath("importers/core/pulp/", domain),
          {
            params: {
              ...params,
              ordering: params.ordering ? [params.ordering] : undefined,
            },
          },
        )
      ).data,
  });

export const useImportersListQuery = ({
  params,
}: {
  params: IImporterListParams;
}) => {
  const domain = useSelectedDomain();
  return useQuery(importersListQueryOptions({ domain, params }));
};

/** An importer's past imports. */
export const importsListQueryOptions = ({ href }: { href: string }) =>
  queryOptions<PaginatedImportResponseList, DrfAxiosError>({
    queryKey: importerKeys.imports(href),
    queryFn: async () =>
      (
        await axiosInstance.get<PaginatedImportResponseList>(
          `${toProxyHref(href)}imports/`,
          { params: { limit: 20 } },
        )
      ).data,
  });

export const useImportsListQuery = ({ href }: { href: string }) =>
  useQuery(importsListQueryOptions({ href }));

export const useImporterCreateMutation = (
  options?: IMutationCallbacks<PulpImporterResponse, Record<string, unknown>>,
) => {
  const domain = useSelectedDomain();
  const queryClient = useQueryClient();
  return useMutation<
    PulpImporterResponse,
    DrfAxiosError,
    Record<string, unknown>
  >({
    mutationFn: async (body) =>
      (
        await axiosInstance.post<PulpImporterResponse>(
          pulpApiPath("importers/core/pulp/", domain),
          body,
        )
      ).data,
    onSuccess: (data, body) => {
      void queryClient.invalidateQueries({ queryKey: importerKeys.list() });
      options?.onSuccess?.(data, body);
    },
    onError: options?.onError,
  });
};

export const useImporterUpdateMutation = (
  options?: IMutationCallbacks<
    PulpImporterResponse,
    { href: string; body: Record<string, unknown> }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    PulpImporterResponse,
    DrfAxiosError,
    { href: string; body: Record<string, unknown> }
  >({
    mutationFn: async ({ href, body }) =>
      (await axiosInstance.patch<PulpImporterResponse>(toProxyHref(href), body))
        .data,
    onSuccess: (data, vars) => {
      void queryClient.invalidateQueries({ queryKey: importerKeys.list() });
      options?.onSuccess?.(data, vars);
    },
    onError: options?.onError,
  });
};

export const useImporterDeleteMutation = (
  options?: IMutationCallbacks<void, PulpImporterResponse>,
) => {
  const queryClient = useQueryClient();
  return useMutation<void, DrfAxiosError, PulpImporterResponse>({
    mutationFn: async (importer) => {
      await axiosInstance.delete(toProxyHref(importer.pulp_href ?? ""));
    },
    onSuccess: (data, importer) => {
      void queryClient.invalidateQueries({ queryKey: importerKeys.list() });
      options?.onSuccess?.(data, importer);
    },
    onError: options?.onError,
  });
};

/** Runs an import (`{importer}imports/`); starts a task. */
export const useImportMutation = (
  options?: IMutationCallbacks<
    ImportResponse,
    { href: string; body: Record<string, unknown> }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation<
    ImportResponse,
    DrfAxiosError,
    { href: string; body: Record<string, unknown> }
  >({
    mutationFn: async ({ href, body }) =>
      (
        await axiosInstance.post<ImportResponse>(
          `${toProxyHref(href)}imports/`,
          body,
        )
      ).data,
    onSuccess: (data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: importerKeys.imports(vars.href),
      });
      void queryClient.invalidateQueries({ queryKey: taskKeys.list() });
      options?.onSuccess?.(data, vars);
    },
    onError: options?.onError,
  });
};

/** Checks an export's files before importing (synchronous, no task). */
export const useImportCheckMutation = (
  options?: IMutationCallbacks<
    PulpImportCheckResponse,
    Record<string, unknown>
  >,
) => {
  const domain = useSelectedDomain();
  return useMutation<
    PulpImportCheckResponse,
    DrfAxiosError,
    Record<string, unknown>
  >({
    mutationFn: async (body) =>
      (
        await axiosInstance.post<PulpImportCheckResponse>(
          pulpApiPath("importers/core/pulp/import-check/", domain),
          body,
        )
      ).data,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  });
};
