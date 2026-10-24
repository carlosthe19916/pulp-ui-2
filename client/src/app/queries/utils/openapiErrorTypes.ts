import type { AxiosError } from "axios";

import type { TaskResponse } from "@app/client";

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
 * DRF validation error body (400): field to messages (nested serializers nest), plus
 * `non_field_errors` and a scalar `detail`.
 */
export interface IDrfValidationErrorData {
  detail?: string | string[] | IDrfValidationErrorData;
  non_field_errors?: string[];
  [field: string]: string | string[] | IDrfValidationErrorData | undefined;
}

/**
 * `errors[]` envelope of pulp_container `/v2/` and pulp_ansible Galaxy v3. Not reachable
 * from the current `queries/` hooks; kept for completeness.
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
 * `{ error, detail? }` from custom plugin views (maven, npm, trustify, pulp-service). Not
 * reachable from the current `queries/` hooks.
 */
export interface IPluginErrorData {
  error: string;
  detail?: string;
}

/**
 * Any Pulp API error body. A 400 may be a bare array, and a non-JSON body arrives as a
 * plain string.
 */
export type PulpErrorData =
  | IDrfValidationErrorData
  | IErrorsEnvelopeData
  | IPluginErrorData
  | Array<string | IDrfValidationErrorData>
  | string;

/**
 * Pulp's fatal-task error (`TaskResponse.error`). The spec types it as an untyped
 * `object`, so the generated client drops it.
 */
export interface ITaskErrorData {
  /** Set (with `traceback`) for a crashed task. */
  description?: string;
  traceback?: string;
  /** Set for a cancellation. */
  reason?: string;
  [key: string]: unknown;
}

/**
 * `TaskResponse` augmented with the `error` field the generated client omits (see
 * `ITaskErrorData`). Use when reading a task's failure detail.
 */
export type TaskWithError = TaskResponse & { error?: ITaskErrorData | null };

/**
 * Error type for standard Pulp v3 DRF endpoints: the `TError` of every query/mutation in
 * `queries/`.
 */
export type DrfAxiosError = AxiosError<IDrfValidationErrorData>;

/**
 * The widest error type (any shape the API could return), for endpoints whose error shape
 * is unknown; `IMutationCallbacks`' default.
 */
export type PulpAxiosError = AxiosError<PulpErrorData>;
