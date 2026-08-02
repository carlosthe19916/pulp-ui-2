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
import { DocumentTitle } from "@app/components/DocumentTitle";
import { ResourceHrefLink } from "@app/components/ResourceHrefLink";
import { RENDER_DATETIME_FORMAT } from "@app/Constants";
import { useNotifications } from "@app/context/useNotifications";
import { getDescriptor } from "@app/descriptors/registry";
import {
  useFilePublicationDeleteMutation,
  useFilePublicationDetailQuery,
} from "@app/queries/file-publications";
import { buildPublicationHref, extractIdFromHref } from "@app/utils/pulpHref";
import { getMutationErrorMessage } from "@app/utils/utils";

interface PublicationDetailProps {
  pubId: string;
}

export const PublicationDetail: React.FC<PublicationDetailProps> = ({
  pubId,
}) => {
  const navigate = useNavigate();
  const pubHref = buildPublicationHref(pubId);
  const {
    data: publication,
    isLoading,
    error,
  } = useFilePublicationDetailQuery(pubHref);
  const deleteMutation = useFilePublicationDeleteMutation();
  const { addNotification } = useNotifications();

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const descriptor = getDescriptor("publication", "file.file");

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(pubHref);
      addNotification({
        title: "Publication deleted",
        variant: "success",
      });
      void navigate({ to: "/publications" });
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
            <PageSection>
              <Breadcrumb>
                <BreadcrumbItem>
                  <Link to="/publications">Publications</Link>
                </BreadcrumbItem>
                <BreadcrumbItem isActive>{publicationLabel}</BreadcrumbItem>
              </Breadcrumb>
            </PageSection>

            <PageSection>
              <Stack hasGutter>
                <StackItem>
                  <Content component={ContentVariants.h1}>
                    Publication {publicationLabel}
                  </Content>
                </StackItem>

                <StackItem>
                  <Button
                    variant="danger"
                    onClick={() => setIsDeleteOpen(true)}
                  >
                    Delete
                  </Button>
                </StackItem>

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
                        {publication.pulp_created
                          ? dayjs(publication.pulp_created).format(
                              RENDER_DATETIME_FORMAT,
                            )
                          : "—"}
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
