import { queryOptions } from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";

import type { DrfAxiosError } from "./utils/openapiErrorTypes";
import { pulpRootApiPath } from "./utils/pulpApi";

export const ApiSpecQueryKey = "api-spec";

export interface IApiParameter {
  name: string;
  in: string;
  description?: string;
  schema?: { enum?: string[]; items?: { enum?: string[] } };
}

/** The part of an OpenAPI document the web terminal reads. */
export interface IApiSpec {
  paths: Record<
    string,
    Partial<Record<string, { parameters?: IApiParameter[] }>>
  >;
}

/**
 * The server's OpenAPI document for one installed component (`core`, `rpm`…), so it
 * matches the plugins that server runs. The whole document is megabytes; one component
 * is a fraction of that.
 */
export const apiSpecQueryOptions = (component: string) =>
  queryOptions<IApiSpec, DrfAxiosError>({
    queryKey: [ApiSpecQueryKey, component],
    queryFn: async () =>
      (
        await axiosInstance.get<IApiSpec>(pulpRootApiPath("docs/api.json"), {
          params: { component },
        })
      ).data,
    staleTime: Infinity,
  });
