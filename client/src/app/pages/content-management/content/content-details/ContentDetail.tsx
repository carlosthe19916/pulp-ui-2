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

import { getPlugin } from "@catalog";
import { EntityDetailFields } from "@app/components/EntityDetailFields";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import { useSuspenseFileContentDetailQuery } from "@app/queries/file-content";
import { formatDateTime } from "@app/utils/utils";

interface IContentDetailProps {
  contentId: string;
}

export const ContentDetail: React.FC<IContentDetailProps> = ({ contentId }) => {
  const { data: content } = useSuspenseFileContentDetailQuery(contentId);
  const plugin = getPlugin("content", "file.file");
  const { name: pulpDomain } = useSelectedDomain();

  return (
    <>
      <DocumentTitle title={content.relative_path ?? "Content"} />
      <PageHeader
        title={content.relative_path}
        breadcrumbs={
          <Breadcrumb>
            <BreadcrumbItem>
              <Link
                to="/content-management/$pulpDomain/content"
                params={{ pulpDomain }}
              >
                Content
              </Link>
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
              <EntityDetailFields
                fields={plugin?.page.detailFields}
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
