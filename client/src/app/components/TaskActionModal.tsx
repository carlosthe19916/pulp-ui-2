import type React from "react";
import { useImperativeHandle, useRef } from "react";
import { Controller, useForm } from "react-hook-form";

import { yupResolver } from "@hookform/resolvers/yup";

import {
  Button,
  Content,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@patternfly/react-core";

import type { RepositoryResponse } from "@app/client";
import { ContentPicker } from "@app/components/ContentPicker";
import { EntityFormFields } from "@app/components/EntityFormFields";
import { FormSubmitError } from "@app/components/FormSubmitError";
import type {
  IContentUnitRef,
  IContentUnitSelection,
} from "@app/hooks/useContentUnitSelection";
import type { IEntityField } from "@app/utils/entityField";
import {
  buildDefaultValues,
  buildFieldSchema,
  fieldsToBody,
} from "@app/utils/formSchema";
import type { ResourceFilterMap } from "@app/utils/resourceFilter";
import type { IMutationErrorMessage } from "@app/utils/utils";
import { getContentType, type IContentType } from "@catalog";

interface ITaskActionModalProps {
  title: string;
  description?: React.ReactNode;
  /** Rendered above the fields (e.g. a type select that swaps them); stays mounted. */
  beforeFields?: React.ReactNode;
  /** Changing it starts the fields over without remounting the modal (e.g. a new type). */
  formKey?: string;
  submitLabel: string;
  fields: IEntityField[];
  /** Initial values by field key (e.g. the tag a row action runs on). */
  initialValues?: Record<string, unknown>;
  /** The repository `content` fields pick from (its latest version). */
  repository?: RepositoryResponse;
  resourceFilter?: ResourceFilterMap;
  isSubmitting: boolean;
  submitError: IMutationErrorMessage | null;
  /** The form's values as a request body (see `fieldsToBody`). */
  onSubmit: (body: Record<string, unknown>) => void;
  onClose: () => void;
}

/** A content selection backed by a form value (the picked units). */
const formSelection = ({
  value,
  onChange,
}: {
  value: IContentUnitRef[];
  onChange: (units: IContentUnitRef[]) => void;
}): IContentUnitSelection => ({
  selected: value,
  isSelected: (href) => value.some((unit) => unit.href === href),
  setUnits: ({ units, isSelecting }) => {
    const rest = value.filter(
      (unit) => !units.some((changed) => changed.href === unit.href),
    );
    onChange(isSelecting ? [...rest, ...units] : rest);
  },
  clear: () => onChange([]),
});

interface ITaskActionFieldsHandle {
  submit: () => void;
}

interface ITaskActionFieldsProps {
  ref: React.Ref<ITaskActionFieldsHandle>;
  fields: IEntityField[];
  initialValues?: Record<string, unknown>;
  repository?: RepositoryResponse;
  resourceFilter?: ResourceFilterMap;
  onSubmit: (body: Record<string, unknown>) => void;
}

/** The form state and fields; keyed by the modal so a new field set starts clean. */
const TaskActionFields: React.FC<ITaskActionFieldsProps> = ({
  ref,
  fields,
  initialValues,
  repository,
  resourceFilter,
  onSubmit,
}) => {
  const { control, handleSubmit } = useForm<Record<string, unknown>>({
    resolver: yupResolver(buildFieldSchema(fields)),
    defaultValues: { ...buildDefaultValues({ fields }), ...initialValues },
    mode: "onChange",
  });
  useImperativeHandle(ref, () => ({
    submit: () =>
      void handleSubmit((values) =>
        onSubmit(fieldsToBody({ fields, values })),
      )(),
  }));
  const contentFields = fields.filter((field) => field.type === "content");

  return (
    <>
      <EntityFormFields
        fields={fields}
        control={control}
        idPrefix="task-action"
        resourceFilter={resourceFilter}
      />
      {repository &&
        contentFields.map((field) => {
          if (field.type !== "content") return null;
          const contentTypes = field.pulpTypes
            .map((pulpType) => getContentType(pulpType))
            .filter((type): type is IContentType => !!type?.apiPath);
          return (
            <Controller
              key={field.key}
              name={field.key}
              control={control}
              render={({ field: rhfField, fieldState: { error } }) => (
                <FormGroup
                  label={field.label}
                  fieldId={`task-action-${field.key}`}
                  isRequired={field.required}
                >
                  <ContentPicker
                    contentTypes={contentTypes}
                    sourceVersionHref={
                      repository.latest_version_href ?? undefined
                    }
                    repositoryName={repository.name}
                    selection={formSelection({
                      value: (rhfField.value as IContentUnitRef[]) ?? [],
                      onChange: rhfField.onChange,
                    })}
                  />
                  {error && (
                    <FormHelperText>
                      <HelperText>
                        <HelperTextItem variant="error">
                          {error.message}
                        </HelperTextItem>
                      </HelperText>
                    </FormHelperText>
                  )}
                </FormGroup>
              )}
            />
          );
        })}
    </>
  );
};

/**
 * Form shell for task-starting actions (sync, sign, copy…) and simple field-driven forms;
 * submit hands the body to the caller. Mount only while open.
 */
export const TaskActionModal: React.FC<ITaskActionModalProps> = ({
  title,
  description,
  beforeFields,
  formKey,
  submitLabel,
  fields,
  initialValues,
  repository,
  resourceFilter,
  isSubmitting,
  submitError,
  onSubmit,
  onClose,
}) => {
  const fieldsRef = useRef<ITaskActionFieldsHandle>(null);
  const hasContentField = fields.some((field) => field.type === "content");

  return (
    <Modal
      isOpen
      onClose={onClose}
      variant={hasContentField ? "large" : "small"}
    >
      <ModalHeader title={title} />
      <ModalBody>
        <Form
          id="task-action-form"
          onSubmit={(event) => {
            event.preventDefault();
            fieldsRef.current?.submit();
          }}
        >
          <FormSubmitError error={submitError} />
          {description ? <Content component="p">{description}</Content> : null}
          {beforeFields}
          <TaskActionFields
            key={formKey}
            ref={fieldsRef}
            fields={fields}
            initialValues={initialValues}
            repository={repository}
            resourceFilter={resourceFilter}
            onSubmit={onSubmit}
          />
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          type="submit"
          form="task-action-form"
          isLoading={isSubmitting}
          isDisabled={isSubmitting}
        >
          {submitLabel}
        </Button>
        <Button variant="link" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};
