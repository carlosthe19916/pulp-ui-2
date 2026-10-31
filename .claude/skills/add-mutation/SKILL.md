---
name: add-mutation
description: >-
  Use when adding or changing a TanStack Query mutation (useMutation) for a
  create, update, delete or one-off action (sync, cancel, purge, publish) — the
  mutation hook in client/src/app/queries plus the page, form hook or modal that
  calls it. Shows where cache invalidation, the success/error toast, the in-form
  error and the dialog close go, with templates.
---

# Add a TanStack mutation

Constraints: `.rulesync/rules/toastr.md` (toasts, callbacks, `mutate` vs `mutateAsync`) and
`.rulesync/rules/forms.md` (in-form submission errors), realising
`docs/adr/0006-async-task-feedback.md`. Read them first; this skill shows how. The snippets
use a made-up `widget` resource.

## Where each piece goes

| Action                                 | Instantiates the mutation (toasts here)    | Fires it                                                  | Error shown                          |
| :------------------------------------- | :----------------------------------------- | :-------------------------------------------------------- | :----------------------------------- |
| Delete from a list                     | the list page                              | `handleDelete`: `mutate(row, { onSuccess: closeDialog })` | danger toast                         |
| Delete from a detail page              | the detail page                            | `mutate(entity)`; toast + `navigate()` in hook-level      | danger toast                         |
| Create / update in a modal             | the feature form hook (`useWidgetForm`)    | `onSubmit`: `mutate(vars, { onSuccess: onClose })`        | in-form (`FormSubmitError`)          |
| Create / update on a form page         | the create/edit page (`RemoteCreate`, …)   | `onSubmit`: `mutate(vars, { onSuccess: () => saved() })`  | in-form via `EntityFormPage`         |
| Action modal with fields (sync, …)     | the wrapper that renders `TaskActionModal` | `mutate(vars, { onSuccess: onClose })`                    | in-form via `TaskActionModal`        |
| One-off action (cancel, purge)         | the page/component with the handler        | `mutate(vars, { onSettled: closeDialog })`                | danger toast                         |
| Chained or result-built success (rare) | the component, `mutateAsync` + try/catch   | toast **before** `onClose`                                | in-form (`catch` → `setSubmitError`) |

A 202 response (task) toasts with `notifyTaskStarted({ addNotification, taskHref, title })`;
a sync response toasts the entity (`addNotification({ title, variant: "success" })`).

## 1. Mutation hook (`queries/<family>.ts`)

Invalidation only; caller callbacks run after it.

```ts
export const useWidgetDeleteMutation = (
  options?: IMutationCallbacks<
    AsyncOperationResponse,
    WidgetResponse,
    DrfAxiosError
  >,
) => {
  const queryClient = useQueryClient();
  return useMutation<AsyncOperationResponse, DrfAxiosError, WidgetResponse>({
    mutationFn: async (widget) =>
      (
        await axiosInstance.delete<AsyncOperationResponse>(
          toProxyHref(widget.pulp_href ?? ""),
        )
      ).data,
    onSuccess: (data, widget) => {
      void queryClient.invalidateQueries({ queryKey: widgetKeys.list() });
      void queryClient.invalidateQueries({
        queryKey: widgetKeys.detail(widget.pulp_href ?? ""),
      });
      options?.onSuccess?.(data, widget);
    },
    onError: options?.onError,
  });
};
```

Variables: the entity for delete, `{ href, body }` for update, the body for create. Type
`TData` from the operation's declared 2xx responses (`.rulesync/rules/queries.md`).

## 2a. List page delete

```ts
const [deleteTarget, setDeleteTarget] = useState<WidgetResponse | null>(null);

const deleteMutation = useWidgetDeleteMutation({
  onSuccess: (data, { name }) =>
    notifyTaskStarted({
      addNotification,
      taskHref: data.task,
      title: `Widget "${name}" deletion started`,
    }),
  onError: (error, { name }) =>
    addNotification({
      ...getMutationErrorMessage({
        error,
        fallback: `Failed to delete widget "${name}"`,
      }),
      variant: "danger",
    }),
});

const handleDelete = () => {
  if (!deleteTarget?.pulp_href) return;
  deleteMutation.mutate(deleteTarget, {
    onSuccess: () => setDeleteTarget(null),
  });
};
```

