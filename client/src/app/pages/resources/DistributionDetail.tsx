import type React from "react";
import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import dayjs from "dayjs";

import {
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Content,
  ContentVariants,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  PageSection,
  Stack,
  StackItem,
} from "@patternfly/react-core";

import { DescriptorDetailFields } from "@app/components/DescriptorDetailFields";
import { DetailQueryGate } from "@app/components/DetailQueryGate";
import { ResourceHrefLink } from "@app/components/ResourceHrefLink";
import { RENDER_DATETIME_FORMAT } from "@app/Constants";
import { useNotifications } from "@app/context/useNotifications";
import { getDescriptor } from "@app/descriptors/registry";
import {
  useFileDistributionDeleteMutation,
  useFileDistributionDetailQuery,
} from "@app/queries/file-distributions";
import { buildDistributionHref } from "@app/utils/pulpHref";
import { notifyTaskStarted } from "@app/utils/taskNotify";

import { EditDistributionModal } from "./EditDistributionModal";

interface DistributionDetailProps {
  distId: string;
}

export const DistributionDetail: React.FC<DistributionDetailProps> = ({
  distId,
}) => {
  const navigate = useNavigate();
  const distHref = buildDistributionHref(distId);
  const {
    data: distribution,
    isLoading,
    error,
  } = useFileDistributionDetailQuery(distHref);
  const deleteMutation = useFileDistributionDeleteMutation();
  const { addNotification } = useNotifications();

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const descriptor = getDescriptor("distribution", "file.file");

  const handleDelete = async () => {
    try {
      const result = await deleteMutation.mutateAsync(distHref);
      if (result?.task) {
        notifyTaskStarted(
          addNotification,
          result.task,
          "Distribution deletion started",
        );
      } else {
        addNotification({
          title: "Distribution deleted",
          variant: "success",
        });
      }
      void navigate({ to: "/distributions" });
    } catch {
      addNotification({
        title: "Failed to delete distribution",
        variant: "danger",
      });
    }
    setIsDeleteOpen(false);
  };

  return (
    <DetailQueryGate
      isLoading={isLoading}
      error={error}
      hasData={!!distribution}
      loadingLabel="Loading distribution"
    >
      {distribution ? (
        <>
          <PageSection>
            <Breadcrumb>
              <BreadcrumbItem>
                <Link to="/distributions">Distributions</Link>
              </BreadcrumbItem>
              <BreadcrumbItem isActive>{distribution.name}</BreadcrumbItem>
            </Breadcrumb>
          </PageSection>

          <PageSection>
            <Stack hasGutter>
              <StackItem>
                <Content component={ContentVariants.h1}>
                  {distribution.name}
                </Content>
              </StackItem>

              <StackItem>
                <Button
                  variant="secondary"
                  onClick={() => setIsEditOpen(true)}
                  style={{ marginRight: "var(--pf-t--global--spacer--sm)" }}
                >
                  Edit
                </Button>
                <Button variant="danger" onClick={() => setIsDeleteOpen(true)}>
                  Delete
                </Button>
              </StackItem>

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
                      {distribution.pulp_created
                        ? dayjs(distribution.pulp_created).format(
                            RENDER_DATETIME_FORMAT,
                          )
                        : "—"}
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
                    entity={distribution as unknown as Record<string, unknown>}
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

          <Modal
            isOpen={isDeleteOpen}
            onClose={() => setIsDeleteOpen(false)}
            variant="small"
          >
            <ModalHeader title="Delete Distribution" />
            <ModalBody>
              Are you sure you want to delete distribution &quot;
              {distribution.name}&quot;? This action cannot be undone.
            </ModalBody>
            <ModalFooter>
              <Button
                variant="danger"
                onClick={() => void handleDelete()}
                isLoading={deleteMutation.isPending}
              >
                Delete
              </Button>
              <Button variant="link" onClick={() => setIsDeleteOpen(false)}>
                Cancel
              </Button>
            </ModalFooter>
          </Modal>
        </>
      ) : null}
    </DetailQueryGate>
  );
};
