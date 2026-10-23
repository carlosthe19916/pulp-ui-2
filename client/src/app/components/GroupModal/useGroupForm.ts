import { useForm, type UseFormReturn } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import type { Group, GroupResponse, PatchedGroup } from "@app/client";
import { useNotifications } from "@app/hooks/useNotifications";
import { useSubmitError } from "@app/hooks/useSubmitError";
import {
  useGroupCreateMutation,
  useGroupUpdateMutation,
} from "@app/queries/groups";
import {
  getMutationErrorMessage,
  type IMutationErrorMessage,
} from "@app/utils/utils";

export type GroupFormValues = {
  name: string;
};

const groupSchema = yup.object({
  name: yup.string().default("").required("Name is required"),
});

const toDefaults = (group?: GroupResponse): GroupFormValues => ({
  name: group?.name ?? "",
});

export const valuesToNewGroup = (values: GroupFormValues): Group => ({
  name: values.name,
});

export const valuesToPatchedGroup = (
  values: GroupFormValues,
): PatchedGroup => ({
  name: values.name,
});

interface IUseGroupFormArgs {
  group?: GroupResponse;
  onClose: () => void;
}

interface IUseGroupFormResult {
  form: UseFormReturn<GroupFormValues>;
  isCreate: boolean;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitError: IMutationErrorMessage | null;
}

export const useGroupForm = ({
  group,
  onClose,
}: IUseGroupFormArgs): IUseGroupFormResult => {
  const { addNotification } = useNotifications();
  const { submitError, setSubmitError, clearSubmitError } = useSubmitError();
  const isCreate = !group;

  const createMutation = useGroupCreateMutation({
    onSuccess: (data) =>
      addNotification({
        title: `Group "${data.name}" created`,
        variant: "success",
      }),
    onError: (error) =>
      setSubmitError(
        getMutationErrorMessage({ error, fallback: "Failed to create group" }),
      ),
  });
  const updateMutation = useGroupUpdateMutation({
    onSuccess: (data) =>
      addNotification({
        title: `Group "${data.name}" updated`,
        variant: "success",
      }),
    onError: (error) =>
      setSubmitError(
        getMutationErrorMessage({ error, fallback: "Failed to update group" }),
      ),
  });

  const form = useForm<GroupFormValues>({
    resolver: yupResolver(groupSchema),
    defaultValues: toDefaults(group),
    mode: "onChange",
  });

  const onSubmit = form.handleSubmit((values) => {
    clearSubmitError();
    if (isCreate) {
      createMutation.mutate(valuesToNewGroup(values), {
        onSuccess: () => onClose(),
      });
    } else if (group?.pulp_href) {
      updateMutation.mutate(
        {
          href: group.pulp_href,
          body: valuesToPatchedGroup(values),
        },
        { onSuccess: () => onClose() },
      );
    }
  });

  return {
    form,
    isCreate,
    onSubmit,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    submitError,
  };
};
