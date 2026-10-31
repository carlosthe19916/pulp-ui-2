import type React from "react";

import type { FileFileContentResponse } from "@app/client";
import {
  basename,
  ContentHeader,
  ContentPanelLayout,
  dirname,
  StorageFacts,
} from "@app/components/ContentPanelLayout";
import { useContentDetailQuery } from "@app/queries/content";
import type { IContentPanelProps } from "@plugin-sdk/ui";

/** A plain file: its name, where it lives, and how big it is. */
export const FileContent: React.FC<IContentPanelProps> = ({ href }) => {
  const { data, isLoading, error } =
    useContentDetailQuery<FileFileContentResponse>({ href });

  return (
    <ContentPanelLayout
      isLoading={isLoading}
      error={error}
      header={
        <ContentHeader
          title={basename(data?.relative_path)}
          subtitle={dirname(data?.relative_path)}
        />
      }
      aside={
        <StorageFacts
          href={href}
          artifactHref={data?.artifact}
          sha256={data?.sha256}
          created={data?.pulp_created}
          labels={data?.pulp_labels}
        />
      }
    />
  );
};
