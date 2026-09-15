import type React from "react";
import { Link } from "@tanstack/react-router";

import {
  Breadcrumb,
  BreadcrumbItem,
  Content,
  ContentVariants,
  EmptyState,
  EmptyStateBody,
  PageSection,
  Pagination,
} from "@patternfly/react-core";
import {
  DataView,
  DataViewFilters,
  DataViewTable,
  DataViewTextFilter,
  DataViewToolbar,
  useDataViewFilters,
  useDataViewPagination,
  type DataViewTr,
} from "@patternfly/react-data-view";

import type { FileFileContentResponse } from "@app/client";
import {
  computeActiveState,
  dataViewBodyStates,
} from "@app/components/DataView";
import { DetailQueryGate } from "@app/components/DetailQueryGate";
import { useApiDomain } from "@app/hooks/useApiDomain";
import {
  useBrowseDistributionDetailQuery,
  useBrowseFileContentListQuery,
  useBrowsePublicationDetailQuery,
  useBrowseRepositoryDetailQuery,
} from "@app/queries/browse";
import {
  buildDistributionHref,
  extractIdFromHref,
} from "@app/queries/utils/pulpHref";

type ContentRow = FileFileContentResponse & {
  size?: number;
};

interface IContentBrowserProps {
  distributionId: string;
}

interface IContentBrowserFilters {
  relative_path: string;
}

function formatBytes(size: number | undefined): string {
  if (size === undefined || size === null) return "—";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export const ContentBrowser: React.FC<IContentBrowserProps> = ({
  distributionId,
}) => {
  const { page, perPage, onSetPage, onPerPageSelect } = useDataViewPagination({
    perPage: 20,
  });
  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<IContentBrowserFilters>({
      initialFilters: { relative_path: "" },
    });

  const domain = useApiDomain();
  const distHref = buildDistributionHref(distributionId, domain);
  const {
    data: distribution,
    isLoading: isDistLoading,
    error: distError,
  } = useBrowseDistributionDetailQuery(distHref);

  const repoHref = distribution?.repository ?? "";
  const publicationHref = distribution?.publication ?? "";

  const { data: repository, isLoading: isRepoLoading } =
    useBrowseRepositoryDetailQuery(repoHref);

  const { data: publication, isLoading: isPublicationLoading } =
    useBrowsePublicationDetailQuery(publicationHref);

  const repositoryVersionHref =
    repository?.latest_version_href || publication?.repository_version || "";

  const { data: contentData, isLoading: isContentLoading } =
    useBrowseFileContentListQuery(
      {
        repository_version: repositoryVersionHref,
        relative_path__icontains: filters.relative_path || undefined,
        limit: perPage,
        offset: (page - 1) * perPage,
      },
      { enabled: !!repositoryVersionHref },
    );

  const contentUnits = (contentData?.results ?? []) as ContentRow[];
  const totalCount = contentData?.count ?? 0;
  const isResolvingVersion =
    (!!repoHref && isRepoLoading) ||
    (!!publicationHref && !repoHref && isPublicationLoading);

  const columns = ["Path", "Size", "Digest (SHA256)"];

  const rows: DataViewTr[] = contentUnits.map((unit) => {
    const href = unit.pulp_href;
    const label = unit.relative_path ?? "—";
    const sha = unit.sha256;
    return {
      id: href,
      row: [
        {
          cell: href ? (
            <Link
              to="/browse/$distributionId/$contentId"
              params={{ distributionId, contentId: extractIdFromHref(href) }}
            >
              {label}
            </Link>
          ) : (
            label
          ),
          props: { dataLabel: "Path" },
        },
        { cell: formatBytes(unit.size), props: { dataLabel: "Size" } },
        {
          cell: !sha ? "—" : sha.length > 16 ? `${sha.slice(0, 16)}...` : sha,
          props: { dataLabel: "Digest (SHA256)" },
        },
      ],
    };
  });

  const pagination = (
    <Pagination
      itemCount={totalCount}
      page={page}
      perPage={perPage}
      onSetPage={onSetPage}
      onPerPageSelect={onPerPageSelect}
    />
  );

  return (
    <DetailQueryGate
      isLoading={isDistLoading}
      error={distError}
      hasData={!!distribution}
      loadingLabel="Loading distribution"
    >
      {distribution ? (
        <>
          <PageSection>
            <Breadcrumb>
              <BreadcrumbItem>
                <Link to="/browse">Browse</Link>
              </BreadcrumbItem>
              <BreadcrumbItem isActive>{distribution.name}</BreadcrumbItem>
            </Breadcrumb>
          </PageSection>

          <PageSection>
            <Content component={ContentVariants.h1}>
              {distribution.name}
            </Content>

            {!repositoryVersionHref && !isResolvingVersion ? (
              <EmptyState titleText="No content available" headingLevel="h4">
                <EmptyStateBody>
                  This distribution is not linked to a repository version or
                  publication with content yet.
                </EmptyStateBody>
              </EmptyState>
            ) : (
              <DataView
                activeState={computeActiveState({
                  isLoading: isResolvingVersion || isContentLoading,
                  isEmpty: contentUnits.length === 0,
                })}
              >
                <DataViewToolbar
                  clearAllFilters={clearAllFilters}
                  filters={
                    <DataViewFilters
                      onChange={(_key, newFilters) => onSetFilters(newFilters)}
                      values={filters}
                    >
                      <DataViewTextFilter
                        filterId="relative_path"
                        title="Path"
                      />
                    </DataViewFilters>
                  }
                  pagination={pagination}
                />

                <DataViewTable
                  aria-label="Content table"
                  columns={columns}
                  rows={rows}
                  bodyStates={dataViewBodyStates({
                    empty: filters.relative_path
                      ? "No content matches the current filter."
                      : "No content in this distribution version.",
                  })}
                />

                <DataViewToolbar pagination={pagination} />
              </DataView>
            )}
          </PageSection>
        </>
      ) : null}
    </DetailQueryGate>
  );
};
