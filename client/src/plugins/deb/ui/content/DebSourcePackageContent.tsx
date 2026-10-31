import type React from "react";

import type { DebSourcePackageResponse } from "@app/client";
import {
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
import { useContentDetailQuery } from "@app/queries/content";
import type { IContentPanelProps } from "@plugin-sdk/ui";

const commaList = (value?: string) =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

/** Launchpad source package page: versions, binaries built, build dependencies, VCS. */
export const DebSourcePackageContent: React.FC<IContentPanelProps> = ({
  href,
}) => {
  const { data, isLoading, error } =
    useContentDetailQuery<DebSourcePackageResponse>({ href });

  return (
    <ContentPanelLayout
      isLoading={isLoading}
      error={error}
      header={
        <ContentHeader
          title={data?.source}
          subtitle={data?.maintainer}
          version={data?.version}
        />
      }
      aside={
        <>
          <LinkList
            links={links({
              Homepage: data?.homepage,
              "Browse source": data?.vcs_browser,
              Git: data?.vcs_git,
            })}
          />
          <FactList
            title="Source"
            items={facts({
              Format: data?.format,
              "Standards version": data?.standards_version,
              Uploaders: data?.uploaders,
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
      <ContentSection title="Binaries">
        <LabelList items={commaList(data?.binary)} emptyText="No binaries" />
      </ContentSection>
      <ContentSection title="Build depends">
        <LabelList items={commaList(data?.build_depends)} emptyText="None" />
      </ContentSection>
    </ContentPanelLayout>
  );
};
