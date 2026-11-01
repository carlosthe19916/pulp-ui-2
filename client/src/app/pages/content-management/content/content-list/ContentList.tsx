import type React from "react";
import { useState } from "react";

import {
  Content,
  ContentVariants,
  PageSection,
  PaginationVariant,
} from "@patternfly/react-core";
import {
  DataView,
  DataViewFilters,
  DataViewTextFilter,
  DataViewToolbar,
} from "@patternfly/react-data-view";

import { AddToRepositoryModal } from "@app/components/AddToRepositoryModal";
import { ContentBulkSelect } from "@app/components/ContentBulkSelect";
import { ContentDataList } from "@app/components/ContentDataList";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { DomainContextSelector } from "@app/components/DomainContextSelector";
import { GatedButton } from "@app/components/GatedButton";
import { ListPagination } from "@app/components/ListPagination";
import {
  type IMultiSelectOption,
  MultiSelectFilter,
} from "@app/components/MultiSelectFilter";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { UploadContentModal } from "@app/components/UploadContentModal";
import { useApiStatus } from "@app/hooks/useApiStatus";
import { useContentChangeTask } from "@app/hooks/useContentChangeTask";
import {
  type IContentUnitRef,
  useContentUnitSelection,
} from "@app/hooks/useContentUnitSelection";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { usePageInRange } from "@app/hooks/usePageInRange";
import { usePersistentState } from "@app/hooks/usePersistentState";
import { REPOSITORY_LOCKED_PROPS } from "@app/hooks/useRepositoryActivity";
import { useContentListQuery } from "@app/queries/content";
import type { IContentUnit } from "@app/utils/contentUnit";
import { contentUnitRef } from "@app/utils/contentUnitRef";
import { getContentTypes } from "@catalog";

import { OrphanedForFilter } from "./components/OrphanedForFilter";
import { RepositoryVersionFilter } from "./components/RepositoryVersionFilter";
import { VersionDiffFilter } from "./components/VersionDiffFilter";
import { CONTENT_LIST_STATE } from "./contentListState";
import {
  decodeRepositoryVersion,
  decodeVersionDiff,
} from "./utils/versionFilterCodec";

/**
 * The global Content list, backed by the aggregate `content/` endpoint. `pulp_type` is a closed
 * enum (multi-select → `pulp_type__in`); `pulp_label_select` and `orphaned_for` are text inputs;
 * `repo_version` and `version_diff` are composite dropdowns whose encoded value the page decodes
 * into the `repository_version*` / `*_between` params.
 */
