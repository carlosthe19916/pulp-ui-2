import type React from "react";

import type { FileFileContentResponse } from "@app/client";
import { useContentDetailQuery } from "@app/queries/content";

import {
  ContentHeader,
  ContentPanelLayout,
  StorageFacts,
} from "./ContentPanelLayout";
import { basename, dirname } from "./contentFields";
import type { IPluginContentProps } from "./contentFields";

/** A plain file: its name, where it lives, and how big it is. */
export const FileContent: React.FC<IPluginContentProps> = ({ href }) => {
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
