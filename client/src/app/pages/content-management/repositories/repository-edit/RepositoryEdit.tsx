import type React from "react";

import { Link, useNavigate } from "@tanstack/react-router";

import { EntityEditPage } from "@app/components/EntityEditPage";
import { useNotifications } from "@app/hooks/useNotifications";
import { useObjectPermissions } from "@app/hooks/useObjectPermissions";
import { useRepositoryActivity } from "@app/hooks/useRepositoryActivity";
import { useSubmitError } from "@app/hooks/useSubmitError";
import {
  useRepositoryUpdateMutation,
  useSuspenseRepositoryDetailQuery,
} from "@app/queries/repositories";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";
import { notifyUpdateResult } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";

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
  // Also covers a content change started from this tab, which the task probe can miss.
  const { running } = useRepositoryActivity({ repository });
  const name = repository.name ?? extractIdFromHref(href);

  const updateMutation = useRepositoryUpdateMutation({
    onSuccess: (data) =>
      notifyUpdateResult({
        addNotification,
        data,
        subject: `Repository "${name}"`,
      }),
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

  return (
    <EntityEditPage
      entityType="repository"
      pulpType={pulpType}
      editedObject={repository}
      name={name}
      canChange={can("change")}
      running={running}
      listLink={
        <Link
          to="/content-management/$pulpDomain/repositories"
          params={{ pulpDomain }}
        >
          Repositories
        </Link>
      }
      detailLink={
        <Link
          to="/content-management/$pulpDomain/repositories/$repositoryType/$repositoryId"
          params={detailParams}
        >
          {name}
        </Link>
      }
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
