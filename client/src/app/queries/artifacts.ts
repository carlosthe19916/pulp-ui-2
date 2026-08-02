import { queryOptions, useQuery } from "@tanstack/react-query";

import { client } from "@app/axios-config/apiInit";
import type { ArtifactResponse } from "@app/client";
import { artifactsRead } from "@app/client";

export const ArtifactsQueryKey = "artifacts";

export const artifactDetailQueryOptions = (href: string) =>
  queryOptions({
    queryKey: [ArtifactsQueryKey, "detail", href],
    queryFn: async (): Promise<ArtifactResponse> => {
      const response = await artifactsRead({
        client,
        path: { artifact_href: href },
      });
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
