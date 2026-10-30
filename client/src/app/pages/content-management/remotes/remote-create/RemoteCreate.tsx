import type React from "react";
import { useState } from "react";

import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";

import {
  Breadcrumb,
  BreadcrumbItem,
  PageSection,
} from "@patternfly/react-core";

import { TableEmptyState } from "@app/components/TableEmptyState";
import {
  carryOverValues,
  EntityFormPage,
  type FormValues,
  getEntityForm,
  useCreatableTypes,
} from "@app/forms";
import { useNotifications } from "@app/hooks/useNotifications";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { useSubmitError } from "@app/hooks/useSubmitError";
import { useRemoteCreateMutation } from "@app/queries/remotes";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";
import { buildResourceFilter } from "@app/utils/resourceFilter";
import { getMutationErrorMessage } from "@app/utils/utils";
import { getPlugin } from "@catalog";

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
  // Values carried over from the type the user switched away from.
  const [carried, setCarried] = useState<{
    pulpType: string;
    values: FormValues;
  } | null>(null);

  const types = useCreatableTypes("remote");
  const pulpType =
    types.find((option) => option.pulpType === type)?.pulpType ??
    types[0]?.pulpType;
  const entry = pulpType
    ? getEntityForm({ entity: "remote", pulpType, mode: "create" })
    : undefined;
  const plugin = pulpType ? getPlugin(pulpType) : undefined;

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

  const toList = () =>
    void navigate({
      to: "/content-management/$pulpDomain/remotes",
      params: { pulpDomain },
    });

  const breadcrumbs = (
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
  );

  const apiPath = plugin?.entities.remote?.apiPath;
  if (!pulpType || !entry || !apiPath) {
    return (
      <PageSection>
        <TableEmptyState title="No remote plugin is installed" />
      </PageSection>
    );
  }

  return (
    <EntityFormPage
      key={pulpType}
      form={entry.form}
      mode="create"
      initialValues={
        carried?.pulpType === pulpType ? carried.values : undefined
      }
      breadcrumbs={breadcrumbs}
      typeSelect={{
        options: types,
        value: pulpType,
        onChange: (next, values) => {
          const nextEntry = getEntityForm({
            entity: "remote",
            pulpType: next,
            mode: "create",
          });
          if (nextEntry) {
            setCarried({
              pulpType: next,
              values: carryOverValues({
                from: entry.form,
                to: nextEntry.form,
                values,
              }),
            });
          }
          clearSubmitError();
          void navigateSearch({ search: { type: next }, replace: true });
        },
      }}
      resourceFilter={buildResourceFilter({ kind: "remote", plugin })}
      submitError={submitError}
      isSubmitting={createMutation.isPending}
      onSubmit={(body, { allowLeave }) => {
        clearSubmitError();
        createMutation.mutate(
          { apiPath, body },
          {
            onSuccess: (data) => {
              allowLeave();
              void navigate({
                to: "/content-management/$pulpDomain/remotes/$remoteType/$remoteId",
                params: {
                  pulpDomain,
                  remoteType: pulpType,
                  remoteId: extractIdFromHref(data.pulp_href ?? ""),
                },
              });
            },
          },
        );
      }}
      onCancel={toList}
    />
  );
};
