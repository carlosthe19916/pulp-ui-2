import type React from "react";

import { getRouteApi, Link, useNavigate } from "@tanstack/react-router";

import { EntityCreatePage } from "@app/components/EntityCreatePage";
import { useCreateTypeSelect } from "@app/hooks/useCreateTypeSelect";
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

  const selection = useCreateTypeSelect({
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

  const toList = () =>
    void navigate({
      to: "/content-management/$pulpDomain/remotes",
      params: { pulpDomain },
    });

  return (
    <EntityCreatePage
      entityType="remote"
      selection={selection}
      listLink={
        <Link
          to="/content-management/$pulpDomain/remotes"
          params={{ pulpDomain }}
        >
          Remotes
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
              to: "/content-management/$pulpDomain/remotes/$remoteType/$remoteId",
              params: {
                pulpDomain,
                remoteType: pulpType,
                remoteId: extractIdFromHref(href),
              },
            })
          : toList()
      }
      onCancel={toList}
    />
  );
};
