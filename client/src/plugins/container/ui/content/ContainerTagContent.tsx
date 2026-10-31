import type React from "react";

import type {
  ContainerManifestResponse,
  ContainerTagResponse,
} from "@app/client";
import {
  ContentHeader,
  ContentPanelLayout,
  type IContentPanelProps,
  StorageFacts,
} from "@app/components/ContentPanelLayout";
import { useContentDetailQuery } from "@app/queries/content";

import { ManifestDetails } from "./ManifestDetails";

/** Quay-style tag page: the tag and the image it points at. */
export const ContainerTagContent: React.FC<IContentPanelProps> = ({ href }) => {
  const tag = useContentDetailQuery<ContainerTagResponse>({ href });
  const manifest = useContentDetailQuery<ContainerManifestResponse>({
    href: tag.data?.tagged_manifest ?? null,
  });

  return (
    <ContentPanelLayout
      isLoading={tag.isLoading}
      error={tag.error}
      header={<ContentHeader title={tag.data?.name} subtitle="Tag" />}
      aside={
        <StorageFacts
          href={href}
          created={tag.data?.pulp_created}
          labels={tag.data?.pulp_labels}
        />
      }
    >
      <ManifestDetails manifest={manifest.data} />
    </ContentPanelLayout>
  );
};
