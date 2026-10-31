import type React from "react";

import type { MavenMavenArtifactResponse } from "@app/client";
import {
  ContentHeader,
  ContentPanelLayout,
  FactList,
  facts,
  StorageFacts,
} from "@app/components/ContentPanelLayout";
import { useContentDetailQuery } from "@app/queries/content";
import type { IContentPanelProps } from "@plugin-sdk/ui";

import { MavenInstall } from "./MavenInstall";

/** Maven Central style: coordinates up front, build-tool snippets to copy. */
export const MavenContent: React.FC<IContentPanelProps> = ({ href }) => {
  const { data, isLoading, error } =
    useContentDetailQuery<MavenMavenArtifactResponse>({ href });
  const groupId = data?.group_id ?? "";
  const artifactId = data?.artifact_id ?? "";
  const version = data?.version ?? "";
  const packaging = data?.filename?.split(".").pop();

  return (
    <ContentPanelLayout
      isLoading={isLoading}
      error={error}
      header={
        <ContentHeader
          title={artifactId}
          subtitle={groupId}
          version={version}
        />
      }
      aside={
        <>
          <FactList
            title="Artifact"
            items={facts({
              Packaging: packaging,
              File: data?.filename,
            })}
          />
          <StorageFacts
            href={href}
            artifactHref={data?.artifact}
            created={data?.pulp_created}
            labels={data?.pulp_labels}
          />
        </>
      }
    >
      <MavenInstall
        groupId={groupId}
        artifactId={artifactId}
        version={version}
      />
    </ContentPanelLayout>
  );
};
