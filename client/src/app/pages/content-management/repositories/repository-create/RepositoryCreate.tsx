import type React from "react";

import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";

import { EntityCreatePage } from "@app/components/EntityCreatePage";
import { useCreateTypeSelect } from "@app/hooks/useCreateTypeSelect";
import { useNotifications } from "@app/hooks/useNotifications";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { useSubmitError } from "@app/hooks/useSubmitError";
import { useRepositoryCreateMutation } from "@app/queries/repositories";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";
import { getMutationErrorMessage } from "@app/utils/utils";

const routeApi = getRouteApi(
  "/_authenticated/content-management/$pulpDomain/repositories/create",
);

export const RepositoryCreate: React.FC = () => {
  const navigate = useNavigate();
  const navigateSearch = routeApi.useNavigate();
  const { type } = routeApi.useSearch();
  const { name: pulpDomain } = useSelectedDomain();
  const { addNotification } = useNotifications();
  const { submitError, setSubmitError, clearSubmitError } = useSubmitError();

  const selection = useCreateTypeSelect({
    entity: "repository",
    type,
    onTypeChange: (next) => {
      clearSubmitError();
      void navigateSearch({ search: { type: next }, replace: true });
    },
  });

  const createMutation = useRepositoryCreateMutation({
    onSuccess: (data) =>
      addNotification({
        title: `Repository "${data.name}" created`,
        variant: "success",
      }),
    onError: (error) =>
      setSubmitError(
        getMutationErrorMessage({
          error,
          fallback: "Failed to create repository",
        }),
      ),
  });

  const toList = () =>
    void navigate({
      to: "/content-management/$pulpDomain/repositories",
      params: { pulpDomain },
    });

  return (
    <EntityCreatePage
      entityType="repository"
      selection={selection}
      listLink={
        <Link
          to="/content-management/$pulpDomain/repositories"
          params={{ pulpDomain }}
        >
          Repositories
        </Link>
      }
      submitError={submitError}
      isSubmitting={createMutation.isPending}
      onSubmit={(body, { apiPath, saved }) => {
        clearSubmitError();
        createMutation.mutate(
          { apiPath, body },
          { onSuccess: (data) => saved(data.pulp_href) },
        );
      }}
      onSaved={({ pulpType, href }) =>
        href
          ? void navigate({
              to: "/content-management/$pulpDomain/repositories/$repositoryType/$repositoryId",
              params: {
                pulpDomain,
                repositoryType: pulpType,
                repositoryId: extractIdFromHref(href),
              },
            })
          : toList()
      }
      onCancel={toList}
    />
  );
};
