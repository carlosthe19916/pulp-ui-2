import { queryOptions, useQuery } from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type { ArtifactResponse } from "@app/client";
import { toProxyHref } from "./utils/pulpApi";

export const ArtifactsQueryKey = "artifacts";

export const artifactDetailQueryOptions = (href: string) =>
  queryOptions({
    queryKey: [ArtifactsQueryKey, "detail", href],
    queryFn: async (): Promise<ArtifactResponse> => {
      const response = await axiosInstance.get<ArtifactResponse>(
        toProxyHref(href),
      );
      if (!response.data) {
        throw new Error("Empty artifact detail response");
      }
      return response.data;
    },
    enabled: !!href,
  });

export const useArtifactDetailQuery = (
  href: string,
  options?: { enabled?: boolean },
) => {
  return useQuery({
    ...artifactDetailQueryOptions(href),
    enabled: (options?.enabled ?? true) && !!href,
  });
};
