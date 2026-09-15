import { useForm, type UseFormReturn } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import type { Group } from "@app/client";

import { useGroupActions } from "./useGroupActions";

export type GroupFormValues = {
  name: string;
};

const groupSchema = yup.object({
  name: yup.string().default("").required("Name is required"),
});

/** Maps form values to the create (POST) payload. */
export const valuesToNewGroup = (values: GroupFormValues): Group => ({
  name: values.name,
});

interface IUseGroupFormArgs {
  onClose: () => void;
}

interface IUseGroupFormResult {
  form: UseFormReturn<GroupFormValues>;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export const useGroupForm = ({
  onClose,
}: IUseGroupFormArgs): IUseGroupFormResult => {
  const { createGroup } = useGroupActions();

  const form = useForm<GroupFormValues>({
    resolver: yupResolver(groupSchema),
    defaultValues: { name: "" },
    mode: "onChange",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await createGroup(valuesToNewGroup(values));
      onClose();
    } catch {
      // Notifications are handled in useGroupActions; keep the modal open.
    }
  });

  return {
    form,
    onSubmit,
    isSubmitting: form.formState.isSubmitting,
  };
};
