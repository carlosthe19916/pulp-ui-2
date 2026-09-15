import type React from "react";
import { Link } from "@tanstack/react-router";

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

import { DescriptorDetailFields } from "@app/components/DescriptorDetailFields";
import { DetailQueryGate } from "@app/components/DetailQueryGate";
import { getDescriptor } from "@app/descriptors/registry";
import { useApiDomain } from "@app/hooks/useApiDomain";
import {
  useBrowseArtifactDetailQuery,
  useBrowseContentDetailQuery,
  useBrowseDistributionDetailQuery,
} from "@app/queries/browse";
import {
  buildContentHref,
  buildDistributionContentUrl,
  buildDistributionHref,
} from "@app/queries/utils/pulpHref";

interface IBrowseContentDetailProps {
  distributionId: string;
  contentId: string;
}

const formatBytes = (size: number | undefined): string => {
  if (size === undefined || size === null) return "—";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export const BrowseContentDetail: React.FC<IBrowseContentDetailProps> = ({
  distributionId,
  contentId,
}) => {
  const domain = useApiDomain();
  const contentHref = buildContentHref(contentId, domain);
  const distHref = buildDistributionHref(distributionId, domain);
  const descriptor = getDescriptor("content", "file.file");

  const {
    data: content,
    isLoading: isContentLoading,
    error: contentError,
  } = useBrowseContentDetailQuery(contentHref);

  const { data: distribution } = useBrowseDistributionDetailQuery(distHref);
  const { data: artifact } = useBrowseArtifactDetailQuery(
    content?.artifact ?? "",
  );

  const distributionName = distribution?.name ?? "Distribution";
  const downloadUrl =
    distribution?.base_url && content?.relative_path
      ? buildDistributionContentUrl(
          distribution.base_url,
          content.relative_path,
        )
      : (content?.artifact ?? undefined);

  return (
    <DetailQueryGate
      isLoading={isContentLoading}
      error={contentError}
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
                  <Link to="/browse">Browse</Link>
                </BreadcrumbItem>
                <BreadcrumbItem>
                  <Link
                    to="/browse/$distributionId"
                    params={{ distributionId }}
                  >
                    {distributionName}
                  </Link>
                </BreadcrumbItem>
                <BreadcrumbItem isActive>
                  {content.relative_path}
                </BreadcrumbItem>
              </Breadcrumb>
            }
            actionMenu={
              downloadUrl ? (
                <Button
                  variant="primary"
                  component="a"
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download
                </Button>
              ) : undefined
            }
          />

          <PageSection>
            <Stack hasGutter>
              <StackItem>
                <DescriptionList isHorizontal>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Size</DescriptionListTerm>
                    <DescriptionListDescription>
                      {formatBytes(artifact?.size)}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptorDetailFields
                    fields={descriptor?.browseDetailFields}
                    entity={content}
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
