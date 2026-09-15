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
import { DetailQueryGate } from "@app/components/DetailQueryGate";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { getDescriptor } from "@app/descriptors/registry";
import { useApiDomain } from "@app/hooks/useApiDomain";
import { useFileContentDetailQuery } from "@app/queries/file-content";
import { buildContentHref } from "@app/queries/utils/pulpHref";
import { formatDateTime } from "@app/utils/utils";

interface IContentDetailProps {
  contentId: string;
}

export const ContentDetail: React.FC<IContentDetailProps> = ({ contentId }) => {
  const domain = useApiDomain();
  const contentHref = buildContentHref(contentId, domain);
  const {
    data: content,
    isLoading,
    error,
  } = useFileContentDetailQuery(contentHref);
  const descriptor = getDescriptor("content", "file.file");

  return (
    <>
      <DocumentTitle title={content?.relative_path ?? "Content"} />
      <DetailQueryGate
        isLoading={isLoading}
        error={error}
        hasData={!!content}
        loadingLabel="Loading content"
      >
        {content ? (
          <>
            <PageHeader
              title={content.relative_path}
              breadcrumbs={
                <Breadcrumb>
                  <BreadcrumbItem>
                    <Link to="/content-management/content">Content</Link>
                  </BreadcrumbItem>
                  <BreadcrumbItem isActive>
                    {content.relative_path}
                  </BreadcrumbItem>
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
        ) : null}
      </DetailQueryGate>
    </>
  );
};
