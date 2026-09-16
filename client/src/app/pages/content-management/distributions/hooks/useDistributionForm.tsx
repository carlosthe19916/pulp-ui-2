import { useForm, type UseFormReturn } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import type {
  FileFileDistribution,
  FileFileDistributionResponse,
  PatchedfileFileDistribution,
} from "@app/client";
import { useNotifications } from "@app/context/useNotifications";
import { fileDistributionDescriptor } from "@app/descriptors/file/file-distribution";
import {
  buildDefaultValues,
  buildFieldSchema,
  cleanFormValues,
} from "@app/descriptors/formSchema";
import type { IFieldDescriptor } from "@app/descriptors/types";
import {
  useFileDistributionCreateMutation,
  useFileDistributionUpdateMutation,
} from "@app/queries/file-distributions";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";

const createFields = fileDistributionDescriptor.createFields ?? [];
const editFields = fileDistributionDescriptor.editFields ?? [];
const createDistributionSchema = buildFieldSchema(createFields);
const editDistributionSchema = buildFieldSchema(editFields);

type DistributionFormValues = Record<string, unknown>;

interface IUseDistributionFormArgs {
  distribution?: FileFileDistributionResponse;
  onClose: () => void;
}

interface IUseDistributionFormResult {
  form: UseFormReturn<DistributionFormValues>;
  isCreate: boolean;
  fields: IFieldDescriptor[];
  onSubmit: () => void;
  isSubmitting: boolean;
}

export const useDistributionForm = ({
  distribution,
  onClose,
}: IUseDistributionFormArgs): IUseDistributionFormResult => {
  const isCreate = !distribution;
  const fields = isCreate ? createFields : editFields;
  const { addNotification } = useNotifications();
  const createMutation = useFileDistributionCreateMutation();
  const updateMutation = useFileDistributionUpdateMutation();

  const form = useForm<DistributionFormValues>({
    resolver: yupResolver(
      isCreate ? createDistributionSchema : editDistributionSchema,
    ),
    defaultValues: buildDefaultValues(fields, distribution),
    mode: "onChange",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (isCreate) {
        const body = cleanFormValues<FileFileDistribution>(values);
        const result = await createMutation.mutateAsync(body);
        if (result?.task) {
          notifyTaskStarted(
            addNotification,
            result.task,
            `Distribution "${body.name}" creation started`,
          );
        } else {
          addNotification({
            title: `Distribution "${body.name}" created`,
            variant: "success",
          });
        }
      } else if (distribution?.pulp_href) {
        const result = await updateMutation.mutateAsync({
          distId: extractIdFromHref(distribution.pulp_href),
          body: values as PatchedfileFileDistribution,
        });
        const taskHref = result && "task" in result ? result.task : undefined;
        if (taskHref) {
          notifyTaskStarted(
            addNotification,
            taskHref,
            `Distribution "${distribution.name}" update started`,
          );
        } else {
          addNotification({
            title: `Distribution "${distribution.name}" updated`,
            variant: "success",
          });
        }
      } else {
        return;
      }
      onClose();
    } catch (error) {
      addNotification({
        ...getMutationErrorMessage(
          error,
          isCreate
            ? "Failed to create distribution"
            : "Failed to update distribution",
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
