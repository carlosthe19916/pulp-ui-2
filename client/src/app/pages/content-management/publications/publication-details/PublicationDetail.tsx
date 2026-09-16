import type React from "react";
import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";

import {
  Breadcrumb,
  BreadcrumbItem,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  PageSection,
  Stack,
  StackItem,
} from "@patternfly/react-core";
import { PageHeader } from "@patternfly/react-component-groups/dist/dynamic/PageHeader";

import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { DescriptorDetailFields } from "@app/components/DescriptorDetailFields";
import { PageHeaderActionsMenu } from "@app/components/PageHeaderActionsMenu";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { ResourceHrefLink } from "@app/components/ResourceHrefLink";
import { useNotifications } from "@app/context/useNotifications";
import { getDescriptor } from "@app/descriptors/registry";
import {
  useFilePublicationDeleteMutation,
  useSuspenseFilePublicationDetailQuery,
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
  const { data: publication } = useSuspenseFilePublicationDetailQuery(pubId);
  const deleteMutation = useFilePublicationDeleteMutation();
  const { addNotification } = useNotifications();

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const descriptor = getDescriptor("publication", "file.file");

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(pubId);
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

  const publicationLabel = publication?.pulp_href
    ? extractIdFromHref(publication.pulp_href)
    : pubId;

  return (
    <>
      <DocumentTitle title={`Publication · ${publicationLabel}`} />
      <PageHeader
        title={`Publication ${publicationLabel}`}
        breadcrumbs={
          <Breadcrumb>
            <BreadcrumbItem>
              <Link to="/content-management/publications">Publications</Link>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{publicationLabel}</BreadcrumbItem>
          </Breadcrumb>
        }
        actionMenu={
          <PageHeaderActionsMenu
            actions={[
              {
                key: "delete",
                dropdownItemProps: {
                  children: "Delete",
                  isDanger: true,
                  onClick: () => setIsDeleteOpen(true),
                },
              },
            ]}
          />
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
                <DescriptionListTerm>Repository version</DescriptionListTerm>
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

      <ConfirmActionModal
        isOpen={isDeleteOpen}
        title="Delete Publication"
        body="Are you sure you want to delete this publication? This action cannot be undone."
        isConfirming={deleteMutation.isPending}
        onConfirm={() => void handleDelete()}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </>
  );
};