export const ContentList: React.FC = () => {
  const [pagination, setPagination] = usePersistentState({
    ...CONTENT_LIST_STATE.pagination,
    storage: "url",
  });
  const toFirstPage = () => setPagination((prev) => ({ ...prev, page: 1 }));
  const selection = useContentUnitSelection();
  const contentChange = useContentChangeTask();
  const [addUnits, setAddUnits] = useState<IContentUnitRef[] | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  // One change at a time: actions wait until the running one settles.
  const isChanging = !!contentChange.task;
  const lockedProps = isChanging ? REPOSITORY_LOCKED_PROPS : {};

  const [filters, setFilters] = usePersistentState({
    ...CONTENT_LIST_STATE.filters,
    storage: "url",
  });
  const clearAllFilters = () => {
    setFilters(CONTENT_LIST_STATE.filters.defaultValue);
    toFirstPage();
  };
  const debouncedLabel = useDebouncedValue({
    value: filters.pulp_label_select,
  });
  const debouncedOrphaned = useDebouncedValue({ value: filters.orphaned_for });
  const selectedTypes = filters.pulp_type;

  // Type options are the catalog's content types for installed plugins, grouped by owning app.
  const installedTypes = getContentTypes({ installed: useApiStatus().plugins });
  const uploadableTypes = installedTypes.filter((ct) => ct.upload);
  const typeOptions: IMultiSelectOption[] = installedTypes.map((ct) => ({
    label: ct.pulpType,
    value: ct.pulpType,
    group: ct.pulpType.split(".")[0],
  }));

  const orphanedNum = Number(debouncedOrphaned);
  const repoVersion = decodeRepositoryVersion(filters.repo_version);
  const diff = decodeVersionDiff(filters.version_diff);
  const diffPair =
    diff.baseHref && diff.targetHref
      ? [diff.baseHref, diff.targetHref]
      : undefined;

  // The aggregate content endpoint only orders by `pk`, so this list is not column-sortable.
  const { data, isLoading, error } = useContentListQuery({
    params: {
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
      pulp_type__in: selectedTypes.length ? selectedTypes : undefined,
      pulp_label_select: debouncedLabel || undefined,
      orphaned_for:
        debouncedOrphaned && Number.isFinite(orphanedNum)
          ? orphanedNum
          : undefined,
      repository_version:
        repoVersion.relation === "in"
          ? repoVersion.versionHref || undefined
          : undefined,
      repository_version_added:
        repoVersion.relation === "added"
          ? repoVersion.versionHref || undefined
          : undefined,
      repository_version_removed:
        repoVersion.relation === "removed"
          ? repoVersion.versionHref || undefined
          : undefined,
      added_between: diff.relation === "added" ? diffPair : undefined,
      removed_between: diff.relation === "removed" ? diffPair : undefined,
    },
  });

  const content = (data?.results ?? []) as IContentUnit[];
  const totalCount = data?.count ?? 0;
  usePageInRange({ pagination, setPagination, count: data?.count });

  const isFiltered = Boolean(
    selectedTypes.length ||
    debouncedLabel ||
    debouncedOrphaned ||
    filters.repo_version ||
    filters.version_diff,
  );

  return (
    <>
      <DocumentTitle title="Content" />
      <DomainContextSelector />
      <PageSection>
        <Content component={ContentVariants.h1}>Content</Content>
      </PageSection>
      <PageSection>
        <DataView>
          <DataViewToolbar
            clearAllFilters={clearAllFilters}
            bulkSelect={
              <ContentBulkSelect
                pageUnits={content.map(contentUnitRef)}
                selection={selection}
              />
            }
            actions={
              <>
                {uploadableTypes.length > 0 && (
                  <GatedButton
                    variant="primary"
                    onClick={() => setIsUploadOpen(true)}
                    {...lockedProps}
                  >
                    Upload content
                  </GatedButton>
                )}
                <GatedButton
                  variant="secondary"
                  isDisabled={!isChanging && selection.selected.length === 0}
                  onClick={() => setAddUnits(selection.selected)}
                  {...lockedProps}
                >
                  Add to repository
                </GatedButton>
              </>
            }
            filters={
              <DataViewFilters
                onChange={(_key, newFilters) => {
                  setFilters((prev) => ({ ...prev, ...newFilters }));
                  toFirstPage();
                }}
                values={filters}
              >
                <MultiSelectFilter
                  filterId="pulp_type"
                  title="Type"
                  options={typeOptions}
                  searchPlaceholder="Search types…"
                />
                <DataViewTextFilter
                  filterId="pulp_label_select"
                  title="Label"
                />
                <OrphanedForFilter
                  filterId="orphaned_for"
                  title="Orphaned (minutes)"
                />
                <RepositoryVersionFilter
                  filterId="repo_version"
                  title="Repository version"
                />
                <VersionDiffFilter
                  filterId="version_diff"
                  title="Version diff"
                />
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
            bulk={{ selection, isDisabled: false }}
            rowActions={(unit) => [
              {
                key: "add",
                dropdownItemProps: {
                  children: "Add to repository…",
                  onClick: () => setAddUnits([contentUnitRef(unit)]),
                  ...lockedProps,
                },
              },
            ]}
            onLabelClick={(selector) => {
              setFilters((prev) => ({ ...prev, pulp_label_select: selector }));
              toFirstPage();
            }}
            emptyState={
              <TableEmptyState
                title="No content found"
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
      </PageSection>

      {isUploadOpen && (
        <UploadContentModal
          contentTypes={uploadableTypes}
          onClose={() => setIsUploadOpen(false)}
          onStarted={contentChange.watch}
        />
      )}

      {addUnits && (
        <AddToRepositoryModal
          units={addUnits}
          onClose={() => setAddUnits(null)}
          onStarted={(started) => {
            selection.clear();
            contentChange.watch(started);
          }}
        />
      )}
    </>
  );
};
