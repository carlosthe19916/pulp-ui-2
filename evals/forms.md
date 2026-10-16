---
name: forms
description: Modal form submission errors shown in-form via FormSubmitError + useSubmitError (not a toast); modal closes on success only.
globs: client/src/app/**/*Form.tsx, client/src/app/**/use*Form.tsx, client/src/app/components/PluginForm/**, client/src/app/components/SyncModal.tsx, client/src/app/components/PublishModal.tsx, client/src/app/components/UploadModal.tsx, client/src/app/components/FormSubmitError.tsx, client/src/app/hooks/useSubmitError.ts
---

# Modal form submission-error conventions

**A modal form's submission failure is shown _in the form_, not as a toast.** On
create/update/action failure, the error renders as an inline PatternFly `Alert` at
the **top of `<Form>`** (first child, full width) per PatternFly Form guidelines;
the modal **stays open** for retry. This is the counterpart to `evals/toastr.md`:
**success** toasts and all list/detail error toasts (delete, one-off actions,
navigate-away) still go through `addNotification` — only the **modal form
submission** error moves in-form.

## Building blocks

- **`useSubmitError`** (`hooks/useSubmitError.ts`) — owns the state:
  `{ submitError, setSubmitError, clearSubmitError }`,
  `submitError: IMutationErrorMessage | null`.
- **`FormSubmitError`** (`components/FormSubmitError.tsx`) — null when `error` is
  null, else `<FormAlert>` wrapping
  `<Alert variant="danger" isInline aria-live="polite">`. **First child of
  `<Form>`.**
- **`getMutationErrorMessage(error, fallback)`** (`utils/utils.ts`) → builds
  `IMutationErrorMessage` (`{ title, description? }`) from the axios error
  (Pulp 403 / `detail` / `non_field_errors`). Reused unchanged.

## Pattern

The **form hook** owns the error; the **form component** renders it; the **modal**
threads it. Set the error in the mutation `onError` (replacing the danger toast)
and `clearSubmitError()` at the start of each submit. Success still toasts; the
modal closes **on success only** (close-on-success rule: `evals/toastr.md`).

```ts
// form hook — useRepositoryForm.tsx (pages/content-management/repositories/...)
const { submitError, setSubmitError, clearSubmitError } = useSubmitError();

const createMutation = useRepositoryCreateMutation({
  onSuccess: (data) =>
    addNotification({
      title: `Repository "${data.name}" created`,
      variant: "success",
    }),
  onError: (error) =>
    setSubmitError(
      getMutationErrorMessage(error, "Failed to create repository"),
    ),
});
// update mutation: same shape

const onSubmit = (values: Record<string, unknown>) => {
  clearSubmitError();
  // …mutate(vars, { onSuccess: () => onClose() })…   // close on success only
};
return { onSubmit, isSubmitting, submitError };
```

```tsx
// form component — UserForm.tsx (pages/admin/users/...)
<Form id={formId} onSubmit={...}>
  <FormSubmitError error={submitError} />   {/* first child */}
  {/* fields */}
</Form>
```

In the entity wizard, `FormSubmitError` renders only on the final (submitting)
step (`EntityWizardStep` fed `isLast ? submitError : null`).

### `mutateAsync` modals (Sync / Publish / Upload)

These catch in the component (not a mutation hook). `clearSubmitError()` at submit
start; in `catch (error)` call `setSubmitError(getMutationErrorMessage(error,
fallback))` **and `return`** so the modal does **not** close; convert guard-clause
failures to `setSubmitError(...)`; clear the error in the close handler. (Why
`mutateAsync` here: `evals/toastr.md`.)

## Out of scope

Batch/selection modals with partial-success semantics (`AddGroupUserModal`,
`AddGroupRoleModal`, `UserRolesModal`) and delete confirmations
(`ConfirmActionModal`, errors owned by the list page) keep toasts.

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
