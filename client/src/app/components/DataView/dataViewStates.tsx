import type React from "react";

import {
  Bullseye,
  EmptyState,
  EmptyStateBody,
  Spinner,
} from "@patternfly/react-core";
import { ExclamationCircleIcon } from "@patternfly/react-icons";
import { DataViewState } from "@patternfly/react-data-view";

interface IDataViewStateNodes {
  /** Overrides the default centered spinner. */
  loading?: React.ReactNode;
  /** Overrides the default "no results" empty state. */
  empty?: React.ReactNode;
  /** Overrides the default error empty state. */
  error?: React.ReactNode;
}

/**
 * Builds the `bodyStates` map for `DataViewTable`, one node per PatternFly
 * `DataViewState`. Defaults mirror the loading / error / empty visuals the app
 * used before adopting react-data-view; any slot can be overridden per page.
 */
export const dataViewBodyStates = (
  overrides: IDataViewStateNodes = {},
): Partial<Record<DataViewState, React.ReactNode>> => {
  return {
    [DataViewState.loading]: overrides.loading ?? (
      <Bullseye>
        <Spinner aria-label="Loading" />
      </Bullseye>
    ),
    [DataViewState.error]: overrides.error ?? (
      <EmptyState
        status="danger"
        icon={ExclamationCircleIcon}
        titleText="Unable to load data"
        headingLevel="h4"
      >
        <EmptyStateBody>
          Something went wrong while loading this table.
        </EmptyStateBody>
      </EmptyState>
    ),
    [DataViewState.empty]: overrides.empty ?? (
      <EmptyState titleText="No results found" headingLevel="h4" />
    ),
  };
};

interface IComputeActiveStateArgs {
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
}

/**
 * Resolve the single active `DataViewState` for `DataView.activeState`.
 * Precedence: loading → error → empty; otherwise `undefined` (render rows).
 */
export const computeActiveState = ({
  isLoading,
  isError,
  isEmpty,
}: IComputeActiveStateArgs): DataViewState | undefined => {
  if (isLoading) return DataViewState.loading;
  if (isError) return DataViewState.error;
  if (isEmpty) return DataViewState.empty;
  return undefined;
};
