---
name: toastr
description: Mutation toast placement — raised at the page/feature layer via hook-level onSuccess/onError, hooks own invalidation only, mutate over mutateAsync, no useMutationAction wrapper.
globs: client/src/app/queries/**, client/src/app/pages/**, client/src/app/components/SyncModal.tsx, client/src/app/components/PublishModal.tsx, client/src/app/components/UploadModal.tsx
---

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
  create/update mutations; `onSubmit` fires `mutate(vars, { onSuccess: onClose })`.
  `isSubmitting = createMutation.isPending || updateMutation.isPending`. The
  **success** toast is raised from the mutation's hook-level `onSuccess`; the
  **failure is shown in-form, not as a toast** — the hook's `onError` calls
  `setSubmitError(getMutationErrorMessage(...))` and the form renders it at the top
  via `FormSubmitError`. See **`evals/forms.md`** for this convention.
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

Two cases keep `mutateAsync` + `try/catch` (you need the promise to compose a
side effect):

- One-off modals that build the **success** message from the resolved result plus
  local form state — `SyncModal`, `PublishModal`, `UploadModal`. They raise the
  success toast (`notifyTaskStarted`) before `onClose`, but a **failure is shown
  in-form** (`setSubmitError` in the `catch`), not toasted — see `evals/forms.md`.
- Detail-page delete/cancel that **navigate away** afterward — `GroupDetail`,
  `TaskDetail`. These raise the toast **before** navigating so it survives unmount.

Keep invalidation in the mutation hook regardless.

## Canonical examples

- List delete: `RemoteList.tsx` + `useRemoteDeleteMutation`.
- Form create/update: `useRemoteForm.tsx` + `useRemote{Create,Update}Mutation`.
- `mutateAsync` exception: `components/SyncModal.tsx`.

## Checklist

Pass/fail rubric for `/eval`.

- [ ] Mutation hooks own **cache invalidation only** — no toast/notification text
      inside the hook.
- [ ] Mutation hooks accept caller callbacks (`IMutationCallbacks<TData, TVars>`)
      and wire them into their own `useMutation` `onSuccess`/`onError`, **after**
      the invalidation.
- [ ] Toasts are raised at the page/feature layer via **hook-level**
      `onSuccess`/`onError` (survives unmount), not call-level.
- [ ] Dialog close / local-state reset uses the **call-level** callback and closes
      **on success only** — never in `onError`.
- [ ] Uses `mutate`, not `mutateAsync` — except the two documented cases
      (resolved-result-plus-form-state modals; detail-page delete/cancel that
      navigate away), which raise the toast **before** close/navigate.
- [ ] Message is built from mutation **`variables`** (and `data` for create), not a
      closed-over component value; delete vars are `{ href, name }`, update
      `{ href, name, body }`.
- [ ] Error toasts use `getMutationErrorMessage(error, fallback)` with
      `variant: "danger"` — **except modal create/update/action form submissions**,
      whose failure is shown in-form via `FormSubmitError`, not toasted (see
      `evals/forms.md`).
- [ ] No `useMutationAction` / `runAction` wrapper and no per-feature `useXActions`
      hub reintroduced.
