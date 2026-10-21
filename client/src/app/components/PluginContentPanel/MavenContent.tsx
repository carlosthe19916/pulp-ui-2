import type React from "react";
import { useState } from "react";

import { Tab, TabTitleText, Tabs } from "@patternfly/react-core";

import type { MavenMavenArtifactResponse } from "@app/client";
import { useContentDetailQuery } from "@app/queries/content";

import {
  ContentHeader,
  ContentPanelLayout,
  ContentSection,
  FactList,
  StorageFacts,
  Snippet,
} from "./ContentPanelLayout";
import { facts } from "./contentFields";
import type { IPluginContentProps } from "./contentFields";

/** Maven Central style: coordinates up front, build-tool snippets to copy. */
export const MavenContent: React.FC<IPluginContentProps> = ({ href }) => {
  const { data, isLoading, error } =
    useContentDetailQuery<MavenMavenArtifactResponse>({ href });
  const [tool, setTool] = useState<string | number>("maven");

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
            artifactHref={data?.artifact}
            created={data?.pulp_created}
            labels={data?.pulp_labels}
          />
        </>
      }
    >
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
    </ContentPanelLayout>
  );
};
