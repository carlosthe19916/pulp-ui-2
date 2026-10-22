import type React from "react";

import type { MavenMavenPackageResponse } from "@app/client";
import {
  useContentDetailQuery,
  useContentTypeListQuery,
} from "@app/queries/content";

import {
  ContentHeader,
  ContentPanelLayout,
  ContentSection,
  FactList,
  LabelList,
  LinkList,
  StorageFacts,
} from "./ContentPanelLayout";
import { asArray, facts, links } from "./contentFields";
import type { IPluginContentProps } from "./contentFields";
import { MavenInstall } from "./MavenContent";

interface IMavenLicense {
  name?: string;
  url?: string;
}

interface IMavenDependency {
  group_id?: string;
  artifact_id?: string;
  version?: string;
  scope?: string | null;
}

/** Maven Central artifact page: coordinates, dependency snippet, files, dependencies. */
export const MavenPackageContent: React.FC<IPluginContentProps> = ({
  href,
}) => {
  const { data, isLoading, error } =
    useContentDetailQuery<MavenMavenPackageResponse>({ href });
  const files = useContentTypeListQuery({
    pulpType: "maven.artifact",
    params: {
      group_id: data?.group_id,
      artifact_id: data?.artifact_id,
      version: data?.version,
      limit: 50,
      fields: ["pulp_href", "filename"],
    },
    options: { enabled: !!data?.version },
  });

  const licenses = asArray<IMavenLicense>(data?.licenses);
  const dependencies = asArray<IMavenDependency>(data?.dependencies);

  return (
    <ContentPanelLayout
      isLoading={isLoading}
      error={error}
      header={
        <ContentHeader
          title={data?.artifact_id}
          subtitle={data?.group_id}
          version={data?.version}
          summary={data?.description ?? undefined}
        />
      }
      aside={
        <>
          <LinkList
            links={links({ Project: data?.url, Source: data?.scm_url })}
          />
          <FactList
            title="Package"
            items={facts({
              Packaging: data?.packaging,
              "Base version": data?.base_version,
              License: licenses.map((l) => l.name).join(", "),
            })}
          />
          <StorageFacts
            created={data?.pulp_created}
            labels={data?.pulp_labels}
          />
        </>
      }
    >
      <MavenInstall
        groupId={data?.group_id ?? ""}
        artifactId={data?.artifact_id ?? ""}
        version={data?.version ?? ""}
      />
      <ContentSection title={`Files (${files.data?.results.length ?? 0})`}>
        <LabelList
          items={(files.data?.results ?? []).map((file) => file.filename ?? "")}
          emptyText="No files"
        />
      </ContentSection>
      <ContentSection title={`Dependencies (${dependencies.length})`}>
        <LabelList
          items={dependencies.map(
            (dep) =>
              `${dep.group_id}:${dep.artifact_id}:${dep.version}${dep.scope ? ` (${dep.scope})` : ""}`,
          )}
          emptyText="No dependencies"
        />
      </ContentSection>
    </ContentPanelLayout>
  );
};