The message reads `name` from the variables, never from `deleteTarget`.

## 2b. Detail page delete

Toast and `navigate()` both go in the hook-level `onSuccess`, which **returns** the
`navigate()` promise: the delete hook awaits it before dropping the record from the cache, so
the still-mounted page never refetches a 404. On error the dialog simply stays open.

```ts
const deleteMutation = useWidgetDeleteMutation({
  onSuccess: (_data, { name }) => {
    addNotification({ title: `Widget "${name}" deleted`, variant: "success" });
    return navigate({ to: "/widgets" });
  },
  onError: (error, { name }) =>
    addNotification({
      ...getMutationErrorMessage({
        error,
        fallback: `Failed to delete widget "${name}"`,
      }),
      variant: "danger",
    }),
});
// confirm: deleteMutation.mutate(widget);
```

## 2c. Create / update form hook

```ts
export const useWidgetForm = ({
  widget, // present = edit
  onClose,
}: {
  widget?: WidgetResponse;
  onClose: () => void;
}) => {
  const { addNotification } = useNotifications();
  const { submitError, setSubmitError, clearSubmitError } = useSubmitError();

  const createMutation = useWidgetCreateMutation({
    onSuccess: (data) =>
      addNotification({
        title: `Widget "${data.name}" created`,
        variant: "success",
      }),
    onError: (error) =>
      setSubmitError(
        getMutationErrorMessage({ error, fallback: "Failed to create widget" }),
      ),
  });
  // update: same shape; an async (202) update builds its title from the `widget` prop.

  const onSubmit = (values: IWidgetFormValues) => {
    clearSubmitError();
    createMutation.mutate(valuesToBody(values), { onSuccess: onClose });
  };
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  return { onSubmit, isSubmitting, submitError };
};
```

The form renders the error first; the modal's primary button submits it:

```tsx
<Form id={formId} onSubmit={handleSubmit(onSubmit)}>
  <FormSubmitError error={submitError} />
  {/* fields */}
</Form>

<Button type="submit" form={formId} isLoading={isSubmitting}>
  {widget ? "Save" : "Create"}
</Button>
```

## 2d. Action modal with fields

`TaskActionModal` renders the form from field definitions; its wrapper owns the mutation and
the error.

```tsx
export const ResetWidgetModal: React.FC<IResetWidgetModalProps> = ({
  widget,
  onClose,
}) => {
  const { addNotification } = useNotifications();
  const { submitError, setSubmitError, clearSubmitError } = useSubmitError();
  const resetMutation = useWidgetResetMutation({
    onSuccess: (data) =>
      notifyTaskStarted({
        addNotification,
        taskHref: data.task,
        title: `Reset of "${widget.name}" started`,
      }),
    onError: (error) =>
      setSubmitError(
        getMutationErrorMessage({ error, fallback: "Failed to start reset" }),
      ),
  });

  return (
    <TaskActionModal
      title={`Reset widget "${widget.name}"`}
      submitLabel="Reset"
      fields={RESET_FIELDS}
      isSubmitting={resetMutation.isPending}
      submitError={submitError}
      onSubmit={(body) => {
        clearSubmitError();
        resetMutation.mutate(
          { href: widget.pulp_href ?? "", body },
          { onSuccess: onClose },
        );
      }}
      onClose={onClose}
    />
  );
};
```

## 2e. `mutateAsync` modal (the documented exceptions only)

```ts
const onSubmit = async (values: IWidgetPublishValues) => {
  clearSubmitError();
  if (!values.source) {
    setSubmitError({ title: "Pick a source first" });
    return;
  }
  try {
    const result = await publishMutation.mutateAsync({
      body: valuesToBody(values),
    });
    notifyTaskStarted({
      addNotification,
      taskHref: result.task,
      title: `Publication of "${sourceLabel}" started`, // result + local form state
    });
    onClose(); // toast first, then close
  } catch (error) {
    setSubmitError(
      getMutationErrorMessage({ error, fallback: "Failed to publish" }),
    );
    return; // stay open
  }
};
const handleClose = () => {
  clearSubmitError();
  onClose();
};
```

## Batch / selection modals

When one submit sends several requests (add several members at once), the mutation returns an
`IBatchResult`; the hook-level `onSuccess` calls `notifyBatchResult` (one success toast plus one
naming what failed). They keep toasts, not in-form errors.
