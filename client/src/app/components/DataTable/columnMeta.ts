import type { RowData } from "@tanstack/react-table";

// Per-column PatternFly Th/Td props, carried on the TanStack column definition so
// the generic <DataTable> render loop can apply them (e.g. action-cell styling).
// This augmentation is global once the file is part of the TypeScript program, so
// every column definition across the app can set these meta fields.
declare module "@tanstack/react-table" {
  // Augmenting a third-party interface, so the name and unused type params are fixed.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/naming-convention
  interface ColumnMeta<TData extends RowData, TValue> {
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
