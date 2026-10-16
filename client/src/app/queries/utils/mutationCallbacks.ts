/**
 * Caller-provided, **hook-level** mutation callbacks (see `evals/toastr.md`).
 *
 * Mutation hooks accept this so the triggering page/feature can own the toast
 * message while the callback is wired into `useMutation({ onSuccess, onError })`
 * — i.e. it runs even if the component unmounts mid-request (unlike call-level
 * `mutate(vars, { onSuccess })` callbacks, which are dropped on unmount). The
 * hook keeps its own cache invalidation and appends the caller's `onSuccess`.
 *
 * `error` is `unknown` so call sites can feed it straight to
 * `getMutationErrorMessage`.
 */
export interface IMutationCallbacks<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: unknown, variables: TVariables) => void;
}
