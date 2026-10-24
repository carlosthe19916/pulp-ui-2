import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  PaginatedVulnerabilityReportResponseList,
  VulnerabilityReportResponse,
  VulnReportListData,
} from "@app/client";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";

import type { ListParams } from "./utils/listParams";
import type { IMutationCallbacks } from "./utils/mutationCallbacks";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import type { IPulpDomain } from "./utils/pulpApi";
import { pulpApiPath, toProxyHref } from "./utils/pulpApi";

export const VulnReportsQueryKey = "vuln-reports";

export type IVulnReportListParams = ListParams<VulnReportListData>;

export const vulnReportKeys = {
  all: () => [VulnReportsQueryKey] as const,
  list: () => [...vulnReportKeys.all(), "list"] as const,
  listQuery: (domain: IPulpDomain, params: IVulnReportListParams) =>
    [...vulnReportKeys.list(), domain, params] as const,
};

export const vulnReportsListQueryOptions = ({
  domain,
  params,
}: {
  domain: IPulpDomain;
  params: IVulnReportListParams;
}) =>
  queryOptions<PaginatedVulnerabilityReportResponseList, DrfAxiosError>({
    queryKey: vulnReportKeys.listQuery(domain, params),
    queryFn: async () =>
      (
        await axiosInstance.get<PaginatedVulnerabilityReportResponseList>(
          pulpApiPath("vuln_report/", domain),
          {
            params: {
              ...params,
              ordering: params.ordering ? [params.ordering] : undefined,
            },
          },
        )
      ).data,
  });

export const useVulnReportsListQuery = ({
  params,
}: {
  params: IVulnReportListParams;
}) => {
  const domain = useSelectedDomain();
  return useQuery(vulnReportsListQueryOptions({ domain, params }));
};

export const useVulnReportDeleteMutation = (
  options?: IMutationCallbacks<void, VulnerabilityReportResponse>,
) => {
  const queryClient = useQueryClient();
  return useMutation<void, DrfAxiosError, VulnerabilityReportResponse>({
    mutationFn: async (report) => {
      await axiosInstance.delete(toProxyHref(report.pulp_href ?? ""));
    },
    onSuccess: (data, report) => {
      void queryClient.invalidateQueries({ queryKey: vulnReportKeys.list() });
      options?.onSuccess?.(data, report);
    },
    onError: options?.onError,
  });
};
