import { queryOptions, useQuery } from "@tanstack/react-query";
import type { UseQueryOptions } from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type { ArtifactResponse } from "@app/client";
import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import { toProxyHref } from "./utils/pulpApi";

export const ArtifactsQueryKey = "artifacts";

export const artifactDetailQueryOptions = ({
  href,
  options,
}: {
  href: string;
  options?: Omit<
    UseQueryOptions<ArtifactResponse, DrfAxiosError>,
    "queryKey" | "queryFn"
  >;
}) =>
  queryOptions<ArtifactResponse, DrfAxiosError>({
    ...options,
    queryKey: [ArtifactsQueryKey, "detail", href],
    queryFn: async (): Promise<ArtifactResponse> => {
      const response = await axiosInstance.get<ArtifactResponse>(
        toProxyHref(href),
      );
      return response.data;
    },
  });

export const useArtifactDetailQuery = ({ href }: { href: string }) =>
  useQuery({
    ...artifactDetailQueryOptions({ href }),
    enabled: !!href,
  });
