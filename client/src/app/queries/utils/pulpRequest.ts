import type { AxiosRequestConfig, AxiosResponse } from "axios";

import { axiosInstance } from "@app/axios-config/apiInit";
import type {
  PulpEndpoint,
  PulpEndpoints,
} from "@app/client/pulpEndpoints.gen";

import { type IPulpDomain, pulpApiPath } from "./pulpApi";

type Method = "get" | "post";

/** The endpoints that take a method. */
type PulpEndpointWith<M extends Method> = {
  [E in PulpEndpoint]: M extends keyof PulpEndpoints[E] ? E : never;
}[PulpEndpoint];

type Operation<
  E extends PulpEndpoint,
  M extends Method,
> = M extends keyof PulpEndpoints[E] ? PulpEndpoints[E][M] : never;

/** The query params an endpoint takes, as the spec declares them. */
type PulpQuery<E extends PulpEndpoint> =
  Operation<E, "get"> extends { data: { query?: infer Q } } ? Q : never;

/** What an endpoint answers, as the spec declares it (every status, e.g. `200 | 202`). */
type PulpResponse<E extends PulpEndpoint, M extends Method> =
  Operation<E, M> extends { responses: infer R } ? R[keyof R] : never;

/** The request body an endpoint takes, as the spec declares it. */
type PulpRequestBody<E extends PulpEndpoint, M extends Method> =
  Operation<E, M> extends { data: { body?: infer B } } ? B : never;

/** GET a domain-scoped endpoint; its params and response are typed from the spec. */
export const pulpGet = <E extends PulpEndpointWith<"get">>({
  endpoint,
  domain,
  params,
}: {
  endpoint: E;
  domain: IPulpDomain;
  params?: PulpQuery<E>;
}): Promise<AxiosResponse<PulpResponse<E, "get">>> =>
  axiosInstance.get(pulpApiPath(endpoint, domain), { params });

/**
 * POST to a domain-scoped endpoint; body and response are typed from the spec. `FormData` is
 * for multipart uploads (`artifacts/`), whose generated body type is a plain object.
 */
export const pulpPost = <E extends PulpEndpointWith<"post">>({
  endpoint,
  domain,
  body,
  config,
}: {
  endpoint: E;
  domain: IPulpDomain;
  body: PulpRequestBody<E, "post"> | FormData;
  config?: AxiosRequestConfig;
}): Promise<AxiosResponse<PulpResponse<E, "post">>> =>
  axiosInstance.post(pulpApiPath(endpoint, domain), body, config);
