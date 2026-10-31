import type React from "react";

import type { ContainerManifestResponse } from "@app/client";
import {
  ContentHeader,
  ContentPanelLayout,
  type IContentPanelProps,
  StorageFacts,
} from "@app/components/ContentPanelLayout";
import { useContentDetailQuery } from "@app/queries/content";

import { ManifestDetails } from "./ManifestDetails";

/** Harbor-style artifact page for one manifest. */
export const ContainerManifestContent: React.FC<IContentPanelProps> = ({
  href,
}) => {
  const { data, isLoading, error } =
    useContentDetailQuery<ContainerManifestResponse>({ href });

  return (
    <ContentPanelLayout
      isLoading={isLoading}
      error={error}
      header={
        <ContentHeader
          title={data?.digest.slice(0, 19)}
          subtitle={data?.media_type}
        />
      }
      aside={
        <StorageFacts
          href={href}
          created={data?.pulp_created}
          labels={data?.pulp_labels}
        />
      }
    >
      <ManifestDetails manifest={data} />
    </ContentPanelLayout>
  );
};
