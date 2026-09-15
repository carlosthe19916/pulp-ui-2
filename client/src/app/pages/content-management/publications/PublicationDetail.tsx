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
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  PageSection,
  Stack,
  StackItem,
} from "@patternfly/react-core";
import { PageHeader } from "@patternfly/react-component-groups/dist/dynamic/PageHeader";

import { DescriptorDetailFields } from "@app/components/DescriptorDetailFields";
import { DetailQueryGate } from "@app/components/DetailQueryGate";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { ResourceHrefLink } from "@app/components/ResourceHrefLink";
import { useNotifications } from "@app/context/useNotifications";
import { getDescriptor } from "@app/descriptors/registry";
import {
  useFilePublicationDeleteMutation,
  useFilePublicationDetailQuery,
} from "@app/queries/file-publications";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";
import { formatDateTime, getMutationErrorMessage } from "@app/utils/utils";

interface IPublicationDetailProps {
  pubId: string;
}

export const PublicationDetail: React.FC<IPublicationDetailProps> = ({
  pubId,
}) => {
  const navigate = useNavigate();
  const {
    data: publication,
    isLoading,
    error,
  } = useFilePublicationDetailQuery(pubId);
  const deleteMutation = useFilePublicationDeleteMutation();
  const { addNotification } = useNotifications();

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const descriptor = getDescriptor("publication", "file.file");

  const handleDelete = async () => {
    if (!publication?.pulp_href) return;
    try {
      await deleteMutation.mutateAsync(publication.pulp_href);
      addNotification({
        title: `Publication "${publicationLabel}" deleted`,
        variant: "success",
      });
      void navigate({ to: "/content-management/publications" });
    } catch (error) {
      addNotification({
        ...getMutationErrorMessage(error, "Failed to delete publication"),
        variant: "danger",
      });
    }
    setIsDeleteOpen(false);
  };

  /** Derive a short label from the publication href. */
  const publicationLabel = publication?.pulp_href
    ? extractIdFromHref(publication.pulp_href)
    : pubId;

  return (
    <>
      <DocumentTitle title={`Publication · ${publicationLabel}`} />
      <DetailQueryGate
        isLoading={isLoading}
        error={error}
        hasData={!!publication}
        loadingLabel="Loading publication"
      >
        {publication ? (
          <>
            <PageHeader
              title={`Publication ${publicationLabel}`}
              breadcrumbs={
                <Breadcrumb>
                  <BreadcrumbItem>
                    <Link to="/content-management/publications">
                      Publications
                    </Link>
                  </BreadcrumbItem>
                  <BreadcrumbItem isActive>{publicationLabel}</BreadcrumbItem>
                </Breadcrumb>
              }
              actionMenu={
                <Button variant="danger" onClick={() => setIsDeleteOpen(true)}>
                  Delete
                </Button>
              }
            />

            <PageSection>
              <Stack hasGutter>
                <StackItem>
                  <DescriptionList isHorizontal>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Repository</DescriptionListTerm>
                      <DescriptionListDescription>
                        <ResourceHrefLink
                          kind="repository"
                          href={publication.repository}
                        />
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>
                        Repository version
                      </DescriptionListTerm>
                      <DescriptionListDescription>
                        {publication.repository_version || "—"}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Created</DescriptionListTerm>
                      <DescriptionListDescription>
                        {formatDateTime(publication.pulp_created) ?? "—"}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptorDetailFields
                      fields={descriptor?.detailFields}
                      entity={publication}
                      skipKeys={["repository", "repository_version"]}
                    />
                  </DescriptionList>
                </StackItem>
              </Stack>
            </PageSection>

            <Modal
              isOpen={isDeleteOpen}
              onClose={() => setIsDeleteOpen(false)}
              variant="small"
            >
              <ModalHeader title="Delete Publication" />
              <ModalBody>
                Are you sure you want to delete this publication? This action
                cannot be undone.
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
    </>
  );
};
