import type React from "react";
import { useState } from "react";

import {
  FormGroup,
  FormSelect,
  FormSelectOption,
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

import { GUARD_TYPES, guardTypeOf } from "../utils/guardTypes";

/** Creates a guard of a chosen type, or edits one (its type is fixed). */
export const ContentGuardModal: React.FC<{
  /** The full (typed) guard being edited; absent to create. */
  guard?: ContentGuard;
  onClose: () => void;
}> = ({ guard, onClose }) => {
  const { status } = useApiStatus();
  const { addNotification } = useNotifications();
  const { submitError, setSubmitError, clearSubmitError } = useSubmitError();
  const installed = new Set(status?.versions.map((v) => v.component));
  const types = GUARD_TYPES.filter((type) => installed.has(type.component));
  const [pulpType, setPulpType] = useState(() =>
    guard ? guardTypeOf(guard.pulp_href ?? "")?.pulpType : types[0]?.pulpType,
  );
  const guardType = GUARD_TYPES.find((type) => type.pulpType === pulpType);

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
      // A new type is a new form.
      key={guardType.pulpType}
      title={guard ? `Edit guard "${guard.name}"` : "Create content guard"}
      submitLabel={guard ? "Save" : "Create"}
      fields={guardType.fields}
      initialValues={
        guard
          ? buildDefaultValues({ fields: guardType.fields, source: guard })
          : {}
      }
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
          <div>{guardType.description}</div>
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
