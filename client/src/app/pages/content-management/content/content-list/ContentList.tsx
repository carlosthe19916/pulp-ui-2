import type React from "react";
import { use, useState } from "react";
import { Link } from "@tanstack/react-router";

import {
  Button,
  Content,
  ContentVariants,
  PageSection,
  Pagination,
  PaginationVariant,
} from "@patternfly/react-core";
import {
  DataView,
  DataViewTable,
  DataViewToolbar,
  useDataViewPagination,
  type DataViewTr,
} from "@patternfly/react-data-view";

import type { MultipleArtifactContentResponse } from "@app/client";
import { dataViewBodyStates } from "@app/components/DataView";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { DomainContextSelector } from "@app/components/DomainContextSelector";
import { PulpTypeLabel } from "@app/components/PulpTypeLabel";
import { getAvailablePlugins, getPlugin } from "@catalog";
import { ApiStatusContext } from "@app/context/ApiStatus/ApiStatusContext";
import { useContentListQuery } from "@app/queries/content";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";

import { UploadModal } from "@app/components/UploadModal";

/** The aggregation endpoint returns extra fields at runtime that the generated type omits. */
type ContentRow = MultipleArtifactContentResponse & {
  pulp_type?: string;
  relative_path?: string;
  name?: string;
  sha256?: string;
};

const truncate = (value: string | null | undefined, max = 20): string => {
  if (!value) return "—";
  return value.length > max ? `${value.slice(0, max)}...` : value;
};

export const ContentList: React.FC = () => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const plugins = use(ApiStatusContext)?.plugins ?? [];
  const { name: pulpDomain } = useSelectedDomain();

  const { page, perPage, onSetPage, onPerPageSelect } = useDataViewPagination({
    perPage: 10,
  });

  const { data, isLoading, error } = useContentListQuery({
    limit: perPage,
    offset: (page - 1) * perPage,
  });

  const content = (data?.results ?? []) as ContentRow[];
  const totalCount = data?.count ?? 0;

  const canUpload = getAvailablePlugins("content", plugins).some(
    (p) => p.capabilities.upload,
  );

  const columns = ["Name / Path", "Type", "SHA256"];

  const rows: DataViewTr[] = content.map((item) => {
    const pulpType = item.pulp_type;
    const plugin = pulpType ? getPlugin("content", pulpType) : undefined;
    const label = item.relative_path ?? item.name ?? "—";
    const href = item.pulp_href;
    return {
      id: href,
      row: [
        {
          cell:
            plugin && href ? (
              <Link
                to="/content-management/$pulpDomain/content/$contentId"
                params={{ pulpDomain, contentId: extractIdFromHref(href) }}
              >
                {label}
              </Link>
            ) : (
              label
            ),
          props: { dataLabel: "Name / Path" },
        },
        {
          cell: pulpType ? (
            <PulpTypeLabel kind="content" pulpType={pulpType} />
          ) : (
            "—"
          ),
          props: { dataLabel: "Type" },
        },
        { cell: truncate(item.sha256), props: { dataLabel: "SHA256" } },
      ],
    };
  });

  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: columns.length,
    isLoading: isLoading,
    error,
    isEmpty: content.length === 0,
    emptyState: <TableEmptyState title="No content found" />,
  });

  const pagination = (variant: PaginationVariant) => (
    <Pagination
      variant={variant}
      itemCount={totalCount}
      page={page}
      perPage={perPage}
      onSetPage={onSetPage}
      onPerPageSelect={onPerPageSelect}
    />
  );

  return (
    <>
      <DocumentTitle title="Content" />
      <DomainContextSelector />
      <PageSection>
        <Content component={ContentVariants.h1}>Content</Content>

        <DataView activeState={activeState}>
          <DataViewToolbar
            actions={
              canUpload ? (
                <Button variant="primary" onClick={() => setIsUploadOpen(true)}>
                  Upload content
                </Button>
              ) : undefined
            }
            pagination={pagination(PaginationVariant.top)}
          />

          <DataViewTable
            aria-label="Content table"
            columns={columns}
            rows={rows}
            bodyStates={bodyStates}
          />

          <DataViewToolbar pagination={pagination(PaginationVariant.bottom)} />
        </DataView>

        <UploadModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
        />
      </PageSection>
    </>
  );
};
