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
  useDistributionUpdateMutation,
  useSuspenseDistributionDetailQuery,
} from "@app/queries/distributions";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { getMutationErrorMessage } from "@app/utils/utils";

interface IDistributionEditProps {
  pulpDomain: string;
  pulpType: string;
  href: string;
}

/** Distributions have no detail page: the edit page returns to the list. */
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

  const toList = () =>
    void navigate({
      to: "/content-management/$pulpDomain/distributions",
      params: { pulpDomain },
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
          <BreadcrumbItem>{name}</BreadcrumbItem>
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
      onSaved={toList}
      onCancel={toList}
    />
  );
};
