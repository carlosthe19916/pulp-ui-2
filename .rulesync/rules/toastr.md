---
name: toastr
description: Mutation toast placement — raised at the page/feature layer via hook-level onSuccess/onError, hooks own invalidation only, mutate over mutateAsync, no useMutationAction wrapper.
implements: docs/adr/0008-async-task-feedback.md
root: false
targets: ["claudecode", "cursor"]
globs:
  [
    "client/src/app/queries/**",
    "client/src/app/pages/**",
    "client/src/app/components/**",
  ]
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
  options?: IMutationCallbacks<AsyncOperationResponse, GenericRemoteResponse>,
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (remote: GenericRemoteResponse) =>
      (
        await axiosInstance.delete<AsyncOperationResponse>(
          toProxyHref(remote.pulp_href ?? ""),
        )
      ).data,
    onSuccess: (data, remote) => {
      void queryClient.invalidateQueries({ queryKey: remoteKeys.list() });
      /* …other invalidations… */
      options?.onSuccess?.(data, remote);
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
  — see `.rulesync/rules/forms.md`.
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
    target,
    { onSuccess: () => setDeleteTarget(null) }, // close on success; stay open on error
  );
};
```

## Variables are the request's input — never a UI-only field

A mutation hook's variables are **exactly what the request needs**, expressed as
domain values. A hook never declares a field it doesn't use (no `name`/`roleName`
"for the caller's toast"). The page builds the message from, in order:

1. **`data`** — the returned entity (create; sync update of users/groups/roles):
   `data.name` / `data.username`.
2. **`variables`** — when the call targets an entity the caller holds, the variable
   **is that entity** and the hook reads `pulp_href` from it: delete takes the row
   (`mutate(remote)`), membership remove takes `{ user, group }`, role-assignment
   delete takes `{ kind, href, assignment }`. Request bodies count too
   (distribution create / domain update read `body.name`).
   The entity is typed with the generated `*Response` (`RepositoryResponse`,
   `GroupResponse`, …): it is the only generated type for an _existing_ resource.
   The non-Response types (`Repository`, `Group`) are write bodies without
   `pulp_href`, and distributions/publications/remotes have no plugin-neutral
   one at all.
3. **Closure over values fixed for the component's lifetime** — the form hook's
   `entity` prop (async 202 updates: remotes/repositories/distributions), a tab's
   or modal's owner (`name` prop in `RoleAssignmentsTab`, `group` in
   `AddGroupUserModal`).

**Never close over per-call state** (`deleteTarget`, a selected row): while a
mutation is pending, every re-render replaces its hook-level callbacks with the
latest render's (`MutationObserver.setOptions`), so a target cleared mid-flight
would be read as `null`. Per-call identity rides in `variables`.

- **Error** toasts reuse `getMutationErrorMessage({ error, fallback })` spread into a
  `variant: "danger"` toast — **except** modal form submissions, which show the
  error in-form (`.rulesync/rules/forms.md`).

## Dialog behaviour (canonical home)

Delete/submit dialogs **close on success, stay open on error** — the error toast
(or in-form alert) explains it; the dialog stays for retry. Close via the
**call-level** `onSuccess`; **never** in `onError`.

## The `mutateAsync` exception

Keep `mutateAsync` + try/catch only when you need the promise to compose a side
effect:

- **Chained requests**, where one call's result feeds the next — `OstreeImportModal`
  (artifact upload → `import_all/`), `useUploadQueue` (chunked upload → content
  create).
- One-off modals building the **success** message from the resolved result plus
  local form state — `PublishModal`, `AddToRepositoryModal`: raise
  `notifyTaskStarted` before `onClose`; a **failure is shown in-form** (`catch` →
  `setSubmitError`, see `.rulesync/rules/forms.md`), not toasted.
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
- [ ] Uses `mutate`, not `mutateAsync` — except the documented cases (chained
      requests; resolved-result-plus-form-state modals; detail-page cancel), which
      raise the toast **before** the close.
- [ ] Mutation variables carry only what the request needs — no display-only
      fields; delete takes the entity itself, update `{ href, body }`.
- [ ] Message is built from `data`, the `variables` (entity/body), or a value fixed
      for the component's lifetime — never closed-over per-call state.
- [ ] Error toasts use `getMutationErrorMessage({ error, fallback })` with
      `variant: "danger"` — **except modal create/update/action form submissions**,
      shown in-form via `FormSubmitError` (see `.rulesync/rules/forms.md`).
- [ ] No `useMutationAction` / `runAction` wrapper and no general per-feature
      `useXActions` toast-hub reintroduced (batch/selection modals excepted).
