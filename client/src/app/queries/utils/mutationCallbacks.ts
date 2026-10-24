import type { PulpAxiosError } from "./openapiErrorTypes";

/**
 * Caller-provided, **hook-level** mutation callbacks (see `.rulesync/rules/toastr.md`).
 *
 * Mutation hooks accept this so the triggering page/feature can own the toast
 * message while the callback is wired into `useMutation({ onSuccess, onError })`
 * — i.e. it runs even if the component unmounts mid-request (unlike call-level
 * `mutate(vars, { onSuccess })` callbacks, which are dropped on unmount). The
 * hook keeps its own cache invalidation and appends the caller's `onSuccess`.
 *
 * `TVariables` is only what the request needs; it never carries display-only
 * fields for the caller's message (delete takes the entity itself).
 *
 * `error` is typed `PulpAxiosError` (every hook hits an axios/DRF endpoint); it is
 * still assignable to `getMutationErrorMessage`'s `unknown` parameter, so call sites
 * can feed it straight through.
 */
export interface IMutationCallbacks<
  TData,
  TVariables,
  TError = PulpAxiosError,
> {
  /** May return a promise (e.g. `navigate()`); hooks that clean up after the caller await it. */
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;
  onError?: (error: TError, variables: TVariables) => void;
}
