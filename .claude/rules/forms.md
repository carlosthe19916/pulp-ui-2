---
paths:
  - client/src/app/forms/**
  - client/src/plugins/*/ui/forms/**
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
distributions and publications ([ADR 0010](../../docs/adr/0010-plugin-form-pages.md)); **modal
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

## Form pages

- `client/src/app/forms/` is the kit (`defineForm`, derivations, `EntityFormPage`) and the
  shared `fragments/`. Each plugin × type form lives in its plugin, `plugins/<id>/ui/forms/`,
  typed from the definition (`remoteForm(rpm.remote["rpm.uln"])(…)`, see [plugins](plugins.md))
  and registered in the plugin's UI. **No generic fallback**: every declared type needs a form.
  A type Pulp creates itself (push repositories) sets `modes: ["edit"]`; publications are
  create-only.
- A definition renders or `omit`s every body key — `tsc` names the uncovered ones. Each `omit`
  entry gets a reason comment. Deprecated fields are omitted.
- Layout is the plugin's: `s.essentials([...])` first (the 3–6 fields that define the object),
  then `s.collapsible(...)` sections, reusing `forms/fragments/` (`authSection`, `tlsSection`,
  `proxySection`, `downloadsSection`, `timeoutsSection`, `labelsField`, …, all from
  `@app/forms/fragments`) where they fit.
- Field kinds carry behaviour, so a definition never hand-writes it: write-only values are
  `secret` (never re-sent unless changed), PEM / YAML / JSON are `code`, lists are `stringList`,
  headers and labels are `keyValue`, pickers are `resource`. Something the kinds can't express
  is a `custom` field. `defineForm` also rejects a kind that can't hold the key's API type.
- Labels are `createOnly`; an existing object's labels change through its labels editor.
- A `resource` picker offers only the types its field's `pulpTypes` lists (`remoteField(f, {
pulpTypes: def.compatibleRemoteTypes })`); the page passes no filter.
- One file per plugin × type in `ui/forms/`: `<entity>.ts` for the plugin's main type,
  `<variant><Entity>.ts` for the others, exporting `<plugin><Variant><Entity>Form`
  (`pushRepository.ts` → `containerPushRepositoryForm`). Shared sections use `SECTION_IDS`.
- The page (`pages/<area>/<entity>/<entity>-create/`, `<entity>-edit/`) owns `useSubmitError`,
  the mutation, the toasts and the navigation, and renders `EntityCreatePage` /
  `EntityEditPage` (`@app/components`), the controlled frames that look up the form and add the
  breadcrumb, Type select, permission gate and running-task notice. `EntityFormPage` builds the
  body (create: non-empty visible values; edit: only the changed fields, an emptied field as its
  clear value, never the whole object).
- A create page takes its Type select, carried-over values and `apiPath` from
  `useCreateTypeSelect` (`@app/hooks`); edit routes take the form from `getEntityForm`
  (`@plugins`) and prime the object fresh.
- An edit page passes `can("change")` and the running task (`useRunningTask`, or
  `useRepositoryActivity` for a repository) to `EntityEditPage`, and toasts the update with
  `notifyUpdateResult` (a task or the updated object).
- The page's `onSubmit` runs the mutation and calls the `saved(href?)` helper from its
  call-level `onSuccess`; the kit lifts the leave prompt and calls `onSaved`, where the page
  navigates (an edit → the detail page; a remote or repository create → its new detail page,
  or the list when the response has no href; a distribution or publication create, which runs as a task → the list). An edit with
  nothing to send calls `onSaved` without a request. Nothing navigates in `onError`.
- `EntityEditPage` renders `UnauthorizedState` instead of the form when
  `useObjectPermissions({ href }).can("change")` is false; lists and detail pages disable Edit
  with `disabledProps("change")`. A create page isn't pre-checked (Pulp exposes no create
  permission).
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

Pass/fail rubric for `/eval`. Check changed `forms/**`, `plugins/*/ui/forms/**`, `*-create/**`,
`*-edit/**`, `*Form.tsx`, `use*Form.ts(x)` and `*Modal.tsx` (skip the out-of-scope batch and
confirmation modals).

- [ ] Submission failures are shown in-form via `FormSubmitError` as the **first child of
      `<Form>`**, fed by `useSubmitError` and `getMutationErrorMessage` — **not** a danger
      toast; `clearSubmitError()` runs at the start of each submit.
- [ ] The primary button is `type="submit" form={formId}` tied to `<Form id={formId}>`.
- [ ] Repository, remote, distribution and publication create/edit is a form page: one form
      per plugin × type in `plugins/<id>/ui/forms/`, registered in the plugin's UI, no generic
      fallback, no wizard and no modal.
- [ ] Forms are typed from the plugin's definition (`remoteForm(…)` and siblings), compile
      with no uncovered keys, and give each `omit` entry a reason.
- [ ] Write-only fields are `secret`; PEM, YAML and JSON are `code`; labels are `createOnly`.
- [ ] A form page navigates away only through `onSaved`, reached by calling `saved()` from the
      mutation's call-level `onSuccess`; edit sends the derived diff, never the whole object.
- [ ] A modal **closes on success only** (call-level `onSuccess: onClose`; `mutateAsync` modals
      `return` after `setSubmitError`), and a modal edit sends a cleared field as its empty value.
- [ ] Success toasts and all list/detail error toasts remain toasts.
