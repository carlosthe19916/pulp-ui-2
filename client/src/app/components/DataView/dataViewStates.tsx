import type React from "react";

import {
  Bullseye,
  EmptyState,
  EmptyStateBody,
  Spinner,
} from "@patternfly/react-core";
import { ExclamationCircleIcon } from "@patternfly/react-icons";
import { DataViewState } from "@patternfly/react-data-view";

import { UnauthorizedState } from "@app/components/UnauthorizedState";
import { isForbiddenError } from "@app/utils/isHttpError";

interface IDataViewStatesArgs<TError = unknown> {
  loading?: boolean;
  loadingState?: React.ReactNode;
  error?: TError | null;
  errorState?: (error: TError) => React.ReactNode;
  empty?: boolean;
  emptyState?: React.ReactNode;
}

export const dataViewBodyStates = <TError = unknown,>({
  loading,
  loadingState,
  error,
  errorState,
  empty,
  emptyState,
}: IDataViewStatesArgs<TError> = {}): {
  activeState: DataViewState | undefined;
  bodyStates: Partial<Record<DataViewState, React.ReactNode>>;
} => {
  const activeState = loading
    ? DataViewState.loading
    : error != null
      ? DataViewState.error
      : empty
        ? DataViewState.empty
        : undefined;

  const bodyStates: Partial<Record<DataViewState, React.ReactNode>> = {
    [DataViewState.loading]: loadingState ?? (
      <Bullseye>
        <Spinner aria-label="Loading" />
      </Bullseye>
    ),
    [DataViewState.error]:
      errorState && error != null ? (
        errorState(error)
      ) : isForbiddenError(error) ? (
        <UnauthorizedState />
      ) : (
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
    [DataViewState.empty]: emptyState ?? (
      <EmptyState titleText="No results found" headingLevel="h4" />
    ),
  };

  return { activeState, bodyStates };
};
