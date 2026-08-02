import type React from "react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import dayjs from "dayjs";

import {
  Content,
  ContentVariants,
  Label,
  PageSection,
  Pagination,
  SearchInput,
  Spinner,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";

import { RENDER_DATETIME_FORMAT } from "@app/Constants";
import { useTasksListQuery } from "@app/queries/tasks";

const stateColors: Record<
  string,
  "green" | "blue" | "red" | "orange" | "grey" | "cyan"
> = {
  completed: "green",
  running: "blue",
  failed: "red",
  canceled: "orange",
  canceling: "orange",
  waiting: "cyan",
  skipped: "grey",
};

function getTaskName(name: string): string {
  const parts = name.split(".");
  return parts[parts.length - 1] ?? name;
}

function extractTaskId(href: string): string {
  const parts = href.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? href;
}

export const TaskList: React.FC = () => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [nameFilter, setNameFilter] = useState("");

  const { data, isLoading } = useTasksListQuery({
    limit: perPage,
    offset: (page - 1) * perPage,
    ordering: "-pulp_created",
    name__contains: nameFilter || undefined,
  });

  const tasks = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  return (
    <PageSection>
      <Content component={ContentVariants.h1}>Tasks</Content>

      <Toolbar>
        <ToolbarContent>
          <ToolbarItem>
            <SearchInput
              placeholder="Filter by name..."
              value={nameFilter}
              onChange={(_e, value) => {
                setNameFilter(value);
                setPage(1);
              }}
              onClear={() => {
                setNameFilter("");
                setPage(1);
              }}
            />
          </ToolbarItem>
          <ToolbarItem variant="pagination">
            <Pagination
              itemCount={totalCount}
              perPage={perPage}
              page={page}
              onSetPage={(_e, p) => setPage(p)}
              onPerPageSelect={(_e, pp) => {
                setPerPage(pp);
                setPage(1);
              }}
              isCompact
            />
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>

      {isLoading ? (
        <Spinner aria-label="Loading tasks" />
      ) : (
        <Table aria-label="Tasks table" variant="compact">
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>State</Th>
              <Th>Started</Th>
              <Th>Finished</Th>
            </Tr>
          </Thead>
          <Tbody>
            {tasks.map((task) => {
              const taskId = extractTaskId(task.pulp_href ?? "");
              return (
                <Tr key={task.pulp_href}>
                  <Td>
                    <Link to="/tasks/$taskId" params={{ taskId }}>
                      {getTaskName(task.name)}
                    </Link>
                  </Td>
                  <Td>
                    <Label
                      color={stateColors[task.state ?? ""] ?? "grey"}
                      isCompact
                    >
                      {task.state}
                    </Label>
                  </Td>
                  <Td>
                    {task.started_at
                      ? dayjs(task.started_at).format(RENDER_DATETIME_FORMAT)
                      : "—"}
                  </Td>
                  <Td>
                    {task.finished_at
                      ? dayjs(task.finished_at).format(RENDER_DATETIME_FORMAT)
                      : "—"}
                  </Td>
                </Tr>
              );
            })}
            {tasks.length === 0 && (
              <Tr>
                <Td colSpan={4}>No tasks found.</Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      )}

      <Pagination
        itemCount={totalCount}
        perPage={perPage}
        page={page}
        onSetPage={(_e, p) => setPage(p)}
        onPerPageSelect={(_e, pp) => {
          setPerPage(pp);
          setPage(1);
        }}
        variant="bottom"
      />
    </PageSection>
  );
};
