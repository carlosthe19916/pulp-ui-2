import type React from "react";

import { Link, useNavigate } from "@tanstack/react-router";

import { EntityEditPage } from "@app/components/EntityEditPage";
import { useObjectPermissions } from "@app/hooks/useObjectPermissions";
import { useRunningTask } from "@app/hooks/useRunningTask";
import { useSubmitError } from "@app/hooks/useSubmitError";
import { useTaskReporter } from "@app/hooks/useTaskReporter";
import {
  useDistributionUpdateMutation,
  useSuspenseDistributionDetailQuery,
} from "@app/queries/distributions";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";
import { getMutationErrorMessage } from "@app/utils/utils";

interface IDistributionEditProps {
  pulpDomain: string;
  pulpType: string;
  href: string;
}

export const DistributionEdit: React.FC<IDistributionEditProps> = ({
  pulpDomain,
  pulpType,
  href,
}) => {
  const navigate = useNavigate();
  const taskReporter = useTaskReporter();
  const { submitError, setSubmitError, clearSubmitError } = useSubmitError();
  const { data: distribution } = useSuspenseDistributionDetailQuery({ href });
  const { can } = useObjectPermissions({ href });
  const running = useRunningTask(distribution);
  const name = distribution.name ?? extractIdFromHref(href);

  const updateMutation = useDistributionUpdateMutation({
    onSuccess: (data) =>
      taskReporter.reportWrite({
        result: data,
        finishedTitle: `Distribution "${name}" updated`,
        startedTitle: `Distribution "${name}" update started`,
      }),
    onError: (error) =>
      setSubmitError(
        getMutationErrorMessage({
          error,
          fallback: "Failed to update distribution",
        }),
      ),
  });

  const detailParams = {
    pulpDomain,
    distributionType: pulpType,
    distributionId: extractIdFromHref(href),
  };
  const toDetail = () =>
    void navigate({
      to: "/content-management/$pulpDomain/distributions/$distributionType/$distributionId",
      params: detailParams,
    });

  return (
    <EntityEditPage
      entityType="distribution"
      pulpType={pulpType}
      editedObject={distribution}
      name={name}
      canChange={can("change")}
      running={running}
      listLink={
        <Link
          to="/content-management/$pulpDomain/distributions"
          params={{ pulpDomain }}
        >
          Distributions
        </Link>
      }
      detailLink={
        <Link
          to="/content-management/$pulpDomain/distributions/$distributionType/$distributionId"
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
