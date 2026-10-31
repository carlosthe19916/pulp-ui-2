import type React from "react";

import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { Label, PaginationVariant } from "@patternfly/react-core";
import { useDataViewPagination } from "@patternfly/react-data-view";
import {
  ActionsColumn,
  Caption,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@patternfly/react-table";

import type { RepositoryResponse } from "@app/client";
import { dataViewBodyStates } from "@app/components/dataViewStates";
import { ListPagination } from "@app/components/ListPagination";
import { ResourceHrefLink } from "@app/components/ResourceHrefLink";
import { TableEmptyState } from "@app/components/TableEmptyState";
import { useObjectsPermissions } from "@app/hooks/useObjectPermissions";
import { REPOSITORY_LOCKED_PROPS } from "@app/hooks/useRepositoryActivity";
import { useResourceTasks } from "@app/hooks/useResourceTasks";
import { useSelectedDomain } from "@app/hooks/useSelectedDomain";
import {
  repositoryKeys,
  useRepositoriesListQuery,
} from "@app/queries/repositories";
import {
  extractIdFromHref,
  resolvePulpType,
} from "@app/queries/utils/pulpHref";
import { formatDateTime } from "@app/utils/utils";
import { getPulpType } from "@catalog";

interface IContentRepositoriesTabProps {
  href: string;
  /** Asks to remove the content from a repository (the page confirms and runs it). */
  onRemoveFromRepository: (repository: RepositoryResponse) => void;
  /** This page's content change is running: row actions wait for it. */
  isLocked: boolean;
}

const COLUMNS = ["Repository", "Type", "Latest version", "Last updated"];

const locationAnswer = (count: number): string => {
  if (count === 0) return "Not in any repository.";
  if (count === 1) return "In the latest version of 1 repository.";
  return `In the latest version of ${count} repositories.`;
};

/**
 * The repositories whose latest version contains the content unit
 * (`latest_with_content`), not ones it was removed from.
 */
export const ContentRepositoriesTab: React.FC<IContentRepositoriesTabProps> = ({
  href,
  onRemoveFromRepository,
  isLocked,
}) => {
  const { name: pulpDomain } = useSelectedDomain();
  const pagination = useDataViewPagination({ perPage: 10 });
  const { data, isLoading, error } = useRepositoriesListQuery({
    params: {
      latest_with_content: href,
      ordering: "name",
      limit: pagination.perPage,
      offset: (pagination.page - 1) * pagination.perPage,
    },
  });

  const repositories = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  // A task on a row's repository (e.g. a sync started elsewhere) locks that row too.
  const queryClient = useQueryClient();
  const { disabledProps } = useObjectsPermissions({
    hrefs: repositories.map((repository) => repository.pulp_href ?? ""),
  });
  const { getActiveCount } = useResourceTasks({
    entities: repositories,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: repositoryKeys.list() });
    },
  });

  const { activeState, bodyStates } = dataViewBodyStates({
    columnCount: COLUMNS.length + 1,
    isLoading,
    error,
    isEmpty: repositories.length === 0,
    emptyState: (
      <TableEmptyState
        title="Not in any repository"
        body="No repository's latest version contains this content."
      />
    ),
  });

  return (
    <>
      {/* A plain Table: `DataViewTable` can't render a `<Caption>`. */}
      <Table
        aria-label="Repositories containing this content"
        variant="compact"
      >
        <Caption>
          <strong>Where is this package now?</strong>{" "}
          {!isLoading && !error && locationAnswer(totalCount)}
        </Caption>
        <Thead>
          <Tr>
            {COLUMNS.map((column) => (
              <Th key={column}>{column}</Th>
            ))}
            <Th screenReaderText="Actions" />
          </Tr>
        </Thead>
        {activeState ? (
          bodyStates[activeState]
        ) : (
          <Tbody>
            {repositories.map((repository) => {
              const pulpType = resolvePulpType(repository.pulp_href);
              const latestHref = repository.latest_version_href;
              const latestNumber = latestHref
                ? extractIdFromHref(latestHref)
                : undefined;
              return (
                <Tr key={repository.pulp_href}>
                  <Td dataLabel="Repository">
                    <ResourceHrefLink
                      kind="repository"
                      href={repository.pulp_href}
                      label={repository.name}
                    />
                  </Td>
                  <Td dataLabel="Type">
                    {pulpType ? <Label color="blue">{pulpType}</Label> : "—"}
                  </Td>
                  <Td dataLabel="Latest version">
                    {pulpType && latestNumber != null ? (
                      <Link
                        to="/content-management/$pulpDomain/repositories/$repositoryType/$repositoryId/versions/$versionNumber"
                        params={{
                          pulpDomain,
                          repositoryType: pulpType,
                          repositoryId: extractIdFromHref(
                            repository.pulp_href ?? "",
                          ),
                          versionNumber: latestNumber,
                        }}
                      >
                        Version {latestNumber}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td dataLabel="Last updated">
                    {formatDateTime(repository.pulp_last_updated) ?? "—"}
                  </Td>
                  <Td isActionCell>
                    {getPulpType(pulpType ?? "")?.entities.repository
                      ?.contentChanges && (
                      <ActionsColumn
                        items={[
                          {
                            title: "Remove from this repository",
                            onClick: () => onRemoveFromRepository(repository),
                            ...(isLocked || getActiveCount(repository.prn) > 0
                              ? REPOSITORY_LOCKED_PROPS
                              : {}),
                            ...disabledProps({
                              href: repository.pulp_href,
                              verb: "modify",
                            }),
                          },
                        ]}
                      />
                    )}
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        )}
      </Table>
      <ListPagination
        variant={PaginationVariant.bottom}
        itemCount={totalCount}
        pagination={pagination}
      />
    </>
  );
};
