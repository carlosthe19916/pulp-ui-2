import { queryOptions } from "@tanstack/react-query";

import { axiosInstance } from "@app/axios-config/apiInit";
import type { PulpEndpoint } from "@app/client/pulpEndpoints.gen";
import type { DrfAxiosError } from "@app/queries/utils/openapiErrorTypes";
import {
  type IPulpDomain,
  pulpApiPath,
  pulpRootApiPath,
  toProxyHref,
} from "@app/queries/utils/pulpApi";

import { ENDPOINT_INDEX } from "./endpointIndex.gen";

export type ApiParams = Record<string, string | number | boolean>;

/** Rows per read when the model doesn't ask; enough to answer, small enough to send. */
const DEFAULT_LIMIT = 20;
/** The most rows one read returns; the model pages with `offset` for more. */
const MAX_LIMIT = 100;

const SAFE_PATH = /^\/?[\w\-./]+$/;

const OUTSIDE_DOMAIN = new Set(
  ENDPOINT_INDEX.filter((entry) => entry[3]).map((entry) => entry[0]),
);

/**
 * The URL a model-given path reads: an endpoint relative to `api/v3/`, or a `pulp_href`.
 * Anything else (absolute URLs, `..`, a query string) is refused.
 */
export const resolveApiUrl = ({
  path,
  domain,
}: {
  path: string;
  domain: IPulpDomain;
}): string | undefined => {
  const trimmed = path.trim();
  if (!SAFE_PATH.test(trimmed) || trimmed.includes("..")) return undefined;
  const withSlash = trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
  if (withSlash.startsWith("/")) {
    const href = toProxyHref(withSlash);
    return /^\/api\/pulp\/(?:[\w-]+\/)?api\/v3\//.test(href) ? href : undefined;
  }
  return OUTSIDE_DOMAIN.has(withSlash)
    ? pulpRootApiPath(withSlash as Parameters<typeof pulpRootApiPath>[0])
    : pulpApiPath(withSlash as PulpEndpoint, domain);
};

/** The model's params, with the page size capped. */
export const boundedParams = (params: ApiParams = {}): ApiParams => ({
  ...params,
  limit: Math.min(Number(params.limit) || DEFAULT_LIMIT, MAX_LIMIT),
});

/** One GET of the Pulp API as the signed-in user, shared by the tool and its card. */
export const pulpGetQueryOptions = ({
  url,
  params,
}: {
  url: string;
  params: ApiParams;
}) =>
  queryOptions<unknown, DrfAxiosError>({
    queryKey: ["ai-pulp-get", url, params],
    queryFn: async () => (await axiosInstance.get(url, { params })).data,
    retry: false,
  });

/** Pulp's paginated list shape. */
export interface IPage {
  count: number;
  next?: string | null;
  results: Record<string, unknown>[];
}

export const isPage = (value: unknown): value is IPage =>
  typeof value === "object" &&
  value !== null &&
  "results" in value &&
  Array.isArray((value as IPage).results);
