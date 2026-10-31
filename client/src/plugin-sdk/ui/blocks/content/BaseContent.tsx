import type React from "react";

import type { MultipleArtifactContentResponse } from "@app/client";
import { useContentDetailQuery } from "@app/queries/content";
import { resolvePulpType } from "@app/queries/utils/pulpHref";

import type { IPluginContentProps } from "./contentFields";
import {
  ContentHeader,
  ContentPanelLayout,
  StorageFacts,
} from "./ContentPanelLayout";

/** Fallback for content types without a dedicated panel. */
export const BaseContent: React.FC<IPluginContentProps> = ({ href }) => {
  const { data, isLoading, error } =
    useContentDetailQuery<MultipleArtifactContentResponse>({ href });

  return (
    <ContentPanelLayout
      isLoading={isLoading}
      error={error}
      header={<ContentHeader title={resolvePulpType(href)} />}
      aside={
        <StorageFacts
          href={href}
          created={data?.pulp_created}
          labels={data?.pulp_labels}
        />
      }
    />
  );
};
