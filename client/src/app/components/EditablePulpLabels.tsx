import type React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { yupResolver } from "@hookform/resolvers/yup";
import type { QueryKey } from "@tanstack/react-query";
import * as yup from "yup";

import {
  Button,
  Form,
  Label,
  LabelGroup,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@patternfly/react-core";

import { FormSubmitError } from "@app/components/FormSubmitError";
import { HookFormPFTextInput } from "@app/components/HookFormPFTextInput";
import { useNotifications } from "@app/hooks/useNotifications";
import { useSubmitError } from "@app/hooks/useSubmitError";
import {
  useSetLabelMutation,
  useUnsetLabelMutation,
} from "@app/queries/labels";
import { getMutationErrorMessage } from "@app/utils/utils";

interface IEditablePulpLabelsProps {
  /** The labelled resource. */
  href: string;
  labels?: Record<string, string | null>;
  /** The resource's detail query key, refreshed after a change. */
  invalidateKey: QueryKey;
  /** Shown read-only (e.g. no permission or a running task). */
  isDisabled?: boolean;
}

/**
 * A resource's labels with inline editing: add, edit (click a label) and remove,
 * each a synchronous `set_label/` / `unset_label/` call.
 */
export const EditablePulpLabels: React.FC<IEditablePulpLabelsProps> = ({
  href,
  labels,
  invalidateKey,
  isDisabled,
}) => {
  const { addNotification } = useNotifications();
  // `null` closed, `""` adding, otherwise the key being edited.
  const [editing, setEditing] = useState<string | null>(null);
  const unsetMutation = useUnsetLabelMutation({
    invalidateKey,
    onSuccess: (_data, { key }) =>
      addNotification({ title: `Label "${key}" removed`, variant: "success" }),
    onError: (error) =>
      addNotification({
        variant: "danger",
        ...getMutationErrorMessage({
          error,
          fallback: "Failed to remove label",
        }),
      }),
  });
  const entries = Object.entries(labels ?? {});

  return (
    <>
      <LabelGroup
        numLabels={8}
        isCompact
        addLabelControl={
          isDisabled ? undefined : (
            <Label variant="add" isCompact onClick={() => setEditing("")}>
              Add label
            </Label>
          )
        }
      >
        {entries.map(([key, value]) => (
          <Label
            key={key}
            isCompact
            onClick={isDisabled ? undefined : () => setEditing(key)}
            onClose={
              isDisabled ? undefined : () => unsetMutation.mutate({ href, key })
            }
            closeBtnAriaLabel={`Remove label ${key}`}
          >
            {value == null ? key : `${key}: ${value}`}
          </Label>
        ))}
      </LabelGroup>
      {entries.length === 0 && isDisabled ? "—" : null}
      {editing !== null && (
        <LabelModal
          href={href}
          labelKey={editing}
          value={editing ? (labels?.[editing] ?? "") : ""}
          invalidateKey={invalidateKey}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
};

const labelSchema = yup.object({
  key: yup
    .string()
    .required("Key is required")
    .matches(/^[\w.-]+$/, "Use letters, digits, '_', '-' or '.'"),
  value: yup.string().default(""),
});

type LabelFormValues = yup.InferType<typeof labelSchema>;

interface ILabelModalProps {
  href: string;
  /** Empty when adding a label. */
  labelKey: string;
  value: string;
  invalidateKey: QueryKey;
  onClose: () => void;
}

const LabelModal: React.FC<ILabelModalProps> = ({
  href,
  labelKey,
  value,
  invalidateKey,
  onClose,
}) => {
  const { addNotification } = useNotifications();
  const { submitError, setSubmitError, clearSubmitError } = useSubmitError();
  const { control, handleSubmit } = useForm<LabelFormValues>({
    resolver: yupResolver(labelSchema),
    defaultValues: { key: labelKey, value },
  });
  const setMutation = useSetLabelMutation({
    invalidateKey,
    onSuccess: (_data, vars) =>
      addNotification({
        title: `Label "${vars.key}" saved`,
        variant: "success",
      }),
    onError: (error) =>
      setSubmitError(
        getMutationErrorMessage({ error, fallback: "Failed to save label" }),
      ),
  });

  return (
    <Modal isOpen onClose={onClose} variant="small">
      <ModalHeader title={labelKey ? "Edit label" : "Add label"} />
      <ModalBody>
        <Form
          id="label-form"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit((values) => {
              clearSubmitError();
              setMutation.mutate(
                { href, key: values.key, value: values.value || null },
                { onSuccess: onClose },
              );
            })();
          }}
        >
          <FormSubmitError error={submitError} />
          <HookFormPFTextInput
            control={control}
            name="key"
            label="Key"
            fieldId="label-key"
            isRequired
            isDisabled={!!labelKey}
          />
          <HookFormPFTextInput
            control={control}
            name="value"
            label="Value"
            fieldId="label-value"
          />
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          type="submit"
          form="label-form"
          isLoading={setMutation.isPending}
          isDisabled={setMutation.isPending}
        >
          Save
        </Button>
        <Button variant="link" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};
