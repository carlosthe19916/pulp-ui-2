import type React from "react";

import { Link, useNavigate } from "@tanstack/react-router";

import { Breadcrumb, BreadcrumbItem, Label } from "@patternfly/react-core";

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
  const { disabledProps } = useObjectPermissions({ href });
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

  return (
    <EntityFormPage
      form={entry.form}
      mode="edit"
      entity={remote as Record<string, unknown>}
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
      submitProps={disabledProps("change")}
      onSubmit={(body, { allowLeave }) => {
        clearSubmitError();
        updateMutation.mutate(
          { href, body },
          {
            onSuccess: () => {
              allowLeave();
              toDetail();
            },
          },
        );
      }}
      onCancel={toDetail}
    />
  );
};
