import type React from "react";

import { PaginationVariant } from "@patternfly/react-core";
import { useDataViewPagination } from "@patternfly/react-data-view";

import type { DebReleaseResponse, DebSourcePackageResponse } from "@app/client";
import { ListPagination } from "@app/components/ListPagination";
import {
  useContentDetailQuery,
  useContentTypeListQuery,
} from "@app/queries/content";
import {
  ContentHeader,
  ContentPanelLayout,
  ContentSection,
  FactList,
  facts,
  type IPluginContentProps,
  LabelList,
  LinkList,
  links,
  StorageFacts,
} from "@plugin-sdk/ui/blocks/content";

interface IReleaseValuesProps {
  /** The release's `distribution` name, which its component/architecture units carry. */
  distribution: string;
  versionHref: string;
}

/** The version's `deb.release_component` units for one release, paged. */
const ReleaseComponents: React.FC<IReleaseValuesProps> = ({
  distribution,
  versionHref,
}) => {
  const pagination = useDataViewPagination({ perPage: 10 });
  const { data } = useContentTypeListQuery({
    pulpType: "deb.release_component",
    params: {
      repository_version: versionHref,
      distribution,
      ordering: ["component"],
      fields: ["component"],
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
    },
  });
  return (
    <ContentSection title={`Components (${data?.count ?? 0})`}>
      <LabelList
        items={(data?.results ?? []).map((c) => c.component)}
        emptyText="No components"
      />
      {data?.count ? (
        <ListPagination
          variant={PaginationVariant.bottom}
          itemCount={data.count}
          pagination={pagination}
        />
      ) : null}
    </ContentSection>
  );
};

/** The version's `deb.release_architecture` units for one release, paged. */
const ReleaseArchitectures: React.FC<IReleaseValuesProps> = ({
  distribution,
  versionHref,
}) => {
  const pagination = useDataViewPagination({ perPage: 10 });
  const { data } = useContentTypeListQuery({
    pulpType: "deb.release_architecture",
    params: {
      repository_version: versionHref,
      distribution,
      ordering: ["architecture"],
      fields: ["architecture"],
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
    },
  });
  return (
    <ContentSection title={`Architectures (${data?.count ?? 0})`}>
      <LabelList
        items={(data?.results ?? []).map((a) => a.architecture)}
        emptyText="No architectures"
      />
      {data?.count ? (
        <ListPagination
          variant={PaginationVariant.bottom}
          itemCount={data.count}
          pagination={pagination}
        />
      ) : null}
    </ContentSection>
  );
};

/**
 * A dist (`dists/<codename>/Release`): suite, origin, components and architectures.
 */
export const DebReleaseContent: React.FC<IPluginContentProps> = ({
  href,
  versionHref,
}) => {
  const { data, isLoading, error } = useContentDetailQuery<DebReleaseResponse>({
    href,
  });
  // pulp_deb usually leaves the release's own `components` / `architectures` empty and
  // stores them as `deb.release_component` / `deb.release_architecture` units linked by
  // distribution name. Those units are shared across repositories, so they are read
  // only within a repository version (Browse), never domain-wide.
  const unitsScope =
    versionHref && data?.distribution
      ? { versionHref, distribution: data.distribution }
      : null;

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
      {unitsScope && !data?.components?.length ? (
        <ReleaseComponents {...unitsScope} />
      ) : (
        <ContentSection title="Components">
          <LabelList items={data?.components ?? []} emptyText="No components" />
        </ContentSection>
      )}
      {unitsScope && !data?.architectures?.length ? (
        <ReleaseArchitectures {...unitsScope} />
      ) : (
        <ContentSection title="Architectures">
          <LabelList
            items={data?.architectures ?? []}
            emptyText="No architectures"
          />
        </ContentSection>
      )}
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
