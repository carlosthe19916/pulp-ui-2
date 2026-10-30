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
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { useSubmitError } from "@app/hooks/useSubmitError";
import { useRemoteCreateMutation } from "@app/queries/remotes";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";
import { getMutationErrorMessage } from "@app/utils/utils";

const routeApi = getRouteApi(
  "/_authenticated/content-management/$pulpDomain/remotes/create",
);

export const RemoteCreate: React.FC = () => {
  const navigate = useNavigate();
  const navigateSearch = routeApi.useNavigate();
  const { type } = routeApi.useSearch();
  const { name: pulpDomain } = useSelectedDomain();
  const { addNotification } = useNotifications();
  const { submitError, setSubmitError, clearSubmitError } = useSubmitError();

  const {
    pulpType,
    entry,
    apiPath,
    resourceFilter,
    typeSelect,
    initialValues,
  } = useCreateTypeSelect({
    entity: "remote",
    type,
    onTypeChange: (next) => {
      clearSubmitError();
      void navigateSearch({ search: { type: next }, replace: true });
    },
  });

  const createMutation = useRemoteCreateMutation({
    onSuccess: (data) =>
      addNotification({
        title: `Remote "${data.name}" created`,
        variant: "success",
      }),
    onError: (error) =>
      setSubmitError(
        getMutationErrorMessage({ error, fallback: "Failed to create remote" }),
      ),
  });

  if (!pulpType || !entry || !apiPath) {
    return (
      <PageSection>
        <TableEmptyState title="No remote type can be created" />
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
              to="/content-management/$pulpDomain/remotes"
              params={{ pulpDomain }}
            >
              Remotes
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
        createMutation.mutate(
          { apiPath, body },
          { onSuccess: (data) => saved(data.pulp_href) },
        );
      }}
      onSaved={(href) =>
        void navigate({
          to: "/content-management/$pulpDomain/remotes/$remoteType/$remoteId",
          params: {
            pulpDomain,
            remoteType: pulpType,
            remoteId: extractIdFromHref(href ?? ""),
          },
        })
      }
      onCancel={() =>
        void navigate({
          to: "/content-management/$pulpDomain/remotes",
          params: { pulpDomain },
        })
      }
    />
  );
};
