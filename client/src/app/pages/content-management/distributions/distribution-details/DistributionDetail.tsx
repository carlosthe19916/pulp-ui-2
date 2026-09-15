import type React from "react";
import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";

import {
  Breadcrumb,
  BreadcrumbItem,
  Button,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  PageSection,
  Stack,
  StackItem,
} from "@patternfly/react-core";
import { PageHeader } from "@patternfly/react-component-groups/dist/dynamic/PageHeader";
import spacing from "@patternfly/react-styles/css/utilities/Spacing/spacing";

import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { DescriptorDetailFields } from "@app/components/DescriptorDetailFields";
import { DetailQueryGate } from "@app/components/DetailQueryGate";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { ResourceHrefLink } from "@app/components/ResourceHrefLink";
import { useNotifications } from "@app/context/useNotifications";
import { getDescriptor } from "@app/descriptors/registry";
import {
  useFileDistributionDeleteMutation,
  useFileDistributionDetailQuery,
} from "@app/queries/file-distributions";
import { notifyTaskStarted } from "@app/utils/taskNotify";
import { formatDateTime, getMutationErrorMessage } from "@app/utils/utils";

import { EditDistributionModal } from "./components/EditDistributionModal";

interface IDistributionDetailProps {
  distId: string;
}

export const DistributionDetail: React.FC<IDistributionDetailProps> = ({
  distId,
}) => {
  const navigate = useNavigate();
  const {
    data: distribution,
    isLoading,
    error,
  } = useFileDistributionDetailQuery(distId);
  const deleteMutation = useFileDistributionDeleteMutation();
  const { addNotification } = useNotifications();

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const descriptor = getDescriptor("distribution", "file.file");

  const handleDelete = async () => {
    if (!distribution?.pulp_href) return;
    try {
      const result = await deleteMutation.mutateAsync(distribution.pulp_href);
      if (result?.task) {
        notifyTaskStarted(
          addNotification,
          result.task,
          `Distribution "${distribution?.name}" deletion started`,
        );
      } else {
        addNotification({
          title: `Distribution "${distribution?.name}" deleted`,
          variant: "success",
        });
      }
      void navigate({ to: "/content-management/distributions" });
    } catch (error) {
      addNotification({
        ...getMutationErrorMessage(error, "Failed to delete distribution"),
        variant: "danger",
      });
    }
    setIsDeleteOpen(false);
  };

  return (
    <>
      <DocumentTitle title={distribution?.name ?? "Distribution"} />
      <DetailQueryGate
        isLoading={isLoading}
        error={error}
        hasData={!!distribution}
        loadingLabel="Loading distribution"
      >
        {distribution ? (
          <>
            <PageHeader
              title={distribution.name}
              breadcrumbs={
                <Breadcrumb>
                  <BreadcrumbItem>
                    <Link to="/content-management/distributions">
                      Distributions
                    </Link>
                  </BreadcrumbItem>
                  <BreadcrumbItem isActive>{distribution.name}</BreadcrumbItem>
                </Breadcrumb>
              }
              actionMenu={
                <>
                  <Button
                    variant="secondary"
                    component={(props) => (
                      <Link
                        {...props}
                        to="/browse/$distributionId"
                        params={{ distributionId: distId }}
                      />
                    )}
                    className={spacing.mrSm}
                  >
                    Browse
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setIsEditOpen(true)}
                    className={spacing.mrSm}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setIsDeleteOpen(true)}
                  >
                    Delete
                  </Button>
                </>
              }
            />

            <PageSection>
              <Stack hasGutter>
                <StackItem>
                  <DescriptionList isHorizontal>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Name</DescriptionListTerm>
                      <DescriptionListDescription>
                        {distribution.name}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Created</DescriptionListTerm>
                      <DescriptionListDescription>
                        {formatDateTime(distribution.pulp_created) ?? "—"}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Repository</DescriptionListTerm>
                      <DescriptionListDescription>
                        <ResourceHrefLink
                          kind="repository"
                          href={distribution.repository}
                        />
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Publication</DescriptionListTerm>
                      <DescriptionListDescription>
                        <ResourceHrefLink
                          kind="publication"
                          href={distribution.publication}
                        />
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptorDetailFields
                      fields={descriptor?.detailFields}
                      entity={distribution}
                      skipKeys={["repository", "publication"]}
                    />
                  </DescriptionList>
                </StackItem>
              </Stack>
            </PageSection>

            <EditDistributionModal
              isOpen={isEditOpen}
              onClose={() => setIsEditOpen(false)}
              distribution={distribution}
            />

            <ConfirmActionModal
              isOpen={isDeleteOpen}
              title="Delete Distribution"
              body={`Are you sure you want to delete distribution "${distribution.name}"? This action cannot be undone.`}
              isConfirming={deleteMutation.isPending}
              onConfirm={() => void handleDelete()}
              onCancel={() => setIsDeleteOpen(false)}
            />
          </>
        ) : null}
      </DetailQueryGate>
    </>
  );
};
