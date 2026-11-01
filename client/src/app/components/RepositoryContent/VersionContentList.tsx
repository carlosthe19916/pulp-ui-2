import type React from "react";

import {
  PaginationVariant,
  ToggleGroup,
  ToggleGroupItem,
} from "@patternfly/react-core";
import {
  DataView,
  DataViewFilters,
  DataViewTextFilter,
  DataViewToolbar,
} from "@patternfly/react-data-view";

import type { ContentSummaryResponse } from "@app/client";
import {
  ContentBulkSelect,
  RemoveSelectedButton,
} from "@app/components/ContentBulkSelect";
import { ContentDataList } from "@app/components/ContentDataList";
import { ListPagination } from "@app/components/ListPagination";
import {
  type IMultiSelectOption,
  MultiSelectFilter,
} from "@app/components/MultiSelectFilter";
import { TableEmptyState } from "@app/components/TableEmptyState";
import {
  type IContentWrites,
  useContentUnitSelection,
} from "@app/hooks/useContentUnitSelection";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { usePageInRange } from "@app/hooks/usePageInRange";
import { usePersistentState } from "@app/hooks/usePersistentState";
import type { IContentListParams } from "@app/queries/content";
import { useContentListQuery } from "@app/queries/content";
import { summaryEntries, summaryTotal } from "@app/utils/contentSummary";
import type { IContentUnit } from "@app/utils/contentUnit";
import { contentUnitRef } from "@app/utils/contentUnitRef";

import {
  type BUCKET_KEYS,
  VERSION_CONTENT_LIST_STATE,
} from "./versionContentListState";

interface IBucket {
  key: (typeof BUCKET_KEYS)[number];
  param: keyof Pick<
    IContentListParams,
    | "repository_version"
    | "repository_version_added"
    | "repository_version_removed"
  >;
  label: string;
  emptyTitle: string;
}

const BUCKETS: IBucket[] = [
  {
    key: "present",
    param: "repository_version",
    label: "All content",
    emptyTitle: "No content in this version",
  },
  {
    key: "added",
    param: "repository_version_added",
    label: "Added",
    emptyTitle: "No content added in this version",
  },
  {
    key: "removed",
    param: "repository_version_removed",
    label: "Removed",
    emptyTitle: "No content removed in this version",
  },
];

/** Every type in the summary (so a selection survives a bucket switch), counted for `bucket`. */
const typeOptions = ({
  summary,
  bucket,
}: {
  summary?: ContentSummaryResponse;
  bucket: IBucket;
}): IMultiSelectOption[] => {
  const counts = new Map(
    summaryEntries(summary?.[bucket.key]).map((e) => [e.pulpType, e.count]),
  );
  const types = new Set(
    BUCKETS.flatMap(({ key }) =>
      summaryEntries(summary?.[key]).map((e) => e.pulpType),
    ),
  );
  return [...types].map((pulpType) => ({
    label: `${pulpType} (${counts.get(pulpType) ?? 0})`,
    value: pulpType,
    group: pulpType.split(".")[0],
  }));
};

interface IVersionContentListProps {
  versionHref: string;
  summary?: ContentSummaryResponse;
  selectedHref?: string;
  onSelect: (href: string) => void;
  /** Bulk selection + Remove, offered on the "All content" bucket. */
  writes?: IContentWrites;
}

/** A repository version's content, split into the `content_summary` buckets. */
export const VersionContentList: React.FC<IVersionContentListProps> = ({
  versionHref,
  summary,
  selectedHref,
  onSelect,
  writes,
}) => {
  const selection = useContentUnitSelection();
  const [pagination, setPagination] = usePersistentState({
    ...VERSION_CONTENT_LIST_STATE.pagination,
    storage: "url",
  });
  const toFirstPage = () => setPagination((prev) => ({ ...prev, page: 1 }));

  const [{ bucket: bucketKey }, setBucket] = usePersistentState({
    ...VERSION_CONTENT_LIST_STATE.bucket,
    storage: "url",
  });
  const bucket = BUCKETS.find(({ key }) => key === bucketKey) ?? BUCKETS[0];

  const [filters, setFilters] = usePersistentState({
    ...VERSION_CONTENT_LIST_STATE.filters,
    storage: "url",
  });
  const clearAllFilters = () => {
    setFilters(VERSION_CONTENT_LIST_STATE.filters.defaultValue);
    toFirstPage();
  };
  const debouncedLabel = useDebouncedValue({
    value: filters.pulp_label_select,
  });
  const selectedTypes = filters.pulp_type;

  const { data, isLoading, error } = useContentListQuery({
    params: {
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      [bucket.param]: versionHref,
      pulp_type__in: selectedTypes.length ? selectedTypes : undefined,
      pulp_label_select: debouncedLabel || undefined,
    },
  });

  const content = (data?.results ?? []) as IContentUnit[];
  const totalCount = data?.count ?? 0;
  usePageInRange({ pagination, setPagination, count: data?.count });
  const isFiltered = Boolean(selectedTypes.length || debouncedLabel);
  // Only the present content can be removed.
  const bulkWrites = bucket.key === "present" ? writes : undefined;
  const pageUnits = content.map(contentUnitRef);

  const applyFilters = (next: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...next }));
    toFirstPage();
  };

  return (
    <DataView>
      <DataViewToolbar
        clearAllFilters={clearAllFilters}
        bulkSelect={
          bulkWrites ? (
            <ContentBulkSelect
              pageUnits={pageUnits}
              selection={selection}
              isDisabled={bulkWrites.isLocked}
            />
          ) : undefined
        }
        actions={
          bulkWrites ? (
            <RemoveSelectedButton selection={selection} writes={bulkWrites} />
          ) : undefined
        }
        toggleGroup={
          <ToggleGroup aria-label="Version content">
            {BUCKETS.map((b) => (
              <ToggleGroupItem
                key={b.key}
                text={`${b.label} (${summaryTotal(summary?.[b.key])})`}
                isSelected={bucket.key === b.key}
                onChange={() => {
                  setBucket({ bucket: b.key });
                  selection.clear();
                  toFirstPage();
                }}
              />
            ))}
          </ToggleGroup>
        }
        filters={
          <DataViewFilters
            onChange={(_key, next) => applyFilters(next)}
            values={filters}
          >
            <MultiSelectFilter
              filterId="pulp_type"
              title="Type"
              options={typeOptions({ summary, bucket })}
              searchPlaceholder="Search types…"
            />
            <DataViewTextFilter filterId="pulp_label_select" title="Label" />
          </DataViewFilters>
        }
        pagination={
          <ListPagination
            variant={PaginationVariant.top}
            itemCount={totalCount}
            pagination={pagination}
            onPaginationChange={setPagination}
          />
        }
      />

      <ContentDataList
        units={content}
        isLoading={isLoading}
        error={error}
        loadingRows={pagination.perPage}
        selectedHref={selectedHref}
        onSelect={onSelect}
        bulk={
          bulkWrites
            ? { selection, isDisabled: bulkWrites.isLocked }
            : undefined
        }
        onLabelClick={(selector) =>
          applyFilters({ pulp_label_select: selector })
        }
        emptyState={
          <TableEmptyState
            title={bucket.emptyTitle}
            isFiltered={isFiltered}
            onClearFilters={clearAllFilters}
          />
        }
      />

      <DataViewToolbar
        pagination={
          <ListPagination
            variant={PaginationVariant.bottom}
            itemCount={totalCount}
            pagination={pagination}
            onPaginationChange={setPagination}
          />
        }
      />
    </DataView>
  );
};
