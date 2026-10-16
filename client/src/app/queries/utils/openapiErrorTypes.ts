import type { AxiosError } from "axios";

/**
 * Hand-authored error-body types for the Pulp API.
 *
 * The OpenAPI spec documents only success responses, so the generated client
 * (`@app/client`) models no error shapes. These types fill that gap: they describe
 * every JSON error body the backend can return, derived from the pulpcore + plugin
 * source (all stock Django REST Framework — no plugin overrides the global exception
 * handler; a few plugins add view-scoped shapes). Used as the `TError` of every
 * query/mutation hook (`PulpAxiosError`) and consumed by `getMutationErrorMessage`.
 */

/**
 * DRF serializer validation (400): each field maps to a list of messages; nested
 * serializers nest a dict. `non_field_errors` holds object-level errors; `detail`
 * carries a scalar `APIException` message (404/403/401/405/406/415/429/throttle).
 */
export interface IDrfValidationErrorData {
  detail?: string | string[] | IDrfValidationErrorData;
  non_field_errors?: string[];
  [field: string]: string | string[] | IDrfValidationErrorData | undefined;
}

/**
 * `errors[]` envelope used by two view-scoped handlers:
 * - pulp_container `/v2/` registry: `{ code, message, detail? }`.
 * - pulp_ansible Galaxy v3 (JSON:API): `{ status, code, title, detail?, source? }`.
 * Not reachable from the current `queries/` hooks; kept for completeness.
 */
export interface IErrorsEnvelopeData {
  errors: {
    code?: string;
    /** container */
    message?: string;
    /** galaxy v3 */
    title?: string;
    status?: string;
    detail?: string | Record<string, unknown>;
    source?: { parameter?: string };
  }[];
}

/**
 * `{ error }` (+ optional free-form `detail`) returned by custom plugin views
 * (pulp_maven, pulp_npm, pulp_trustify, pulp-service). Not reachable from the
 * current `queries/` hooks; kept for completeness.
 */
export interface IPluginErrorData {
  error: string;
  detail?: string;
}

/**
 * Any error body the Pulp API can return. A 400 may be a bare array (list
 * serializer / bare `ValidationError`); a non-JSON body (e.g. pulp_hugging_face
 * content-proxy) arrives as a plain string.
 */
export type PulpErrorData =
  | IDrfValidationErrorData
  | IErrorsEnvelopeData
  | IPluginErrorData
  | Array<string | IDrfValidationErrorData>
  | string;

/**
 * The error type for a standard Pulp v3 DRF endpoint (validation dict,
 * `non_field_errors`, or a scalar `detail`). This is the granular `TError` for every
 * query/mutation in `queries/` — all of them hit `/pulp/api/v3/…` DRF endpoints.
 */
export type DrfAxiosError = AxiosError<IDrfValidationErrorData>;

/**
 * The widest error type — any shape the API *could* return (incl. non-reachable
 * container/Galaxy/plugin/plain-text bodies). Use only when the endpoint's error
 * shape is genuinely unknown; it is the fallback default of `IMutationCallbacks`.
 */
export type PulpAxiosError = AxiosError<PulpErrorData>;
