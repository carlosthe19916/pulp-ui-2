import type React from "react";
import type { UseFormReturn } from "react-hook-form";

import { Form } from "@patternfly/react-core";

import { HookFormPFTextInput } from "@app/components/HookFormPFFields";

import type { GroupFormValues } from "../hooks/useGroupForm";

interface IGroupFormProps {
  form: UseFormReturn<GroupFormValues>;
  onSubmit: () => void;
}

export const GroupForm: React.FC<IGroupFormProps> = ({ form, onSubmit }) => {
  const { control } = form;

  return (
    <Form
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
