# Notification / toast conventions

**Principle: mutation toasts are defined at the page/feature layer, never hidden
in a shared wrapper.** Query/mutation hooks own cache invalidation only. The
page/feature that triggers the mutation owns the message, passing it as
**hook-level** `onSuccess`/`onError` callbacks into the mutation hook.

This follows the TanStack Query maintainer's default
([TkDodo, _Mastering Mutations_](https://tkdodo.eu/blog/mastering-mutations-in-react-query)):
keep mutation hooks message-free and reusable, and prefer `mutate` with callbacks
over `mutateAsync` + `try/catch`.

> There is **no** `useMutationAction`/`runAction` wrapper and **no** per-feature
> `useXActions` hub. A helper that both runs the mutation and raises the toast
> hides the notification below the page — do not reintroduce one.

## Why hook-level callbacks (and `mutate`, not `mutateAsync`)

Requirement: **toasts must appear even if the component unmounts mid-request**
(the user closes the modal / navigates away before the request settles).

- **Hook-level** callbacks — passed to `useMutation({ onSuccess, onError })` —
  **always run**, even after unmount. This is where toasts go.
- **Call-level** callbacks — `mutate(vars, { onSuccess })` — are **dropped on
  unmount**. Use them only for UI that is fine to skip when the user leaves:
  closing the dialog / resetting local state.
- `mutate` can't produce an unhandled rejection (RQ does `mutateAsync().catch(noop)`
  internally); `mutateAsync` can, so it is reserved for the exception below.

So: **mutation hooks accept caller callbacks** (`IMutationCallbacks<TData, TVars>`
from `queries/utils/mutationCallbacks.ts`) and wire them into their own
`useMutation`, after the invalidation:

```ts
export const useRemoteDeleteMutation = (
  options?: IMutationCallbacks<
    AsyncOperationResponse,
    { href: string; name: string }
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ href }: { href: string; name: string }) =>
      (await axiosInstance.delete<AsyncOperationResponse>(toProxyHref(href)))
        .data,
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: remoteKeys.list() });
      /* …other invalidations… */
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
};
```

## Where each toast lives

- **delete** → the list page instantiates the delete mutation with the toast
  callbacks; `handleDelete` fires `mutate(vars, { onSuccess: closeDialog })`.
- **create / update** → the feature form hook (`useXForm`) instantiates the
  create/update mutations with the toast callbacks; `onSubmit` fires
  `mutate(vars, { onSuccess: onClose })`. `isSubmitting = createMutation.isPending
|| updateMutation.isPending`.
- **one-off actions** (cancel, purge) → the triggering component's handler fires
  `mutate(vars, { onSettled: closeDialog })`.

List `handleDelete` example:

```ts
const deleteMutation = useRemoteDeleteMutation({
  onSuccess: (data, { name }) =>
    notifyTaskStarted(
      addNotification,
      data.task,
      `Remote "${name}" deletion started`,
    ),
  onError: (error, { name }) =>
    addNotification({
      ...getMutationErrorMessage(error, `Failed to delete remote "${name}"`),
      variant: "danger",
    }),
});
const handleDelete = () => {
  if (!target?.pulp_href) return;
  deleteMutation.mutate(
    { href: target.pulp_href, name: target.name ?? "" },
    { onSuccess: () => setDeleteTarget(null) }, // closes on success; stays open on error
  );
};
```

## Building the message: read from `variables` (and `data`)

Hook-level callbacks are defined at render — before the target entity is known —
so it can't be captured in the closure; it must flow through the mutation
**variables** (closing over component state risks a stale value). Therefore:

- **delete** variables are `{ href, name }` and **update** `{ href, name, body }`
  (not a bare `href`) — the extra `name` is the display label for the message.
  **Distribution create** also carries `name` (its 202 response has no entity).
- **create** callbacks may instead read the created entity from `data`
  (`data.name` / `data.username`), since create returns the entity.
- **Error** callbacks reuse `getMutationErrorMessage(error, fallback)` spread into
  a `variant: "danger"` toast.

## Dialog behaviour

Delete/submit dialogs **close on success, stay open on error** (the error toast
explains the failure; the dialog stays for retry). Close via the **call-level**
`onSuccess`; never in `onError`.

## The `mutateAsync` exception

Two cases keep `mutateAsync` + `try/catch`, raising the toast **before**
`onClose`/navigate so it still survives unmount — the documented use of
`mutateAsync` (you need the promise to compose a side effect):

- One-off modals that build the message from the **resolved result plus local
  form state** — `SyncModal`, `PublishModal`, `UploadModal`.
- Detail-page delete/cancel that **navigate away** afterward — `GroupDetail`,
  `TaskDetail`.

Keep invalidation in the mutation hook regardless.

## Canonical examples

- List delete: `RemoteList.tsx` + `useRemoteDeleteMutation`.
- Form create/update: `useRemoteForm.tsx` + `useRemote{Create,Update}Mutation`.
- `mutateAsync` exception: `components/SyncModal.tsx`.
