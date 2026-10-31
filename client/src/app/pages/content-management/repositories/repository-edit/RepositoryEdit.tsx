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
  useRepositoryUpdateMutation,
  useSuspenseRepositoryDetailQuery,
} from "@app/queries/repositories";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";
import { buildResourceFilter } from "@app/utils/resourceFilter";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";
import { getPlugin } from "@catalog";

interface IRepositoryEditProps {
  pulpDomain: string;
  pulpType: string;
  href: string;
}

export const RepositoryEdit: React.FC<IRepositoryEditProps> = ({
  pulpDomain,
  pulpType,
  href,
}) => {
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  const { submitError, setSubmitError, clearSubmitError } = useSubmitError();
  const { data: repository } = useSuspenseRepositoryDetailQuery({ href });
  const { can } = useObjectPermissions({ href });
  const entry = getEntityForm({ entity: "repository", pulpType, mode: "edit" });
  const name = repository.name ?? extractIdFromHref(href);

  const updateMutation = useRepositoryUpdateMutation({
    onSuccess: (data) => {
      if ("task" in data) {
        notifyTaskStarted({
          addNotification,
          taskHref: data.task,
          title: `Repository "${name}" update started`,
        });
      } else {
        addNotification({
          title: `Repository "${name}" updated`,
          variant: "success",
        });
      }
    },
    onError: (error) =>
      setSubmitError(
        getMutationErrorMessage({
          error,
          fallback: "Failed to update repository",
        }),
      ),
  });

  const detailParams = {
    pulpDomain,
    repositoryType: pulpType,
    repositoryId: extractIdFromHref(href),
  };
  const toDetail = () =>
    void navigate({
      to: "/content-management/$pulpDomain/repositories/$repositoryType/$repositoryId",
      params: detailParams,
    });

  // The route loader only resolves for types with an edit form.
  if (!entry) return null;

  // The page is reachable by URL, so it checks for itself what the list's Edit action does.
  if (!can("change")) {
    return (
      <PageSection>
        <UnauthorizedState
          description={`You don't have permission to change repository "${name}".`}
        />
      </PageSection>
    );
  }

  return (
    <EntityFormPage
      form={entry.form}
      mode="edit"
      entity={repository}
      label={<Label color="blue">plugin: {pulpType}</Label>}
      breadcrumbs={
        <Breadcrumb>
          <BreadcrumbItem>
            <Link
              to="/content-management/$pulpDomain/repositories"
              params={{ pulpDomain }}
            >
              Repositories
            </Link>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Link
              to="/content-management/$pulpDomain/repositories/$repositoryType/$repositoryId"
              params={detailParams}
            >
              {name}
            </Link>
          </BreadcrumbItem>
          <BreadcrumbItem isActive>Edit</BreadcrumbItem>
        </Breadcrumb>
      }
      resourceFilter={buildResourceFilter({
        kind: "repository",
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
