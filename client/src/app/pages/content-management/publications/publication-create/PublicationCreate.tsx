import type React from "react";

import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";

import {
  Breadcrumb,
  BreadcrumbItem,
  PageSection,
} from "@patternfly/react-core";

import { TableEmptyState } from "@app/components/TableEmptyState";
import { EntityFormPage, useCreateTypeSelect } from "@app/forms";
import { useNotifications } from "@app/hooks/useNotifications";
import { usePendingCreateRecorder } from "@app/hooks/usePendingCreateRecorder";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { useSubmitError } from "@app/hooks/useSubmitError";
import { usePublicationCreateMutation } from "@app/queries/publications";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";

const routeApi = getRouteApi(
  "/_authenticated/content-management/$pulpDomain/publications/create",
);

/** Publications are immutable and have no detail page: create returns to the list. */
export const PublicationCreate: React.FC = () => {
  const navigate = useNavigate();
  const navigateSearch = routeApi.useNavigate();
  const { type } = routeApi.useSearch();
  const { name: pulpDomain } = useSelectedDomain();
  const { addNotification } = useNotifications();
  const { submitError, setSubmitError, clearSubmitError } = useSubmitError();
  const { recordPendingCreate } = usePendingCreateRecorder({
    entityType: "publication",
  });

  const {
    pulpType,
    entry,
    apiPath,
    resourceFilter,
    typeSelect,
    initialValues,
  } = useCreateTypeSelect({
    entity: "publication",
    type,
    onTypeChange: (next) => {
      clearSubmitError();
      void navigateSearch({ search: { type: next }, replace: true });
    },
  });

  // Publishing is a task (202): the list shows the publication once it finishes.
  const createMutation = usePublicationCreateMutation({
    onSuccess: (data) => {
      notifyTaskStarted({
        addNotification,
        taskHref: data.task,
        title: "Publication creation started",
      });
      recordPendingCreate({ taskHref: data.task, name: "" });
    },
    onError: (error) =>
      setSubmitError(
        getMutationErrorMessage({
          error,
          fallback: "Failed to create publication",
        }),
      ),
  });

  const toList = () =>
    void navigate({
      to: "/content-management/$pulpDomain/publications",
      params: { pulpDomain },
    });

  if (!pulpType || !entry || !apiPath) {
    return (
      <PageSection>
        <TableEmptyState title="No publication type can be created" />
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
              to="/content-management/$pulpDomain/publications"
              params={{ pulpDomain }}
            >
              Publications
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
