import { useForm, type UseFormReturn } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import type {
  FileFileRepository,
  FileFileRepositoryResponse,
  PatchedfileFileRepository,
} from "@app/client";
import { useNotifications } from "@app/context/useNotifications";
import { fileRepositoryDescriptor } from "@app/descriptors/file/file-repository";
import {
  buildDefaultValues,
  buildFieldSchema,
  cleanFormValues,
} from "@app/descriptors/formSchema";
import type { IFieldDescriptor } from "@app/descriptors/types";
import {
  useFileRepositoryCreateMutation,
  useFileRepositoryUpdateMutation,
} from "@app/queries/file-repositories";
import { getMutationErrorMessage } from "@app/utils/utils";

const createFields = fileRepositoryDescriptor.createFields ?? [];
const editFields = fileRepositoryDescriptor.editFields ?? [];
const createRepositorySchema = buildFieldSchema(createFields);
const editRepositorySchema = buildFieldSchema(editFields);

type RepositoryFormValues = Record<string, unknown>;

interface IUseRepositoryFormArgs {
  repository?: FileFileRepositoryResponse;
  onClose: () => void;
}

interface IUseRepositoryFormResult {
  form: UseFormReturn<RepositoryFormValues>;
  isCreate: boolean;
  fields: IFieldDescriptor[];
  onSubmit: () => void;
  isSubmitting: boolean;
}

export const useRepositoryForm = ({
  repository,
  onClose,
}: IUseRepositoryFormArgs): IUseRepositoryFormResult => {
  const isCreate = !repository;
  const fields = isCreate ? createFields : editFields;
  const { addNotification } = useNotifications();
  const createMutation = useFileRepositoryCreateMutation();
  const updateMutation = useFileRepositoryUpdateMutation();

  const form = useForm<RepositoryFormValues>({
    resolver: yupResolver(
      isCreate ? createRepositorySchema : editRepositorySchema,
    ),
    defaultValues: buildDefaultValues(fields, repository),
    mode: "onChange",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (isCreate) {
        const body = cleanFormValues<FileFileRepository>(values);
        const result = await createMutation.mutateAsync(body);
        addNotification({
          title: `Repository "${result.name}" created`,
          variant: "success",
        });
      } else if (repository?.pulp_href) {
        await updateMutation.mutateAsync({
          href: repository.pulp_href,
          body: values as PatchedfileFileRepository,
        });
        addNotification({
          title: `Repository "${repository.name}" updated`,
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
          isCreate
            ? "Failed to create repository"
            : "Failed to update repository",
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
