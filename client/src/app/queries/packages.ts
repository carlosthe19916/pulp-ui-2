import type {
  HubRequestParams,
  UniquePackageMetadataResponse,
  UniquePackageResponse,
} from "@app/api/models";
import { client } from "@app/axios-config/apiInit";
import {
  apiPypiPypiRead,
  apiPypiSimpleRead,
  contentPythonPackagesList,
  contentPythonPackagesRead,
} from "@app/client";
import { PULP_DOMAIN } from "@app/Constants";
import { useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { mockQueryFn } from "./helpers";
import {
  packageMock,
  packagesMock,
  uniquePackageMock,
  uniquePackagesMock,
} from "./mocks/packages.mock";

export const UniquePackagesQueryKey = "unique-packages";
export const PackagesQueryKey = "packages";

export const useFetchUniquePackages = (
  args: { distributionPath: string },
  disableQuery = false,
) => {
  const { distributionPath } = args;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [UniquePackagesQueryKey, distributionPath],
    queryFn: () =>
      mockQueryFn(async () => {
        const response = await apiPypiSimpleRead({
          client,
          path: {
            pulp_domain: PULP_DOMAIN,
            path: distributionPath,
          },
          headers: {
            Accept: "application/vnd.pypi.simple.v1+json",
          },
          maxRedirects: 0,
        });
        return response.data as UniquePackageResponse;
      }, uniquePackagesMock),
    enabled: !disableQuery,
  });

  return {
    packages: data?.projects || [],
    isFetching: isLoading,
    fetchError: error as AxiosError | null,
    refetch,
  };
};

export const useFetchUniquePackageMetadata = (
  args: {
    distributionPath: string;
    packageName: string;
    packageVersion?: string;
  },
  disableQuery = false,
) => {
  const { distributionPath, packageName, packageVersion } = args;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      UniquePackagesQueryKey,
      distributionPath,
      packageName,
      packageVersion,
    ],
    queryFn: () =>
      mockQueryFn(async () => {
        const response = await apiPypiPypiRead({
          client,
          path: {
            pulp_domain: PULP_DOMAIN,
            path: distributionPath,
            // `meta` must be a path in form of `{package}/json/` or `{package}/{version}/json/`
            meta: !packageVersion
              ? `${packageName}/json`
              : `${packageName}/${packageVersion}/json`,
          },
        });
        return response.data as UniquePackageMetadataResponse;
      }, uniquePackageMock),
    enabled: !disableQuery,
  });

  return {
    pkg: data,
    isFetching: isLoading,
    fetchError: error as AxiosError | null,
    refetch,
  };
};

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
            pulp_domain: PULP_DOMAIN,
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
