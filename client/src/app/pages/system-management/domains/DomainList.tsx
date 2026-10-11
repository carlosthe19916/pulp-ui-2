import type React from "react";
import { use, useState } from "react";

import {
  Content,
  ContentVariants,
  Button,
  Label,
  PageSection,
  Pagination,
  PaginationVariant,
} from "@patternfly/react-core";
import { ActionsColumn } from "@patternfly/react-table";
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

import type { DomainResponse } from "@app/client";
import { DEFAULT_PULP_DOMAIN } from "@app/Constants";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import {
  dataViewBodyStates,
  useColumnSort,
  type DataViewTh,
} from "@app/components/DataView";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import type { IDomainListParams } from "@app/queries/domains";
import { useDomainsListQuery } from "@app/queries/domains";
import type { OrderingField } from "@app/queries/utils/listParams";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";
import { formatDateTime } from "@app/utils/utils";

import { DomainModal } from "./components/DomainModal";
import { DomainTaskStatus } from "./components/DomainTaskStatus";
import { DomainTaskTrackerContext } from "./context/DomainTaskTrackerContext";
import { useDomainActions } from "./hooks/useDomainActions";
import { useDomainTaskWatcher } from "./hooks/useDomainTaskWatcher";
import { storageClassLabel } from "./storageBackends";

const SORTABLE_COLUMN_KEYS = [
  "name",
  "description",
  "storage_class",
  "pulp_created",
] as const satisfies readonly OrderingField<IDomainListParams>[];

interface IDomainFilters {
  name: IDomainListParams["name"];
}

const YesNoLabel: React.FC<{ value?: boolean }> = ({ value }) => (
  <Label color={value ? "green" : "grey"} isCompact>
    {value ? "Yes" : "No"}
  </Label>
);

export const DomainList: React.FC = () => {
  const { tasksByDomainId } = use(DomainTaskTrackerContext);

  const [modalState, setModalState] = useState<
    "create" | DomainResponse | null
  >(null);
  const domainToEdit =
    modalState === "create" ? undefined : (modalState ?? undefined);
  const [deleteTarget, setDeleteTarget] = useState<DomainResponse | null>(null);

  const { deleteDomain, isDeleting } = useDomainActions();

  const { page, perPage, onSetPage, onPerPageSelect } = useDataViewPagination({
    perPage: 10,
  });

  const { ordering, sortProps } = useColumnSort({
    columnKeys: SORTABLE_COLUMN_KEYS,
    initialSort: { sortBy: "name", direction: "asc" },
    onSortChange: () => onSetPage(undefined, 1),
  });

  const { filters, onSetFilters, clearAllFilters } =
    useDataViewFilters<IDomainFilters>({});
  const debouncedName = useDebouncedValue(filters.name);

  const { data, isLoading, error } = useDomainsListQuery({
    limit: perPage,
    offset: (page - 1) * perPage,
    ordering,
    name__icontains: debouncedName || undefined,
  });

  const domains = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  useDomainTaskWatcher(domains);

  const columns: DataViewTh[] = [
    { cell: "Name", props: { sort: sortProps("name"), width: 20 } },
    {
      cell: "Description",
      props: { sort: sortProps("description"), width: 25 },
    },
    { cell: "Storage", props: { sort: sortProps("storage_class"), width: 15 } },
    { cell: "Redirect", props: { width: 10 } },
    { cell: "Hide guarded", props: { width: 15 } },
    { cell: "Created", props: { sort: sortProps("pulp_created"), width: 15 } },
    { cell: "", props: { screenReaderText: "Actions" } },
  ];

  const rows: DataViewTr[] = domains.map((domain) => {
    // Pulp forbids editing or deleting the default domain.
    const isDefault = domain.name === DEFAULT_PULP_DOMAIN;
    const defaultTooltip = {
      content: "The default domain can't be edited or deleted.",
    };
    const task = domain.pulp_href
      ? tasksByDomainId[extractIdFromHref(domain.pulp_href)]
      : undefined;
    return {
      id: domain.pulp_href,
      row: [
        { cell: domain.name, props: { dataLabel: "Name" } },
        {
          cell: domain.description || "—",
          props: { dataLabel: "Description", modifier: "truncate" },
        },
        {
          cell: storageClassLabel(domain.storage_class),
          props: { dataLabel: "Storage" },
        },
        {
          cell: <YesNoLabel value={domain.redirect_to_object_storage} />,
          props: { dataLabel: "Redirect to object storage" },
        },
        {
          cell: <YesNoLabel value={domain.hide_guarded_distributions} />,
          props: { dataLabel: "Hide guarded distributions" },
        },
        {
          cell: formatDateTime(domain.pulp_created) ?? "—",
          props: { dataLabel: "Created" },
        },
        {
          cell: task ? (
            <DomainTaskStatus kind={task.kind} />
          ) : (
            <ActionsColumn
              items={[
                {
                  title: "Edit",
                  onClick: () => setModalState(domain),
                  isAriaDisabled: isDefault,
                  ...(isDefault ? { tooltipProps: defaultTooltip } : {}),
                },
                {
                  title: "Delete",
                  onClick: () => setDeleteTarget(domain),
                  isAriaDisabled: isDefault,
                  ...(isDefault ? { tooltipProps: defaultTooltip } : {}),
                },
              ]}
            />
          ),
          props: { dataLabel: "Actions", isActionCell: true },
        },
      ],
    };
  });

  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: columns.length,
    isLoading,
    error,
    isEmpty: domains.length === 0,
    emptyState: (
      <TableEmptyState
        title="No domains found"
        isFiltered={Boolean(debouncedName)}
        onClearFilters={clearAllFilters}
      />
    ),
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

  const handleDelete = async () => {
    const target = deleteTarget;
    if (!target?.pulp_href) return;
    try {
      // Wait for the 202 (task accepted) before closing; the row then shows "Deleting".
      await deleteDomain(target);
      setDeleteTarget(null);
    } catch {
      // Error surfaced as a toast; keep the modal open.
    }
  };

  return (
    <>
      <DocumentTitle title="Domains" />
      <PageSection>
        <Content component={ContentVariants.h1}>Domains</Content>
        <Content component={ContentVariants.p}>
          A domain is a tenancy boundary (similar to a namespace) that isolates
          content and has its own storage backend.
        </Content>

        <DataView activeState={activeState}>
          <DataViewToolbar
            clearAllFilters={clearAllFilters}
            filters={
              <DataViewFilters
                onChange={(_key, newFilters) => {
                  onSetFilters(newFilters);
                  onSetPage(undefined, 1);
                }}
                values={filters}
              >
                <DataViewTextFilter filterId="name" title="Name" />
              </DataViewFilters>
            }
            actions={
              <Button variant="primary" onClick={() => setModalState("create")}>
                Create domain
              </Button>
            }
            pagination={pagination(PaginationVariant.top)}
          />

          <DataViewTable
            aria-label="Domains table"
            columns={columns}
            rows={rows}
            bodyStates={bodyStates}
          />

          <DataViewToolbar pagination={pagination(PaginationVariant.bottom)} />
        </DataView>

        <DomainModal
          isOpen={modalState !== null}
          domain={domainToEdit}
          onClose={() => setModalState(null)}
        />

        <ConfirmActionModal
          isOpen={!!deleteTarget}
          title="Delete Domain"
          body={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
          isConfirming={isDeleting}
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTarget(null)}
        />
      </PageSection>
    </>
  );
};
