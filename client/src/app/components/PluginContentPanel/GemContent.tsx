import type React from "react";

import { Label, LabelGroup } from "@patternfly/react-core";

import type { GemGemContentResponse } from "@app/client";
import { useContentDetailQuery } from "@app/queries/content";

import {
  ContentHeader,
  ContentPanelLayout,
  ContentSection,
  FactList,
  InstallSnippet,
  LabelList,
  StorageFacts,
} from "./ContentPanelLayout";
import { facts } from "./contentFields";
import type { IPluginContentProps } from "./contentFields";

/** rubygems.org style: gem install + Gemfile line, runtime dependencies. */
export const GemContent: React.FC<IPluginContentProps> = ({ href }) => {
  const { data, isLoading, error } =
    useContentDetailQuery<GemGemContentResponse>({ href });

  const platform =
    data?.platform && data.platform !== "ruby" ? data.platform : undefined;
  const dependencies = Object.entries(data?.dependencies ?? {}).map(
    ([name, requirement]) => (requirement ? `${name} ${requirement}` : name),
  );

  return (
    <ContentPanelLayout
      isLoading={isLoading}
      error={error}
      header={
        <ContentHeader
          title={data?.name}
          version={data?.version}
          labels={
            (platform || data?.prerelease) && (
              <LabelGroup>
                {platform && <Label variant="outline">{platform}</Label>}
                {data?.prerelease && (
                  <Label variant="outline">Pre-release</Label>
                )}
              </LabelGroup>
            )
          }
        />
      }
      aside={
        <>
          <FactList
            title="Requirements"
            items={facts({
              "Ruby version": data?.required_ruby_version,
              "RubyGems version": data?.required_rubygems_version,
            })}
          />
          <StorageFacts
            href={href}
            sha256={data?.checksum}
            created={data?.pulp_created}
            labels={data?.pulp_labels}
          />
        </>
      }
    >
      <InstallSnippet
        command={`gem install ${data?.name} -v ${data?.version}`}
      />
      <InstallSnippet
        title="Gemfile"
        command={`gem '${data?.name}', '~> ${data?.version}'`}
      />
      <ContentSection title="Runtime dependencies">
        <LabelList items={dependencies} emptyText="No dependencies" />
      </ContentSection>
    </ContentPanelLayout>
  );
};
