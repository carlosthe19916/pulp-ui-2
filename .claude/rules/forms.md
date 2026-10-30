---
paths:
  - client/src/app/forms/**
  - client/src/app/pages/**/*-create/**
  - client/src/app/pages/**/*-edit/**
  - client/src/app/**/*Form.tsx
  - client/src/app/**/use*Form.tsx
  - client/src/app/**/use*Form.ts
  - client/src/app/**/*Modal.tsx
  - client/src/app/utils/formSchema.ts
  - client/src/app/utils/resourceFilter.ts
  - client/src/app/components/FormSubmitError.tsx
  - client/src/app/hooks/useSubmitError.ts
---

# Forms

Two kinds of form share one core: **form pages** create and edit repositories, remotes,
distributions and publications ([ADR 0009](../../docs/adr/0009-plugin-form-pages.md)); **modal
forms** run everything else (plugin actions, admin objects, uploads).

## Shared core

**A submission failure is shown _in the form_, not as a toast**: an inline `Alert` at the top of
`<Form>`, and the form stays for retry. Success toasts and list/detail error toasts stay toasts.

- **`useSubmitError`** (`hooks/useSubmitError.ts`) returns `submitError`, `setSubmitError` and
  `clearSubmitError`; **`FormSubmitError`** renders it as the **first child of `<Form>`**;
  **`getMutationErrorMessage({ error, fallback })`** builds the message.
- `clearSubmitError()` runs at the start of each submit.
- The primary button is `type="submit" form={formId}` with `<Form id={formId}>`, so Enter and
  click share one `onSubmit`.

## Form pages (`client/src/app/forms/`)

- Each plugin × entity is one definition, `forms/<entities>/<plugin>.ts`, written with
  `defineForm<<Op>CreateData["body"]>()` and registered by `pulp_type` in its entity's registry
  (`REMOTE_FORMS`, …). **No generic fallback**: a type without an entry can't be created or
  edited. A type that can only be edited (push repositories) registers `modes: ["edit"]`.
- A definition renders or `omit`s every body key — `tsc` names the uncovered ones. Each `omit`
  entry gets a reason comment. Deprecated fields are omitted.
- Layout is the plugin's: `s.essentials([...])` first (the 3–6 fields that define the object),
  then `s.collapsible(...)` sections, reusing `forms/fragments/` (`authSection`, `tlsSection`,
  `proxySection`, `downloadsSection`, `timeoutsSection`, `labelsField`, …) where they fit.
- Field kinds carry behaviour, so a definition never hand-writes it: write-only values are
  `secret` (never re-sent unless changed), PEM / YAML / JSON are `code`, lists are `stringList`,
  headers and labels are `keyValue`, pickers are `resource`. Something the kinds can't express
  is a `custom` field, or a whole-form `override`.
- Labels are `createOnly`; an existing object's labels change through its labels editor.
- The page (`pages/<area>/<entity>/<entity>-create/`, `<entity>-edit/`) owns `useSubmitError`,
  the mutation, the toasts and the navigation; `EntityFormPage` is controlled and builds the
  body (create: non-empty visible values; edit: only the changed fields, an emptied field as its
  clear value, never the whole object).
- On success the page calls `allowLeave()` then navigates in the call-level `onSuccess` (remote,
  repository → detail page; distribution, publication → list). It never navigates in `onError`.
- No wizard; no create/edit modal for these entities.

## Modal forms

- The **form hook** owns the error (sets it in the mutation `onError`), the **form component**
  renders it, the **modal** threads it. `TaskActionModal` takes `submitError` as a prop; its
  caller owns `useSubmitError` and the mutation.
- A persistently-mounted modal also clears the error in its close handler.
- The modal closes **on success only**: call-level `onSuccess: onClose`. `mutateAsync` modals
  (chained requests, or a success message built from the result plus form state)
  `setSubmitError(…)` in `catch` and `return` instead of closing.
- An edit form's values→payload mapping sends a cleared optional field as its empty value so
  the server clears it (`""` for text, `null` for a nullable field); omitting it keeps the old
  value (see [pulp-api](pulp-api.md)). Create may still drop empties.

Out of scope: batch/selection modals with partial success (add several members or roles at
once) and delete confirmations (`ConfirmActionModal`, errors owned by the list page) keep
toasts.

## Checklist

Pass/fail rubric for `/eval`. Check changed `forms/**`, `*-create/**`, `*-edit/**`, `*Form.tsx`,
`use*Form.ts(x)` and `*Modal.tsx` (skip the out-of-scope batch and confirmation modals).

- [ ] Submission failures are shown in-form via `FormSubmitError` as the **first child of
      `<Form>`**, fed by `useSubmitError` and `getMutationErrorMessage` — **not** a danger
      toast; `clearSubmitError()` runs at the start of each submit.
- [ ] The primary button is `type="submit" form={formId}` tied to `<Form id={formId}>`.
- [ ] Repository, remote, distribution and publication create/edit is a form page: one
      `defineForm` definition per plugin × entity, registered by `pulp_type`, no generic
      fallback, no wizard and no modal.
- [ ] Definitions are typed from `<Op>CreateData["body"]`, compile with no uncovered keys, and
      give each `omit` entry a reason.
- [ ] Write-only fields are `secret`; PEM, YAML and JSON are `code`; labels are `createOnly`.
- [ ] A form page navigates away only on success (`allowLeave()` in the call-level
      `onSuccess`); edit sends the derived diff, never the whole object.
- [ ] A modal **closes on success only** (call-level `onSuccess: onClose`; `mutateAsync` modals
      `return` after `setSubmitError`), and a modal edit sends a cleared field as its empty value.
- [ ] Success toasts and all list/detail error toasts remain toasts.
