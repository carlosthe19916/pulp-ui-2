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
import { DocumentTitle } from "@app/components/DocumentTitle";
import { PulpTypeLabel } from "@app/components/PulpTypeLabel";
import { ApiStatusContext } from "@app/context/ApiStatus/ApiStatusContext";
import {
  getDescriptor,
  getDescriptorsForKind,
} from "@app/descriptors/registry";
import { useContentListQuery } from "@app/queries/content";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";

import { UploadModal } from "@app/components/UploadModal";

/**
 * The aggregation endpoint returns extra fields at runtime that the generated
 * type does not include. Extend the base type for list usage.
 */
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

  const { page, perPage, onSetPage, onPerPageSelect } = useDataViewPagination({
    perPage: 20,
  });

  const { data, isLoading, error } = useContentListQuery({
    limit: perPage,
    offset: (page - 1) * perPage,
  });

  const content = (data?.results ?? []) as ContentRow[];
  const totalCount = data?.count ?? 0;

  const canUpload = getDescriptorsForKind("content").some(
    (d) => d.supportsUpload && d.isAvailable(plugins),
  );

  const columns = ["Name / Path", "Type", "SHA256"];

  const rows: DataViewTr[] = content.map((item) => {
    const pulpType = item.pulp_type;
    const descriptor = pulpType
      ? getDescriptor("content", pulpType)
      : undefined;
    const label = item.relative_path ?? item.name ?? "—";
    const href = item.pulp_href;
    return {
      id: href,
      row: [
        {
          cell:
            descriptor && href ? (
              <Link
                to="/content-management/content/$contentId"
                params={{ contentId: extractIdFromHref(href) }}
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
    loading: isLoading,
    error,
    empty: content.length === 0,
    emptyState: "No content found.",
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
