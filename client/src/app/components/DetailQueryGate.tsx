import type { ReactNode } from "react";

import {
  EmptyState,
  EmptyStateBody,
  PageSection,
  Spinner,
} from "@patternfly/react-core";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";

import { NotFoundEmptyState } from "@app/components/NotFoundEmptyState";
import { UnauthorizedState } from "@app/components/UnauthorizedState";
import { isForbiddenError, isNotFoundError } from "@app/utils/isHttpError";

interface DetailQueryGateProps {
  isLoading: boolean;
  error: unknown;
  hasData: boolean;
  loadingLabel: string;
  children: ReactNode;
}

/** Shared loading / 403 / 404 / error gate for admin detail pages. */
export function DetailQueryGate({
  isLoading,
  error,
  hasData,
  loadingLabel,
  children,
}: DetailQueryGateProps) {
  if (isLoading) {
    return (
      <PageSection>
        <Spinner aria-label={loadingLabel} />
      </PageSection>
    );
  }

  if (isForbiddenError(error)) {
    return (
      <PageSection>
        <UnauthorizedState />
      </PageSection>
    );
  }

  if (isNotFoundError(error) || (!error && !hasData)) {
    return (
      <PageSection>
        <NotFoundEmptyState />
      </PageSection>
    );
  }

  if (error || !hasData) {
    return (
      <PageSection>
        <EmptyState
          titleText="Unable to load resource"
          headingLevel="h4"
          icon={ExclamationCircleIcon}
        >
          <EmptyStateBody>
            Something went wrong while loading this page. Try again later.
          </EmptyStateBody>
        </EmptyState>
      </PageSection>
    );
  }

  return children;
}
