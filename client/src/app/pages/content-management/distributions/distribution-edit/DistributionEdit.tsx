import type React from "react";

import { Link, useNavigate } from "@tanstack/react-router";

import {
  Breadcrumb,
  BreadcrumbItem,
  Label,
  PageSection,
} from "@patternfly/react-core";

import { EditDuringTaskAlert } from "@app/components/EditDuringTaskAlert";
import { UnauthorizedState } from "@app/components/UnauthorizedState";
import { EntityFormPage } from "@app/forms";
import { useNotifications } from "@app/hooks/useNotifications";
import { useObjectPermissions } from "@app/hooks/useObjectPermissions";
import { useResourceTasks } from "@app/hooks/useResourceTasks";
import { useSubmitError } from "@app/hooks/useSubmitError";
import {
  useDistributionUpdateMutation,
  useSuspenseDistributionDetailQuery,
} from "@app/queries/distributions";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";
import { getEntityForm } from "@plugins";

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
  const { addNotification } = useNotifications();
  const { submitError, setSubmitError, clearSubmitError } = useSubmitError();
  const { data: distribution } = useSuspenseDistributionDetailQuery({ href });
  const { can } = useObjectPermissions({ href });
  // The form keeps its own values, so a settled task needs no refetch here.
  const { getActiveCount, getTasks } = useResourceTasks({
    entities: [distribution],
    onSettled: () => undefined,
  });
  const isRunning = getActiveCount(distribution.prn) > 0;
  const entry = getEntityForm({
    entity: "distribution",
    pulpType,
    mode: "edit",
  });
  const name = distribution.name ?? extractIdFromHref(href);

  const updateMutation = useDistributionUpdateMutation({
    onSuccess: (data) => {
      if ("task" in data) {
        notifyTaskStarted({
          addNotification,
          taskHref: data.task,
          title: `Distribution "${name}" update started`,
        });
      } else {
        addNotification({
          title: `Distribution "${name}" updated`,
          variant: "success",
        });
      }
    },
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

  // The route loader only resolves for types with an edit form.
  if (!entry) return null;

  // The page is reachable by URL, so it checks for itself what the list's Edit action does.
  if (!can("change")) {
    return (
      <PageSection>
        <UnauthorizedState
          description={`You don't have permission to change distribution "${name}".`}
        />
      </PageSection>
    );
  }

  return (
    <EntityFormPage
      form={entry.form}
      mode="edit"
      entity={distribution}
      label={<Label color="blue">plugin: {pulpType}</Label>}
      // Pulp queues an update behind the running task rather than refusing it.
      notice={
        isRunning && (
          <EditDuringTaskAlert
            entityLabel="distribution"
            running={getTasks(distribution.prn)[0] ?? {}}
          />
        )
      }
      breadcrumbs={
        <Breadcrumb>
          <BreadcrumbItem>
            <Link
              to="/content-management/$pulpDomain/distributions"
              params={{ pulpDomain }}
            >
              Distributions
            </Link>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <Link
              to="/content-management/$pulpDomain/distributions/$distributionType/$distributionId"
              params={detailParams}
            >
              {name}
            </Link>
          </BreadcrumbItem>
          <BreadcrumbItem isActive>Edit</BreadcrumbItem>
        </Breadcrumb>
      }
      resourceFilter={{}}
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
