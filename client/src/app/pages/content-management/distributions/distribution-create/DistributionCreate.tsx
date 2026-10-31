import type React from "react";

import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";

import {
  Breadcrumb,
  BreadcrumbItem,
  PageSection,
} from "@patternfly/react-core";

import { TableEmptyState } from "@app/components/TableEmptyState";
import { EntityFormPage } from "@app/forms";
import { useNotifications } from "@app/hooks/useNotifications";
import { usePendingCreateRecorder } from "@app/hooks/usePendingCreateRecorder";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { useSubmitError } from "@app/hooks/useSubmitError";
import { useDistributionCreateMutation } from "@app/queries/distributions";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";
import { useCreateTypeSelect } from "@plugins";

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

  const {
    pulpType,
    entry,
    apiPath,
    resourceFilter,
    typeSelect,
    initialValues,
  } = useCreateTypeSelect({
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

  if (!pulpType || !entry || !apiPath) {
    return (
      <PageSection>
        <TableEmptyState title="No distribution type can be created" />
      </PageSection>
    );
  }

  return (
    <EntityFormPage
      key={pulpType}
      form={entry.form}
      mode="create"
      initialValues={initialValues}
      breadcrumbs={
        <Breadcrumb>
          <BreadcrumbItem>
            <Link
              to="/content-management/$pulpDomain/distributions"
              params={{ pulpDomain }}
            >
              Distributions
            </Link>
          </BreadcrumbItem>
          <BreadcrumbItem isActive>Create</BreadcrumbItem>
        </Breadcrumb>
      }
      typeSelect={typeSelect}
      resourceFilter={resourceFilter}
      submitError={submitError}
      isSubmitting={createMutation.isPending}
      onSubmit={(body, { saved }) => {
        clearSubmitError();
        createMutation.mutate({ apiPath, body }, { onSuccess: () => saved() });
      }}
      onSaved={toList}
      onCancel={toList}
    />
  );
};
