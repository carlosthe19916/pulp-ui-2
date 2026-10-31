import type { UseQueryOptions } from "@tanstack/react-query";
import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  ContentMavenPackageListData,
  MavenPathIndexStatusResponse,
  MavenRepositoryMetricsResponse,
  PaginatedmavenMavenPackageResponseList,
  PaginatedMavenRepositoryPackageListResponse,
  RepositoriesMavenMavenMetricsData,
  RepositoriesMavenMavenPackagesData,
} from "@app/client";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { getContentType } from "@catalog";

import { contentKeys } from "./content";
import { repositoryKeys } from "./repositories";
import type { MultiOrderListParams } from "./utils/listParams";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import type { IPulpDomain } from "./utils/pulpApi";
import { pulpApiPath, toProxyHref } from "./utils/pulpApi";

/**
 * Params for a Maven repository's `packages/` catalog. Its `ordering` takes several
 * fields (`group_id,artifact_id`), so the spec's array form is kept.
 */
export type IMavenPackagesListParams =
  MultiOrderListParams<RepositoriesMavenMavenPackagesData>;

/** Params for a Maven repository's `metrics/` (not a paged list). */
export type IMavenMetricsParams = NonNullable<
  RepositoriesMavenMavenMetricsData["query"]
>;

/**
 * Maven repository sub-resources, nested under the repository's detail key so a sync or
 * action that invalidates the repository refreshes them.
 */
export const mavenRepositoryKeys = {
  packages: (repositoryHref: string) =>
    [...repositoryKeys.detail(repositoryHref), "packages"] as const,
  metrics: (repositoryHref: string) =>
    [...repositoryKeys.detail(repositoryHref), "metrics"] as const,
  pathIndexStatus: (repositoryHref: string) =>
    [...repositoryKeys.detail(repositoryHref), "path_index_status"] as const,

  packagesQuery: (repositoryHref: string, params: IMavenPackagesListParams) =>
    [...mavenRepositoryKeys.packages(repositoryHref), params] as const,
  metricsQuery: (repositoryHref: string, params: IMavenMetricsParams) =>
    [...mavenRepositoryKeys.metrics(repositoryHref), params] as const,
};

/** One row per groupId:artifactId in a repository version (`packages/`). */
export const mavenPackagesListQueryOptions = ({
  repositoryHref,
  params,
  options,
}: {
  repositoryHref: string;
  params: IMavenPackagesListParams;
  options?: Omit<
    UseQueryOptions<PaginatedMavenRepositoryPackageListResponse, DrfAxiosError>,
    "queryKey" | "queryFn"
  >;
}) =>
  queryOptions<PaginatedMavenRepositoryPackageListResponse, DrfAxiosError>({
    ...options,
    queryKey: mavenRepositoryKeys.packagesQuery(repositoryHref, params),
    queryFn: async (): Promise<PaginatedMavenRepositoryPackageListResponse> =>
      (
        await axiosInstance.get<PaginatedMavenRepositoryPackageListResponse>(
          `${toProxyHref(repositoryHref)}packages/`,
          { params },
        )
      ).data,
  });

export const useMavenPackagesListQuery = ({
  repositoryHref,
  params,
}: {
  repositoryHref: string;
  params: IMavenPackagesListParams;
}) =>
  useQuery({
    ...mavenPackagesListQueryOptions({ repositoryHref, params }),
    enabled: !!repositoryHref,
  });

/** Package / version / build counts of a repository version (`metrics/`). */
export const mavenMetricsQueryOptions = ({
  repositoryHref,
  params,
  options,
}: {
  repositoryHref: string;
  params: IMavenMetricsParams;
  options?: Omit<
    UseQueryOptions<MavenRepositoryMetricsResponse, DrfAxiosError>,
    "queryKey" | "queryFn"
  >;
}) =>
  queryOptions<MavenRepositoryMetricsResponse, DrfAxiosError>({
    ...options,
    queryKey: mavenRepositoryKeys.metricsQuery(repositoryHref, params),
    queryFn: async (): Promise<MavenRepositoryMetricsResponse> =>
      (
        await axiosInstance.get<MavenRepositoryMetricsResponse>(
          `${toProxyHref(repositoryHref)}metrics/`,
          { params },
        )
      ).data,
  });

export const useMavenMetricsQuery = ({
  repositoryHref,
  params,
}: {
  repositoryHref: string;
  params: IMavenMetricsParams;
}) =>
  useQuery({
    ...mavenMetricsQueryOptions({ repositoryHref, params }),
    enabled: !!repositoryHref,
  });

/** The state of a repository's path index (`path_index_status/`). */
export const mavenPathIndexStatusQueryOptions = ({
  repositoryHref,
  options,
}: {
  repositoryHref: string;
  options?: Omit<
    UseQueryOptions<MavenPathIndexStatusResponse, DrfAxiosError>,
    "queryKey" | "queryFn"
  >;
}) =>
  queryOptions<MavenPathIndexStatusResponse, DrfAxiosError>({
    ...options,
    queryKey: mavenRepositoryKeys.pathIndexStatus(repositoryHref),
    queryFn: async (): Promise<MavenPathIndexStatusResponse> =>
      (
        await axiosInstance.get<MavenPathIndexStatusResponse>(
          `${toProxyHref(repositoryHref)}path_index_status/`,
        )
      ).data,
  });

export const useMavenPathIndexStatusQuery = ({
  repositoryHref,
}: {
  repositoryHref: string;
}) =>
  useQuery({
    ...mavenPathIndexStatusQueryOptions({ repositoryHref }),
    enabled: !!repositoryHref,
  });

/** One MavenPackage in a repository version: the GAV is unique there. */
export type IMavenPackageGav = Required<
  Pick<
    NonNullable<ContentMavenPackageListData["query"]>,
    "repository_version" | "group_id" | "artifact_id" | "version"
  >
>;

/**
 * The `pulp_href` of the MavenPackage a `packages/` row version stands for (`packages/`
 * rows aren't content), or `null` when there's none. The GAV filter matches at most one
 * unit, so the request sends no `limit`.
 */
export const mavenPackageHrefQueryOptions = ({
  domain,
  gav,
}: {
  domain: IPulpDomain;
  gav: IMavenPackageGav;
}) =>
  queryOptions<string | null, DrfAxiosError>({
    queryKey: [
      ...contentKeys.typeListQuery(domain, "maven.package", gav),
      "href",
    ],
    queryFn: async (): Promise<string | null> => {
      const { data } =
        await axiosInstance.get<PaginatedmavenMavenPackageResponseList>(
          pulpApiPath(
            `content/${getContentType("maven.package")?.apiPath}/`,
            domain,
          ),
          { params: { ...gav, fields: ["pulp_href"] } },
        );
      return data.results[0]?.pulp_href ?? null;
    },
  });

/** Resolves a `packages/` row version to its MavenPackage href on demand (a row click). */
export const useMavenPackageHrefLookup = () => {
  const domain = useSelectedDomain();
  const queryClient = useQueryClient();
  return (gav: IMavenPackageGav) =>
    queryClient.query(mavenPackageHrefQueryOptions({ domain, gav }));
};
