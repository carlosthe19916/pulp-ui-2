---
name: forms
description: Modal form submission errors shown in-form via FormSubmitError + useSubmitError (not a toast); modal closes on success only.
globs: client/src/app/**/*Form.tsx, client/src/app/**/use*Form.tsx, client/src/app/components/PluginForm/**, client/src/app/components/SyncModal.tsx, client/src/app/components/PublishModal.tsx, client/src/app/components/UploadModal.tsx, client/src/app/components/FormSubmitError.tsx, client/src/app/hooks/useSubmitError.ts
---

# Modal form submission-error conventions

**Principle: a modal form's submission failure is shown _in the form_, not as a
toast.** When a create / update / action form inside a modal fails to submit, the
error is rendered as an inline PatternFly `Alert` at the **top of the `<Form>`**
(below the modal header, full form width) — per PatternFly's Form error
guidelines. The modal **stays open** so the user can read the error and retry; the
error is anchored to the form it belongs to instead of a detached, auto-dismissing
toast.

This is the counterpart to `evals/toastr.md`: _success_ toasts and all
list/detail-page error toasts (delete, one-off actions, navigate-away) still go
through `addNotification`. Only the **modal form submission** error moves in-form.

## The building blocks

- **`useSubmitError`** (`client/src/app/hooks/useSubmitError.ts`) — owns the error
  state: `{ submitError, setSubmitError, clearSubmitError }`, where
  `submitError: IMutationErrorMessage | null`.
- **`FormSubmitError`** (`client/src/app/components/FormSubmitError.tsx`) — renders
  nothing when `error` is null, else a `<FormAlert>` wrapping an
  `<Alert variant="danger" isInline aria-live="polite">`. Placed as the **first
  child of `<Form>`**.
- **`getMutationErrorMessage(error, fallback)`** (`client/src/app/utils/utils.ts`)
  — builds the `IMutationErrorMessage` (`{ title, description? }`) from the axios
  error, surfacing Pulp 403 / `detail` / `non_field_errors`. Reused unchanged.

## The pattern

The **form hook** owns the error; the **form component** renders it; the **modal**
threads it between them.

### Form hook (owns the state)

Set the error in the mutation's **`onError`** (replacing the danger toast) and
clear it at the start of each submit. Expose `submitError` from the hook.

```ts
export const useRepositoryForm = ({ ... }): IUseEntityFormResult => {
  const { addNotification } = useNotifications();
  const { submitError, setSubmitError, clearSubmitError } = useSubmitError();

  const createMutation = useRepositoryCreateMutation({
    onSuccess: (data) =>
      addNotification({ title: `Repository "${data.name}" created`, variant: "success" }),
    onError: (error) =>
      setSubmitError(getMutationErrorMessage(error, "Failed to create repository")),
  });
  // update mutation: same shape

  const onSubmit = (values: Record<string, unknown>) => {
    clearSubmitError();
    // …mutate(vars, { onSuccess: () => onClose() })…
  };

  return { onSubmit, isSubmitting, submitError };
};
```

Success still toasts; the call-level `onSuccess: () => onClose()` closes the modal
on success only (so a failure leaves the modal open with the alert showing).

### Form component (renders the alert)

```tsx
<Form id={formId} onSubmit={...}>
  <FormSubmitError error={submitError} />
  {/* fields */}
</Form>
```

`FormSubmitError` is the **first child** of `<Form>`. In the entity wizard it is
rendered only on the final (submitting) step.

### `mutateAsync` modals (Sync / Publish / Upload)

These catch in the component instead of a mutation hook. `clearSubmitError()` at
submit start; in `catch (error)` call
`setSubmitError(getMutationErrorMessage(error, fallback))` **and `return`** so the
modal does **not** close on error; convert guard-clause failures to
`setSubmitError(...)`; clear the error in the close handler.

## Out of scope

Batch/selection modals with partial-success semantics (`AddGroupUserModal`,
`AddGroupRoleModal`, `UserRolesModal`) and delete confirmations
(`ConfirmActionModal`, whose errors are owned by the list page) keep toasts.

## Canonical examples

- Entity framework: `useRepositoryForm.tsx` + `EntityFormBody.tsx` /
  `EntityWizardStep.tsx`.
- Admin: `useUserForm.tsx` + `UserForm.tsx`.
- `mutateAsync` modal: `components/SyncModal.tsx`.

## Checklist

Pass/fail rubric for `/eval`. Check modal create/update/action forms in changed
`*Form.tsx`, `use*Form.tsx`, `PluginForm/**`, and the Sync/Publish/Upload modals.

- [ ] Modal form submission failures are shown in-form via `FormSubmitError` as the
      **first child of `<Form>`**, fed by `useSubmitError` — **not** a danger toast.
- [ ] The form hook sets `submitError` in the mutation `onError` (or the `catch`
      for `mutateAsync` modals) using `getMutationErrorMessage(error, fallback)`.
- [ ] `clearSubmitError()` runs at the start of each submit; the close handler of a
      persistently-mounted modal also clears it.
- [ ] The modal **closes on success only** and stays open on error (success via the
      call-level `onSuccess: onClose`; `mutateAsync` modals `return` after
      `setSubmitError` instead of closing).
- [ ] Success toasts and all list/detail error toasts (delete, one-off actions,
      navigate-away) remain toasts per `evals/toastr.md` — only the modal-form
      submission error moves in-form.
