---
name: toastr
description: Mutation toast placement — raised at the page/feature layer via hook-level onSuccess/onError, hooks own invalidation only, mutate over mutateAsync, no useMutationAction wrapper.
globs: client/src/app/queries/**, client/src/app/pages/**, client/src/app/components/SyncModal.tsx, client/src/app/components/PublishModal.tsx
---

# Notification / toast conventions

**Mutation toasts are defined at the page/feature layer, never hidden in a shared
wrapper.** Query/mutation hooks own **cache invalidation only**; the page/feature
that triggers the mutation owns the message and passes it as **hook-level**
`onSuccess`/`onError` into the mutation hook. (TanStack maintainer default,
[TkDodo _Mastering Mutations_](https://tkdodo.eu/blog/mastering-mutations-in-react-query):
message-free reusable hooks, `mutate` + callbacks over `mutateAsync` + try/catch.)

> No `useMutationAction`/`runAction` wrapper, and no general per-feature
> `useXActions` toast-hub for standard create/update/delete. Batch/selection
> modals (`AddGroupUserModal`, `AddUserGroupModal`, `AddRoleAssignmentModal`)
> follow the same rules; their mutation returns an
> `IBatchResult` and the hook-level `onSuccess` reports it with
> `notifyBatchResult` (one success toast + one naming what failed).

## Hook-level callbacks, and `mutate` not `mutateAsync`

Requirement: **toasts must fire even if the component unmounts mid-request**
(modal closed / navigated away before settle).

- **Hook-level** callbacks (`useMutation({ onSuccess, onError })`) **always run**,
  even after unmount → toasts go here.
- **Call-level** callbacks (`mutate(vars, { onSuccess })`) are **dropped on
  unmount** → use only for UI fine to skip on leave (close dialog, reset state).
- `mutate` can't produce an unhandled rejection (RQ `.catch(noop)` internally);
  `mutateAsync` can → reserved for the exception below.

Mutation hooks accept `IMutationCallbacks<TData, TVars>`
(`queries/utils/mutationCallbacks.ts`) and wire them **after** invalidation:

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

- **delete** → the list page instantiates the delete mutation with toast
  callbacks; `handleDelete` fires `mutate(vars, { onSuccess: closeDialog })`.
- **create / update** → the feature form hook (`useXForm`) instantiates the
  mutations; `onSubmit` fires `mutate(vars, { onSuccess: onClose })`;
  `isSubmitting = createMutation.isPending || updateMutation.isPending`. Success
  toasts from the hook-level `onSuccess`; **failure is shown in-form, not toasted**
  — see `evals/forms.md`.
- **one-off actions** (cancel, purge) → the handler fires
  `mutate(vars, { onSettled: closeDialog })`.

List `handleDelete` example (`RemoteList.tsx` + `useRemoteDeleteMutation`):

```ts
const deleteMutation = useRemoteDeleteMutation({
  onSuccess: (data, { name }) =>
    notifyTaskStarted({
      addNotification,
      taskHref: data.task,
      title: `Remote "${name}" deletion started`,
    }),
  onError: (error, { name }) =>
    addNotification({
      ...getMutationErrorMessage({
        error,
        fallback: `Failed to delete remote "${name}"`,
      }),
      variant: "danger",
    }),
});
const handleDelete = () => {
  if (!target?.pulp_href) return;
  deleteMutation.mutate(
    { href: target.pulp_href, name: target.name ?? "" },
    { onSuccess: () => setDeleteTarget(null) }, // close on success; stay open on error
  );
};
```

## Build the message from `variables` (and `data`)

Hook-level callbacks are defined at render, before the target is known, so it
can't be closed over (stale risk) — it flows through mutation **variables**:

- **delete** vars `{ href, name }`; **update** `{ href, name, body }` — the extra
  `name` is the display label. **Distribution create** also carries `name` (its
  202 has no entity).
- **create** callbacks may read the created entity from `data`
  (`data.name`/`data.username`).
- **Error** toasts reuse `getMutationErrorMessage({ error, fallback })` spread into a
  `variant: "danger"` toast — **except** modal form submissions, which show the
  error in-form (`evals/forms.md`).

## Dialog behaviour (canonical home)

Delete/submit dialogs **close on success, stay open on error** — the error toast
(or in-form alert) explains it; the dialog stays for retry. Close via the
**call-level** `onSuccess`; **never** in `onError`.

## The `mutateAsync` exception

Keep `mutateAsync` + try/catch only when you need the promise to compose a side
effect:

- One-off modals building the **success** message from the resolved result plus
  local form state — `SyncModal`, `PublishModal`: raise
  `notifyTaskStarted` before `onClose`; a **failure is shown in-form** (`catch` →
  `setSubmitError`, see `evals/forms.md`), not toasted.
- Detail-page cancel — `TaskDetail` (cancels then **closes the cancel modal**,
  stays on page), raising the toast **before** the close.

Detail-page **delete** needs no exception: `UserDetail` / `GroupDetail` pass the
toast **and** the `navigate()` in the hook-level `onSuccess` and call plain
`mutate` (on error the dialog simply stays open). They **return** the
`navigate()` promise: the delete hook awaits it before dropping the deleted
record from the cache, so the still-mounted page never refetches a 404.

Invalidation stays in the mutation hook regardless.

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
- [ ] Uses `mutate`, not `mutateAsync` — except the documented cases
      (resolved-result-plus-form-state modals; detail-page cancel), which
      raise the toast **before** the close.
- [ ] Message is built from mutation **`variables`** (and `data` for create), not a
      closed-over component value; delete vars `{ href, name }`, update
      `{ href, name, body }`.
- [ ] Error toasts use `getMutationErrorMessage({ error, fallback })` with
      `variant: "danger"` — **except modal create/update/action form submissions**,
      shown in-form via `FormSubmitError` (see `evals/forms.md`).
- [ ] No `useMutationAction` / `runAction` wrapper and no general per-feature
      `useXActions` toast-hub reintroduced (batch/selection modals excepted).
