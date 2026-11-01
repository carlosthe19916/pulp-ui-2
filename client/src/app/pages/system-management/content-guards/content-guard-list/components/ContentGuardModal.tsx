import type React from "react";
import { useState } from "react";

import {
  FormGroup,
  FormHelperText,
  FormSelect,
  FormSelectOption,
  HelperText,
  HelperTextItem,
} from "@patternfly/react-core";

import { TaskActionModal } from "@app/components/TaskActionModal";
import { useApiStatus } from "@app/hooks/useApiStatus";
import { useNotifications } from "@app/hooks/useNotifications";
import { useSubmitError } from "@app/hooks/useSubmitError";
import {
  type ContentGuard,
  useContentGuardCreateMutation,
  useContentGuardUpdateMutation,
} from "@app/queries/content-guards";
import { buildDefaultValues } from "@app/utils/formSchema";
import { getMutationErrorMessage } from "@app/utils/utils";
import { getContentGuardTypes } from "@plugins";

import { guardTypeOf } from "../utils/guardTypes";

interface IContentGuardModalProps {
  /** The full (typed) guard being edited; absent to create. */
  guard?: ContentGuard;
  onClose: () => void;
}

/** Creates a guard of a chosen type, or edits one (its type is fixed). */
export const ContentGuardModal: React.FC<IContentGuardModalProps> = ({
  guard,
  onClose,
}) => {
  const { plugins } = useApiStatus();
  const { addNotification } = useNotifications();
  const { submitError, setSubmitError, clearSubmitError } = useSubmitError();
  const types = getContentGuardTypes({ installed: plugins });
  const [pulpType, setPulpType] = useState(() =>
    guard ? guardTypeOf(guard.pulp_href ?? "")?.pulpType : types[0]?.pulpType,
  );
  const guardType = getContentGuardTypes().find(
    (type) => type.pulpType === pulpType,
  );

  const onError = (error: unknown) =>
    setSubmitError(
      getMutationErrorMessage({
        error,
        fallback: guard ? "Failed to save guard" : "Failed to create guard",
      }),
    );
  const createMutation = useContentGuardCreateMutation({
    onSuccess: ({ name }) =>
      addNotification({ title: `Guard "${name}" created`, variant: "success" }),
    onError,
  });
  const updateMutation = useContentGuardUpdateMutation({
    onSuccess: ({ name }) =>
      addNotification({ title: `Guard "${name}" saved`, variant: "success" }),
    onError,
  });

  if (!guardType) return null;

  return (
    <TaskActionModal
      title={guard ? `Edit guard "${guard.name}"` : "Create content guard"}
      submitLabel={guard ? "Save" : "Create"}
      fields={guardType.fields}
      initialValues={
        guard
          ? buildDefaultValues({ fields: guardType.fields, source: guard })
          : {}
      }
      // A new type is a new form; the modal and the type select stay put.
      formKey={guardType.pulpType}
      beforeFields={
        <FormGroup label="Type" fieldId="guard-type" isRequired>
          <FormSelect
            id="guard-type"
            value={guardType.pulpType}
            isDisabled={!!guard}
            onChange={(_event, value) => setPulpType(value)}
          >
            {(guard ? [guardType] : types).map((type) => (
              <FormSelectOption
                key={type.pulpType}
                value={type.pulpType}
                label={type.label}
              />
            ))}
          </FormSelect>
          <FormHelperText>
            <HelperText>
              <HelperTextItem>{guardType.description}</HelperTextItem>
            </HelperText>
          </FormHelperText>
        </FormGroup>
      }
      isSubmitting={createMutation.isPending || updateMutation.isPending}
      submitError={submitError}
      onSubmit={(body) => {
        clearSubmitError();
        if (guard) {
          updateMutation.mutate(
            { href: guard.pulp_href ?? "", body },
            { onSuccess: onClose },
          );
        } else {
          createMutation.mutate(
            { apiPath: guardType.apiPath, body },
            { onSuccess: onClose },
          );
        }
      }}
      onClose={onClose}
    />
  );
};
