import type React from "react";
import { useState } from "react";

import { Tab, Tabs, TabTitleText } from "@patternfly/react-core";

import type { MavenMavenArtifactResponse } from "@app/client";
import {
  ContentHeader,
  ContentPanelLayout,
  ContentSection,
  FactList,
  facts,
  type IContentPanelProps,
  StorageFacts,
} from "@app/components/ContentPanelLayout";
import { Snippet } from "@app/components/Snippet";
import { useContentDetailQuery } from "@app/queries/content";

interface IMavenInstallProps {
  groupId: string;
  artifactId: string;
  version: string;
}

/** Maven / Gradle dependency snippets for one GAV, as Maven Central shows them. */
export const MavenInstall: React.FC<IMavenInstallProps> = ({
  groupId,
  artifactId,
  version,
}) => {
  const [tool, setTool] = useState<string | number>("maven");
  return (
    <ContentSection title="Install">
      <Tabs
        activeKey={tool}
        onSelect={(_e, key) => setTool(key)}
        isSubtab
        aria-label="Build tool"
      >
        <Tab eventKey="maven" title={<TabTitleText>Maven</TabTitleText>}>
          <Snippet
            code={[
              "<dependency>",
              `  <groupId>${groupId}</groupId>`,
              `  <artifactId>${artifactId}</artifactId>`,
              `  <version>${version}</version>`,
              "</dependency>",
            ].join("\n")}
          />
        </Tab>
        <Tab eventKey="gradle" title={<TabTitleText>Gradle</TabTitleText>}>
          <Snippet
            code={`implementation '${groupId}:${artifactId}:${version}'`}
          />
        </Tab>
      </Tabs>
    </ContentSection>
  );
};

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
