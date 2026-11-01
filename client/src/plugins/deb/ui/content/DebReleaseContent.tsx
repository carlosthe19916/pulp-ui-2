import type React from "react";

import { PaginationVariant } from "@patternfly/react-core";

import type { DebReleaseResponse } from "@app/client";
import {
  ContentHeader,
  ContentPanelLayout,
  ContentSection,
  FactList,
  facts,
  LabelList,
  StorageFacts,
} from "@app/components/ContentPanelLayout";
import { ListPagination } from "@app/components/ListPagination";
import { usePageInRange } from "@app/hooks/usePageInRange";
import { usePersistentState } from "@app/hooks/usePersistentState";
import {
  useContentDetailQuery,
  useContentTypeListQuery,
} from "@app/queries/content";
import type { IContentPanelProps } from "@plugin-sdk/ui";

import { RELEASE_VALUES_STATE } from "./debReleaseContentState";

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
  const [pagination, setPagination] = usePersistentState({
    ...RELEASE_VALUES_STATE.pagination,
    storage: "state",
  });
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
  usePageInRange({ pagination, setPagination, count: data?.count });
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
          onPaginationChange={setPagination}
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
  const [pagination, setPagination] = usePersistentState({
    ...RELEASE_VALUES_STATE.pagination,
    storage: "state",
  });
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
  usePageInRange({ pagination, setPagination, count: data?.count });
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
          onPaginationChange={setPagination}
        />
      ) : null}
    </ContentSection>
  );
};

/**
 * A dist (`dists/<codename>/Release`): suite, origin, components and architectures.
 */
export const DebReleaseContent: React.FC<IContentPanelProps> = ({
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
