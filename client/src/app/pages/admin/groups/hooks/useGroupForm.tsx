import { useForm, type UseFormReturn } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import type { Group, GroupResponse, PatchedGroup } from "@app/client";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";

import { useGroupActions } from "./useGroupActions";

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
}

export const useGroupForm = ({
  group,
  onClose,
}: IUseGroupFormArgs): IUseGroupFormResult => {
  const isCreate = !group;
  const { createGroup, updateGroup } = useGroupActions();

  const form = useForm<GroupFormValues>({
    resolver: yupResolver(groupSchema),
    defaultValues: toDefaults(group),
    mode: "onChange",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (isCreate) {
        await createGroup(valuesToNewGroup(values));
      } else if (group?.pulp_href) {
        const groupId = extractIdFromHref(group.pulp_href);
        await updateGroup(groupId, valuesToPatchedGroup(values));
      } else {
        return;
      }
      onClose();
    } catch {
      // Notifications are handled in useGroupActions; keep the modal open.
    }
  });

  return {
    form,
    isCreate,
    onSubmit,
    isSubmitting: form.formState.isSubmitting,
  };
};
