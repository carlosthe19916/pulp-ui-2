import type { HubRequestParams } from "@app/api/models";
import { client } from "@app/axios-config/apiInit";
import {
  contentPythonPackagesList,
  contentPythonPackagesRead,
} from "@app/client";
import { useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { mockQueryFn } from "./helpers";
import { packageMock, packagesMock } from "./mocks/packages.mock";

export const PackagesQueryKey = "packages";

export const useFetchPackages = (
  params: HubRequestParams = {},
  disableQuery = false,
) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [PackagesQueryKey, params],
    queryFn: () =>
      mockQueryFn(async () => {
        const response = await contentPythonPackagesList({
          client,
          path: {
            pulp_domain: "default",
          },
        });
        return response.data;
      }, packagesMock),
    enabled: !disableQuery,
  });

  return {
    result: {
      data: data?.results || [],
      total: data?.count ?? 0,
      params: params,
    },
    isFetching: isLoading,
    fetchError: error as AxiosError | null,
    refetch,
  };
};

export const packageByIdQueryOptions = (package_href: string) => ({
  queryKey: [PackagesQueryKey, package_href],
  queryFn: () =>
    mockQueryFn(async () => {
      const response = await contentPythonPackagesRead({
        client,
        path: { python_python_package_content_href: package_href },
      });
      return response.data;
    }, packageMock),
});

export const useFetchPackageById = (id: string) => {
  const { data, isLoading, error } = useQuery(packageByIdQueryOptions(id));
  return {
    pkg: data,
    isFetching: isLoading,
    fetchError: error as AxiosError | null,
  };
};
