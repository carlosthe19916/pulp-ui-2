import type { ErrorComponentProps } from "@tanstack/react-router";

import {
  EmptyState,
  EmptyStateBody,
  PageSection,
} from "@patternfly/react-core";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";

import { NotFoundEmptyState } from "@app/components/NotFoundEmptyState";
import { UnauthorizedState } from "@app/components/UnauthorizedState";
import { isForbiddenError, isNotFoundError } from "@app/utils/isHttpError";

/**
 * Shared route `errorComponent` for detail pages. Classifies loader/query
 * failures into 403 / 404 / generic states — the same branches the former
 * `DetailQueryGate` rendered in-component.
 */
export const DetailRouteError = ({ error }: ErrorComponentProps) => {
  if (isForbiddenError(error)) {
    return (
      <PageSection>
        <UnauthorizedState />
      </PageSection>
    );
  }

  if (isNotFoundError(error)) {
    return (
      <PageSection>
        <NotFoundEmptyState />
      </PageSection>
    );
  }

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
};
