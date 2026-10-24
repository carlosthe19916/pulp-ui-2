import type React from "react";

import type { DebReleaseResponse, DebSourcePackageResponse } from "@app/client";
import { useContentDetailQuery } from "@app/queries/content";

import type { IPluginContentProps } from "./contentFields";
import { facts, links } from "./contentFields";
import {
  ContentHeader,
  ContentPanelLayout,
  ContentSection,
  FactList,
  LabelList,
  LinkList,
  StorageFacts,
} from "./ContentPanelLayout";

/**
 * A dist (`dists/<codename>/Release`): suite, origin, components and architectures.
 */
export const DebReleaseContent: React.FC<IPluginContentProps> = ({ href }) => {
  // TODO: pulp_deb leaves the release's `components` / `architectures` empty and
  // stores them only as `deb.release_component` / `deb.release_architecture` content
  // (linked by distribution name), so this shows "No components" while Browse shows
  // them. Fix in pulp_deb by filling the release's own lists.
  const { data, isLoading, error } = useContentDetailQuery<DebReleaseResponse>({
    href,
  });

  return (
    <ContentPanelLayout
      isLoading={isLoading}
      error={error}
      header={
        <ContentHeader
          title={data?.codename}
          subtitle={data?.suite}
          version={data?.version ?? undefined}
          summary={data?.description ?? undefined}
        />
      }
      aside={
        <>
          <FactList
            title="Release"
            items={facts({
              Origin: data?.origin,
              Label: data?.label,
              Distribution: data?.distribution,
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
      <ContentSection title="Components">
        <LabelList items={data?.components ?? []} emptyText="No components" />
      </ContentSection>
      <ContentSection title="Architectures">
        <LabelList
          items={data?.architectures ?? []}
          emptyText="No architectures"
        />
      </ContentSection>
    </ContentPanelLayout>
  );
};

const commaList = (value?: string) =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

/** Launchpad source package page: versions, binaries built, build dependencies, VCS. */
export const DebSourcePackageContent: React.FC<IPluginContentProps> = ({
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
