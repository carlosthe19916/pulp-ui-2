import type React from "react";
import type { UseFormReturn } from "react-hook-form";

import { Form } from "@patternfly/react-core";

import { FormSubmitError } from "@app/components/FormSubmitError";
import { HookFormPFTextInput } from "@app/components/HookFormPFTextInput";
import type { IMutationErrorMessage } from "@app/utils/utils";

import type { GroupFormValues } from "./useGroupForm";

interface IGroupFormProps {
  form: UseFormReturn<GroupFormValues>;
  onSubmit: () => void;
  formId: string;
  submitError: IMutationErrorMessage | null;
}

export const GroupForm: React.FC<IGroupFormProps> = ({
  form,
  onSubmit,
  formId,
  submitError,
}) => {
  const { control } = form;

  return (
    <Form
      id={formId}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <FormSubmitError error={submitError} />
      <HookFormPFTextInput
        control={control}
        name="name"
        fieldId="group-name"
        label="Name"
        isRequired
      />
    </Form>
  );
};
