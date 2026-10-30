import type React from "react";

import { Link, useNavigate } from "@tanstack/react-router";

import {
  Breadcrumb,
  BreadcrumbItem,
  Label,
  PageSection,
} from "@patternfly/react-core";

import { UnauthorizedState } from "@app/components/UnauthorizedState";
import { EntityFormPage, getEntityForm } from "@app/forms";
import { useNotifications } from "@app/hooks/useNotifications";
import { useObjectPermissions } from "@app/hooks/useObjectPermissions";
import { useSubmitError } from "@app/hooks/useSubmitError";
import {
  useRemoteUpdateMutation,
  useSuspenseRemoteDetailQuery,
} from "@app/queries/remotes";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";
import { buildResourceFilter } from "@app/utils/resourceFilter";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";
import { getPlugin } from "@catalog";

interface IRemoteEditProps {
  pulpDomain: string;
  pulpType: string;
  href: string;
}

export const RemoteEdit: React.FC<IRemoteEditProps> = ({
  pulpDomain,
  pulpType,
  href,
}) => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const { submitError, setSubmitError, clearSubmitError } = useSubmitError();
  const { data: remote } = useSuspenseRemoteDetailQuery({ href });
  const { can } = useObjectPermissions({ href });
  const entry = getEntityForm({ entity: "remote", pulpType, mode: "edit" });
  const name = remote.name ?? extractIdFromHref(href);

  const updateMutation = useRemoteUpdateMutation({
    onSuccess: (data) => {
      if ("task" in data) {
        notifyTaskStarted({
          addNotification,
          taskHref: data.task,
          title: `Remote "${name}" update started`,
        });
      } else {
        addNotification({
          title: `Remote "${name}" updated`,
          variant: "success",
        });
      }
    },
    onError: (error) =>
      setSubmitError(
        getMutationErrorMessage({ error, fallback: "Failed to update remote" }),
      ),
  });

  const toDetail = () =>
    void navigate({
      to: "/content-management/$pulpDomain/remotes/$remoteType/$remoteId",
      params: {
        pulpDomain,
        remoteType: pulpType,
        remoteId: extractIdFromHref(href),
      },
    });

  // The route loader only resolves for types with an edit form.
  if (!entry) return null;

  // The page is reachable by URL, so it checks for itself what the list's Edit action does.
  if (!can("change")) {
    return (
      <PageSection>
        <UnauthorizedState
          description={`You don't have permission to change remote "${name}".`}
        />
      </PageSection>
    );
  }

  return (
    <EntityFormPage
      form={entry.form}
      mode="edit"
      entity={remote}
      label={<Label color="blue">plugin: {pulpType}</Label>}
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
          <BreadcrumbItem>
            <Link
              to="/content-management/$pulpDomain/remotes/$remoteType/$remoteId"
              params={{
                pulpDomain,
                remoteType: pulpType,
                remoteId: extractIdFromHref(href),
              }}
            >
              {name}
            </Link>
          </BreadcrumbItem>
          <BreadcrumbItem isActive>Edit</BreadcrumbItem>
        </Breadcrumb>
      }
      resourceFilter={buildResourceFilter({
        kind: "remote",
        plugin: getPlugin(pulpType),
      })}
      submitError={submitError}
      isSubmitting={updateMutation.isPending}
      onSubmit={(body, { saved }) => {
        clearSubmitError();
        updateMutation.mutate({ href, body }, { onSuccess: () => saved() });
      }}
      onSaved={toDetail}
      onCancel={toDetail}
    />
  );
};
