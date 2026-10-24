import type React from "react";

import { TaskActionModal } from "@app/components/TaskActionModal";
import { useNotifications } from "@app/hooks/useNotifications";
import { useSubmitError } from "@app/hooks/useSubmitError";
import {
  type AlternateContentSource,
  useAcsCreateMutation,
  useAcsUpdateMutation,
} from "@app/queries/acs";
import { resolvePulpType } from "@app/queries/utils/pulpHref";
import { buildDefaultValues } from "@app/utils/formSchema";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";

import { ACS_FIELDS, type IAcsType } from "../utils/acsTypes";

/** Creates an ACS of the selected plugin, or edits one. */
export const AcsModal: React.FC<{
  acsType: IAcsType;
  acs?: AlternateContentSource;
  onClose: () => void;
}> = ({ acsType, acs, onClose }) => {
  const { addNotification } = useNotifications();
  const { submitError, setSubmitError, clearSubmitError } = useSubmitError();
  const onError = (error: unknown) =>
    setSubmitError(
      getMutationErrorMessage({
        error,
        fallback: acs ? "Failed to save source" : "Failed to create source",
      }),
    );
  const createMutation = useAcsCreateMutation({
    onSuccess: ({ name }) =>
      addNotification({
        title: `Source "${name}" created`,
        variant: "success",
      }),
    onError,
  });
  const updateMutation = useAcsUpdateMutation({
    onSuccess: (data) =>
      "task" in data
        ? notifyTaskStarted({
            addNotification,
            taskHref: data.task,
            title: `Update of "${acs?.name}" started`,
          })
        : addNotification({
            title: `Source "${data.name}" saved`,
            variant: "success",
          }),
    onError,
  });

  return (
    <TaskActionModal
      title={
        acs
          ? `Edit source "${acs.name}"`
          : `Create ${acsType.label} alternate content source`
      }
      submitLabel={acs ? "Save" : "Create"}
      fields={ACS_FIELDS}
      initialValues={
        acs ? buildDefaultValues({ fields: ACS_FIELDS, source: acs }) : {}
      }
      resourceFilter={{
        remote: (href) => resolvePulpType(href) === acsType.remoteType,
      }}
      isSubmitting={createMutation.isPending || updateMutation.isPending}
      submitError={submitError}
      onSubmit={(body) => {
        clearSubmitError();
        if (acs) {
          updateMutation.mutate(
            { href: acs.pulp_href ?? "", body: { paths: [], ...body } },
            { onSuccess: onClose },
          );
        } else {
          createMutation.mutate(
            { apiPath: acsType.apiPath, body },
            { onSuccess: onClose },
          );
        }
      }}
      onClose={onClose}
    />
  );
};
