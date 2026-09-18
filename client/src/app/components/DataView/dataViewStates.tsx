import type React from "react";

import { Bullseye } from "@patternfly/react-core";
import { Tbody, Td, Tr } from "@patternfly/react-table";
import { DataViewState } from "@patternfly/react-data-view";
import ErrorState from "@patternfly/react-component-groups/dist/dynamic/ErrorState";
import SkeletonTableBody from "@patternfly/react-component-groups/dist/dynamic/SkeletonTableBody";
import { css } from "@patternfly/react-styles";
import checkStyles from "@patternfly/react-styles/css/components/Check/check";
import tableStyles from "@patternfly/react-styles/css/components/Table/table";

import { UnauthorizedState } from "@app/components/UnauthorizedState";
import { isForbiddenError } from "@app/utils/isHttpError";

interface IDataViewStatesArgs<TError = unknown> {
  /** Data columns only; leading control columns are set via the flags below. */
  columnCount: number;
  hasSelectionColumn?: boolean;
  hasExpansionColumn?: boolean;
  loadingRows?: number;
  isLoading?: boolean;
  loadingState?: React.ReactNode;
  error?: TError | null;
  errorState?: (error: TError) => React.ReactNode;
  isEmpty?: boolean;
  emptyState?: React.ReactNode;
}

export const dataViewBodyStates = <TError = unknown,>({
  columnCount,
  hasSelectionColumn,
  hasExpansionColumn,
  loadingRows = 10,
  isLoading,
  loadingState,
  error,
  errorState,
  isEmpty,
  emptyState,
}: IDataViewStatesArgs<TError>): {
  activeState: DataViewState | undefined;
  bodyStates: Partial<Record<DataViewState, React.ReactNode>>;
} => {
  const activeState = isLoading
    ? DataViewState.loading
    : error != null
      ? DataViewState.error
      : isEmpty
        ? DataViewState.empty
        : undefined;

  // The empty standalone-check div (no `<input>`) carries the checkbox's
  // footprint, pinning the selection column to the same width as the loading/data
  // states without rendering a visible control. The message spans data columns
  // only so it stays centered on what the user reads.
  const wrapCentered = (node: React.ReactNode): React.ReactNode => (
    <Tbody>
      <Tr>
        {hasExpansionColumn && <Td className={tableStyles.tableToggle} />}
        {hasSelectionColumn && (
          <Td className={tableStyles.tableCheck}>
            <div
              className={css(
                checkStyles.check,
                checkStyles.modifiers.standalone,
              )}
            />
          </Td>
        )}
        <Td colSpan={columnCount}>
          <Bullseye>{node}</Bullseye>
        </Td>
      </Tr>
    </Tbody>
  );

  const bodyStates: Partial<Record<DataViewState, React.ReactNode>> = {
    [DataViewState.loading]: loadingState ?? (
      <SkeletonTableBody
        rowsCount={loadingRows}
        columnsCount={columnCount}
        isSelectable={hasSelectionColumn}
        isExpandable={hasExpansionColumn}
      />
    ),
    [DataViewState.error]:
      errorState && error != null
        ? errorState(error)
        : isForbiddenError(error)
          ? wrapCentered(<UnauthorizedState />)
          : wrapCentered(
              <ErrorState
                status="danger"
                titleText="Unable to load data"
                bodyText="Something went wrong while loading this table."
              />,
            ),
    [DataViewState.empty]: wrapCentered(emptyState),
  };

  return { activeState, bodyStates };
};
