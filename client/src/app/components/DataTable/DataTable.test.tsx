import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DataTable, useDataTable, type AppColumnDef } from "./index";

interface ITestRow {
  id: string;
  name: string;
}

// Declared at module scope so the column identity is stable across renders,
// exercising the same memoized-columns pattern the real pages use.
const columns: AppColumnDef<ITestRow>[] = [
  { accessorKey: "name", header: "Name" },
  {
    id: "actions",
    header: "",
    meta: { screenReaderHeader: "Actions", isActionCell: true },
    cell: () => (
      <button type="button" aria-label="Edit">
        Edit
      </button>
    ),
  },
];

// Renders the shared <DataTable> through the real v9 useDataTable/useTable path,
// which is the seam the migration touches.
function TableHarness({ data }: { data: ITestRow[] }) {
  const table = useDataTable({ data, columns });
  return (
    <DataTable
      table={table}
      ariaLabel="Test table"
      isEmpty={data.length === 0}
      emptyStateContent="No rows found."
    />
  );
}

describe("DataTable", () => {
  it("renders column headers and one row per data item", () => {
    render(
      <TableHarness
        data={[
          { id: "1", name: "Alpha" },
          { id: "2", name: "Beta" },
        ]}
      />,
    );

    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Beta")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Edit" })).toHaveLength(2);
  });

  it("renders the empty-state content when there are no rows", () => {
    render(<TableHarness data={[]} />);

    expect(screen.getByText("No rows found.")).toBeInTheDocument();
    expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
  });

  it("applies column meta (screenReaderHeader) to the header cell", () => {
    render(<TableHarness data={[{ id: "1", name: "Alpha" }]} />);

    // PatternFly renders `screenReaderText` as visually-hidden header text.
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });
});
