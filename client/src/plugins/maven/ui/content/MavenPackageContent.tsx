import type React from "react";

import { PaginationVariant } from "@patternfly/react-core";

import type { MavenMavenPackageResponse } from "@app/client";
import {
  asArray,
  ContentHeader,
  ContentPanelLayout,
  ContentSection,
  FactList,
  facts,
  LabelList,
  LinkList,
  links,
  StorageFacts,
} from "@app/components/ContentPanelLayout";
import { ListPagination } from "@app/components/ListPagination";
import { usePersistentState } from "@app/hooks/usePersistentState";
import {
  useContentDetailQuery,
  useContentTypeListQuery,
} from "@app/queries/content";
import type { IContentPanelProps } from "@plugin-sdk/ui";

import { MavenInstall } from "./MavenInstall";
import { MAVEN_PACKAGE_FILES_STATE } from "./mavenPackageContentState";

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
export const MavenPackageContent: React.FC<IContentPanelProps> = ({ href }) => {
  const { data, isLoading, error } =
    useContentDetailQuery<MavenMavenPackageResponse>({ href });
  const [filesPagination, setFilesPagination] = usePersistentState({
    ...MAVEN_PACKAGE_FILES_STATE.pagination,
    storage: "state",
  });
  const files = useContentTypeListQuery({
    pulpType: "maven.artifact",
    params: {
      group_id: data?.group_id,
      artifact_id: data?.artifact_id,
      version: data?.version,
      limit: filesPagination.perPage,
      offset: (filesPagination.page - 1) * filesPagination.perPage,
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
            href={href}
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
      <ContentSection title={`Files (${files.data?.count ?? 0})`}>
        <LabelList
          items={(files.data?.results ?? []).map((file) => file.filename ?? "")}
          emptyText="No files"
        />
        {files.data?.count ? (
          <ListPagination
            variant={PaginationVariant.bottom}
            itemCount={files.data.count}
            pagination={filesPagination}
            onPaginationChange={setFilesPagination}
          />
        ) : null}
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
