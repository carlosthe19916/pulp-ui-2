import type React from "react";

import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";

import { EntityCreatePage } from "@app/components/EntityCreatePage";
import { useCreateTypeSelect } from "@app/hooks/useCreateTypeSelect";
import { useNotifications } from "@app/hooks/useNotifications";
import { usePendingCreateRecorder } from "@app/hooks/usePendingCreateRecorder";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { useSubmitError } from "@app/hooks/useSubmitError";
import { useDistributionCreateMutation } from "@app/queries/distributions";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";

const routeApi = getRouteApi(
  "/_authenticated/content-management/$pulpDomain/distributions/create",
);

export const DistributionCreate: React.FC = () => {
  const navigate = useNavigate();
  const navigateSearch = routeApi.useNavigate();
  const { type } = routeApi.useSearch();
  const { name: pulpDomain } = useSelectedDomain();
  const { addNotification } = useNotifications();
  const { submitError, setSubmitError, clearSubmitError } = useSubmitError();
  const { recordPendingCreate } = usePendingCreateRecorder({
    entityType: "distribution",
  });

  const selection = useCreateTypeSelect({
    entity: "distribution",
    type,
    onTypeChange: (next) => {
      clearSubmitError();
      void navigateSearch({ search: { type: next }, replace: true });
    },
  });

  // Creating a distribution is a task (202): the list shows it once the task finishes.
  const createMutation = useDistributionCreateMutation({
    onSuccess: (data, { body }) => {
      const name = String(body.name ?? "");
      notifyTaskStarted({
        addNotification,
        taskHref: data.task,
        title: `Distribution "${name}" creation started`,
      });
      recordPendingCreate({ taskHref: data.task, name });
    },
    onError: (error) =>
      setSubmitError(
        getMutationErrorMessage({
          error,
          fallback: "Failed to create distribution",
        }),
      ),
  });

  const toList = () =>
    void navigate({
      to: "/content-management/$pulpDomain/distributions",
      params: { pulpDomain },
    });

  return (
    <EntityCreatePage
      entityType="distribution"
      selection={selection}
      listLink={
        <Link
          to="/content-management/$pulpDomain/distributions"
          params={{ pulpDomain }}
        >
          Distributions
        </Link>
      }
      submitError={submitError}
      isSubmitting={createMutation.isPending}
      onSubmit={(body, { apiPath, saved }) => {
        clearSubmitError();
        createMutation.mutate({ apiPath, body }, { onSuccess: () => saved() });
      }}
      onSaved={toList}
      onCancel={toList}
    />
  );
};
