import type React from "react";

import { TaskActionModal } from "@app/components/TaskActionModal";
import type { IEntityField } from "@catalog";
import { useNotifications } from "@app/hooks/useNotifications";
import { useSubmitError } from "@app/hooks/useSubmitError";
import { useBandersnatchRemoteCreateMutation } from "@app/queries/python-remotes";
import { getMutationErrorMessage } from "@app/utils/utils";

const FIELDS: IEntityField[] = [
  { key: "name", label: "Name", type: "text", required: true },
  {
    key: "config",
    label: "Bandersnatch config",
    type: "file",
    required: true,
    helpText:
      "A bandersnatch.conf; its mirror and filter settings become the remote's.",
  },
  {
    key: "policy",
    label: "Policy",
    type: "select",
    defaultValue: "on_demand",
    options: [
      { value: "immediate", label: "Immediate" },
      { value: "on_demand", label: "On Demand" },
      { value: "streamed", label: "Streamed" },
    ],
  },
];

/** Creates a Python remote from a Bandersnatch config. */
export const BandersnatchRemoteModal: React.FC<{ onClose: () => void }> = ({
  onClose,
}) => {
  const { addNotification } = useNotifications();
  const { submitError, setSubmitError, clearSubmitError } = useSubmitError();
  const mutation = useBandersnatchRemoteCreateMutation({
    onSuccess: ({ name }) =>
      addNotification({
        title: `Remote "${name}" created`,
        variant: "success",
      }),
    onError: (error) =>
      setSubmitError(
        getMutationErrorMessage({ error, fallback: "Failed to create remote" }),
      ),
  });

  return (
    <TaskActionModal
      title="Create Python remote from Bandersnatch"
      submitLabel="Create"
      fields={FIELDS}
      isSubmitting={mutation.isPending}
      submitError={submitError}
      onSubmit={(body) => {
        clearSubmitError();
        mutation.mutate(
          {
            name: String(body.name),
            config: body.config as File,
            policy: body.policy as string | undefined,
          },
          { onSuccess: onClose },
        );
      }}
      onClose={onClose}
    />
  );
};
