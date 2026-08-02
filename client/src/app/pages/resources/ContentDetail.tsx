import type React from "react";
import { Link } from "@tanstack/react-router";
import dayjs from "dayjs";

import {
  Breadcrumb,
  BreadcrumbItem,
  Content,
  ContentVariants,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  PageSection,
  Stack,
  StackItem,
} from "@patternfly/react-core";

import { DescriptorDetailFields } from "@app/components/DescriptorDetailFields";
import { DetailQueryGate } from "@app/components/DetailQueryGate";
import { RENDER_DATETIME_FORMAT } from "@app/Constants";
import { getDescriptor } from "@app/descriptors/registry";
import { useFileContentDetailQuery } from "@app/queries/file-content";
import { buildContentHref } from "@app/utils/pulpHref";

interface ContentDetailProps {
  contentId: string;
}

export const ContentDetail: React.FC<ContentDetailProps> = ({ contentId }) => {
  const contentHref = buildContentHref(contentId);
  const {
    data: content,
    isLoading,
    error,
  } = useFileContentDetailQuery(contentHref);
  const descriptor = getDescriptor("content", "file.file");

  return (
    <DetailQueryGate
      isLoading={isLoading}
      error={error}
      hasData={!!content}
      loadingLabel="Loading content"
    >
      {content ? (
        <>
          <PageSection>
            <Breadcrumb>
              <BreadcrumbItem>
                <Link to="/content">Content</Link>
              </BreadcrumbItem>
              <BreadcrumbItem isActive>{content.relative_path}</BreadcrumbItem>
            </Breadcrumb>
          </PageSection>

          <PageSection>
            <Stack hasGutter>
              <StackItem>
                <Content component={ContentVariants.h1}>
                  {content.relative_path}
                </Content>
              </StackItem>

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
                      {content.pulp_created
                        ? dayjs(content.pulp_created).format(
                            RENDER_DATETIME_FORMAT,
                          )
                        : "—"}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptorDetailFields
                    fields={descriptor?.detailFields}
                    entity={content as unknown as Record<string, unknown>}
                    skipKeys={["relative_path"]}
                  />
                </DescriptionList>
              </StackItem>
            </Stack>
          </PageSection>
        </>
      ) : null}
    </DetailQueryGate>
  );
};
