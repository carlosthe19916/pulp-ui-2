import type React from "react";

import { Link, useNavigate } from "@tanstack/react-router";

import { EntityEditPage } from "@app/components/EntityEditPage";
import { useNotifications } from "@app/hooks/useNotifications";
import { useObjectPermissions } from "@app/hooks/useObjectPermissions";
import { useRunningTask } from "@app/hooks/useRunningTask";
import { useSubmitError } from "@app/hooks/useSubmitError";
import {
  useRemoteUpdateMutation,
  useSuspenseRemoteDetailQuery,
} from "@app/queries/remotes";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";
import { notifyUpdateResult } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";

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
  const running = useRunningTask(remote);
  const name = remote.name ?? extractIdFromHref(href);

  const updateMutation = useRemoteUpdateMutation({
    onSuccess: (data) =>
      notifyUpdateResult({
        addNotification,
        data,
        subject: `Remote "${name}"`,
      }),
    onError: (error) =>
      setSubmitError(
        getMutationErrorMessage({ error, fallback: "Failed to update remote" }),
      ),
  });

  const detailParams = {
    pulpDomain,
    remoteType: pulpType,
    remoteId: extractIdFromHref(href),
  };
  const toDetail = () =>
    void navigate({
      to: "/content-management/$pulpDomain/remotes/$remoteType/$remoteId",
      params: detailParams,
    });

  return (
    <EntityEditPage
      entityType="remote"
      pulpType={pulpType}
      editedObject={remote}
      name={name}
      canChange={can("change")}
      running={running}
      listLink={
        <Link
          to="/content-management/$pulpDomain/remotes"
          params={{ pulpDomain }}
        >
          Remotes
        </Link>
      }
      detailLink={
        <Link
          to="/content-management/$pulpDomain/remotes/$remoteType/$remoteId"
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
