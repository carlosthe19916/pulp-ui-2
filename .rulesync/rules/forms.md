---
name: forms
description: "Apply when building a create, edit or action modal form: submission errors appear inside the form (FormSubmitError) so the user can fix and retry, and the modal closes only on success."
root: false
targets: ["claudecode", "cursor"]
globs:
  [
    "client/src/app/**/*Form.tsx",
    "client/src/app/**/use*Form.tsx",
    "client/src/app/**/use*Form.ts",
    "client/src/app/**/*Modal.tsx",
    "client/src/app/components/EntityModalBody/**",
    "client/src/app/components/EntityModalShell.tsx",
    "client/src/app/components/PluginTypeSelector.tsx",
    "client/src/app/utils/formSchema.ts",
    "client/src/app/utils/resourceFilter.ts",
    "client/src/app/components/FormSubmitError.tsx",
    "client/src/app/hooks/useSubmitError.ts",
  ]
---

# Modal form submission-error conventions

**A modal form's submission failure is shown _in the form_, not as a toast.** On
create/update/action failure the error renders as an inline PatternFly `Alert` at the **top of
`<Form>`** and the modal **stays open** for retry. Success toasts and all list/detail error
toasts (delete, one-off actions, navigate-away) stay toasts.

## Building blocks

- **`useSubmitError`** (`hooks/useSubmitError.ts`) — returns `submitError`, `setSubmitError`
  and `clearSubmitError`.
- **`FormSubmitError`** (`components/FormSubmitError.tsx`) — renders the error; **first child
  of `<Form>`**.
- **`getMutationErrorMessage({ error, fallback })`** (`utils/utils.ts`) — builds the message.

## Rules

- The **form hook** owns the error (sets it in the mutation `onError`), the **form component**
  renders it, the **modal** threads it. `TaskActionModal` takes `submitError` as a prop; its
  caller owns `useSubmitError` and the mutation.
- `clearSubmitError()` at the start of each submit; a persistently-mounted modal also clears it
  in its close handler.
- The modal closes **on success only**: call-level `onSuccess: onClose`. `mutateAsync` modals
  (chained requests, or a success message built from the result plus form state)
  `setSubmitError(…)` in `catch` and `return` instead of closing.
- In the entity wizard, the error shows only on the final (submitting) step.
- One `<Entity>Modal` per entity handles create and edit (`entity` prop present = edit); the
  list page keeps one `"create" | Entity | null` state. No separate `Create*` / `Edit*` modals.
- The primary button is `type="submit" form={formId}` with `<Form id={formId}>`, so Enter and
  click share one `onSubmit`.

Out of scope: batch/selection modals with partial success (add several members or roles at
once) and delete confirmations (`ConfirmActionModal`, errors owned by the list page) keep
toasts.

## Checklist

Pass/fail rubric for `/eval`. Check modal create/update/action forms in changed `*Form.tsx`,
`use*Form.ts(x)`, `*Modal.tsx` and `EntityModalBody/**` (skip the out-of-scope batch and
confirmation modals).

- [ ] Modal form submission failures are shown in-form via `FormSubmitError` as the **first
      child of `<Form>`**, fed by `useSubmitError` — **not** a danger toast.
- [ ] The form hook sets `submitError` in the mutation `onError` (or the `catch` for
      `mutateAsync` modals) using `getMutationErrorMessage({ error, fallback })`.
- [ ] `clearSubmitError()` runs at the start of each submit; the close handler of a
      persistently-mounted modal also clears it.
- [ ] The modal **closes on success only** and stays open on error (success via the call-level
      `onSuccess: onClose`; `mutateAsync` modals `return` after `setSubmitError` instead of
      closing).
- [ ] One modal per entity for create and edit; its primary button is
      `type="submit" form={formId}` tied to `<Form id={formId}>`.
- [ ] Success toasts and all list/detail error toasts remain toasts — only the
      modal-form submission error moves in-form.
