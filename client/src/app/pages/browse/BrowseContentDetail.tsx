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
import { PageHeaderActionsMenu } from "@app/components/PageHeaderActionsMenu";
import {
  useBrowseArtifactDetailQuery,
  useBrowseDistributionDetailQuery,
  useSuspenseBrowseContentDetailQuery,
} from "@app/queries/browse";
import { buildDistributionContentUrl } from "@app/queries/utils/pulpHref";

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
  const plugin = getPlugin("content", "file.file");

  const { data: content } = useSuspenseBrowseContentDetailQuery(contentId);

  const { data: distribution } =
    useBrowseDistributionDetailQuery(distributionId);
  const { data: artifact } = useBrowseArtifactDetailQuery(
    content.artifact ?? "",
  );

  const distributionName = distribution?.name ?? "Distribution";
  const downloadUrl =
    distribution?.base_url && content.relative_path
      ? buildDistributionContentUrl(
          distribution.base_url,
          content.relative_path,
        )
      : (content.artifact ?? undefined);

  return (
    <>
      <PageHeader
        title={content.relative_path}
        breadcrumbs={
          <Breadcrumb>
            <BreadcrumbItem>
              <Link to="/browse">Browse</Link>
            </BreadcrumbItem>
            <BreadcrumbItem>
              <Link to="/browse/$distributionId" params={{ distributionId }}>
                {distributionName}
              </Link>
            </BreadcrumbItem>
            <BreadcrumbItem isActive>{content.relative_path}</BreadcrumbItem>
          </Breadcrumb>
        }
        actionMenu={
          <PageHeaderActionsMenu
            actions={[
              !!downloadUrl && {
                key: "download",
                dropdownItemProps: {
                  children: "Download",
                  to: downloadUrl,
                  target: "_blank",
                  rel: "noopener noreferrer",
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
                <DescriptionListTerm>Size</DescriptionListTerm>
                <DescriptionListDescription>
                  {formatBytes(artifact?.size)}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <EntityDetailFields
                fields={plugin?.page.browseDetailFields}
                entity={content}
              />
            </DescriptionList>
          </StackItem>
        </Stack>
      </PageSection>
    </>
  );
};
