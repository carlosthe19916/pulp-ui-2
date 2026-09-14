/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/naming-convention --
   augmenting a third-party interface: its name (`ColumnMeta`, no `I` prefix)
   and type parameters are fixed by the library and only used here for
   declaration merging. */
import type { CellData, RowData, TableFeatures } from "@tanstack/react-table";

// Per-column PatternFly Th/Td props, carried on the TanStack column definition so
// the generic <DataTable> render loop can apply them (e.g. action-cell styling).
// This augmentation is global once the file is part of the TypeScript program, so
// every column definition across the app can set these meta fields.
//
// The type parameters must match TanStack Table's own `ColumnMeta` declaration
// exactly (names may differ, but constraints and variance annotations must line
// up) for declaration merging to apply.
declare module "@tanstack/react-table" {
  interface ColumnMeta<
    in out TFeatures extends TableFeatures,
    in out TData extends RowData,
    TValue extends CellData = CellData,
  > {
    /** Renders the header cell as visually-hidden text for accessibility. */
    screenReaderHeader?: string;
    /** Marks the body cell as an action cell (kebab/dropdown). */
    isActionCell?: boolean;
    /** Aligns an interactive body cell (e.g. inline button) with text cells. */
    hasAction?: boolean;
    /** Shrinks the column to fit its content. */
    fitContent?: boolean;
  }
}
