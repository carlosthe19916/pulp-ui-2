import type React from "react";

import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";

import { EntityCreatePage } from "@app/components/EntityCreatePage";
import { useCreateTypeSelect } from "@app/hooks/useCreateTypeSelect";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { useSubmitError } from "@app/hooks/useSubmitError";
import { useTaskFeedback } from "@app/hooks/useTaskFeedback";
import { useDistributionCreateMutation } from "@app/queries/distributions";
import { getMutationErrorMessage } from "@app/utils/utils";

const routeApi = getRouteApi(
  "/_authenticated/content-management/$pulpDomain/distributions/create",
);

export const DistributionCreate: React.FC = () => {
  const navigate = useNavigate();
  const navigateSearch = routeApi.useNavigate();
  const { type } = routeApi.useSearch();
  const { name: pulpDomain } = useSelectedDomain();
  const taskFeedback = useTaskFeedback();
  const { submitError, setSubmitError, clearSubmitError } = useSubmitError();

  const selection = useCreateTypeSelect({
    entity: "distribution",
    type,
    onTypeChange: (next) => {
      clearSubmitError();
      void navigateSearch({ search: { type: next }, replace: true });
    },
  });

  // Creating a distribution is a task (202), waited for briefly so the list shows it.
  const createMutation = useDistributionCreateMutation({
    onSuccess: (data, { body }) => {
      const name = String(body.name ?? "");
      taskFeedback.reportWrite({
        result: data,
        finishedTitle: `Distribution "${name}" created`,
        startedTitle: `Distribution "${name}" creation started`,
      });
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
