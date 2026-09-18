import type React from "react";
import type { UseFormReturn } from "react-hook-form";

import { Form } from "@patternfly/react-core";

import { HookFormPFTextInput } from "@app/components/HookFormPFFields";

import type { GroupFormValues } from "../hooks/useGroupForm";

interface IGroupFormProps {
  form: UseFormReturn<GroupFormValues>;
  onSubmit: () => void;
  formId: string;
}

export const GroupForm: React.FC<IGroupFormProps> = ({
  form,
  onSubmit,
  formId,
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
