import { useForm, type UseFormReturn } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import type {
  FileFileRemoteResponse,
  FileFileRemoteWritable,
  PatchedfileFileRemoteWritable,
} from "@app/client";
import { useNotifications } from "@app/context/useNotifications";
import { fileRemoteDescriptor } from "@app/descriptors/file/file-remote";
import {
  buildDefaultValues,
  buildFieldSchema,
  cleanFormValues,
} from "@app/descriptors/formSchema";
import type { IFieldDescriptor } from "@app/descriptors/types";
import {
  useFileRemoteCreateMutation,
  useFileRemoteUpdateMutation,
} from "@app/queries/file-remotes";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";
import { getMutationErrorMessage } from "@app/utils/utils";

const createFields = fileRemoteDescriptor.createFields ?? [];
const editFields = fileRemoteDescriptor.editFields ?? [];
const createRemoteSchema = buildFieldSchema(createFields);
const editRemoteSchema = buildFieldSchema(editFields);

type RemoteFormValues = Record<string, unknown>;

interface IUseRemoteFormArgs {
  remote?: FileFileRemoteResponse;
  onClose: () => void;
}

interface IUseRemoteFormResult {
  form: UseFormReturn<RemoteFormValues>;
  isCreate: boolean;
  fields: IFieldDescriptor[];
  onSubmit: () => void;
  isSubmitting: boolean;
}

export const useRemoteForm = ({
  remote,
  onClose,
}: IUseRemoteFormArgs): IUseRemoteFormResult => {
  const isCreate = !remote;
  const fields = isCreate ? createFields : editFields;
  const { addNotification } = useNotifications();
  const createMutation = useFileRemoteCreateMutation();
  const updateMutation = useFileRemoteUpdateMutation();

  const form = useForm<RemoteFormValues>({
    resolver: yupResolver(isCreate ? createRemoteSchema : editRemoteSchema),
    defaultValues: buildDefaultValues(fields, remote),
    mode: "onChange",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (isCreate) {
        const body = cleanFormValues<FileFileRemoteWritable>(values);
        const result = await createMutation.mutateAsync(body);
        addNotification({
          title: `Remote "${result.name}" created`,
          variant: "success",
        });
      } else if (remote?.pulp_href) {
        await updateMutation.mutateAsync({
          remoteId: extractIdFromHref(remote.pulp_href),
          body: values as PatchedfileFileRemoteWritable,
        });
        addNotification({
          title: `Remote "${remote.name}" updated`,
          variant: "success",
        });
      } else {
        return;
      }
      onClose();
    } catch (error) {
      addNotification({
        ...getMutationErrorMessage(
          error,
          isCreate ? "Failed to create remote" : "Failed to update remote",
        ),
        variant: "danger",
      });
    }
  });

  return {
    form,
    isCreate,
    fields,
    onSubmit,
    isSubmitting:
      form.formState.isSubmitting ||
      createMutation.isPending ||
      updateMutation.isPending,
  };
};
