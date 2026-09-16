import type React from "react";
import { Link } from "@tanstack/react-router";

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

import { DescriptorDetailFields } from "@app/components/DescriptorDetailFields";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { getDescriptor } from "@app/descriptors/registry";
import { useSuspenseFileContentDetailQuery } from "@app/queries/file-content";
import { formatDateTime } from "@app/utils/utils";

interface IContentDetailProps {
  contentId: string;
}

export const ContentDetail: React.FC<IContentDetailProps> = ({ contentId }) => {
  const { data: content } = useSuspenseFileContentDetailQuery(contentId);
  const descriptor = getDescriptor("content", "file.file");

  return (
    <>
      <DocumentTitle title={content.relative_path ?? "Content"} />
      <PageHeader
        title={content.relative_path}
        breadcrumbs={
          <Breadcrumb>
            <BreadcrumbItem>
              <Link to="/content-management/content">Content</Link>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{content.relative_path}</BreadcrumbItem>
          </Breadcrumb>
        }
      />

      <PageSection>
        <Stack hasGutter>
          <StackItem>
            <DescriptionList isHorizontal>
              <DescriptionListGroup>
                <DescriptionListTerm>Relative path</DescriptionListTerm>
                <DescriptionListDescription>
                  {content.relative_path}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Created</DescriptionListTerm>
                <DescriptionListDescription>
                  {formatDateTime(content.pulp_created) ?? "—"}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptorDetailFields
                fields={descriptor?.detailFields}
                entity={content}
                skipKeys={["relative_path"]}
              />
            </DescriptionList>
          </StackItem>
        </Stack>
      </PageSection>
    </>
  );
};
