import type React from "react";

import {
  Button,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  PageSection,
} from "@patternfly/react-core";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";

import { useNavigate } from "@tanstack/react-router";

interface RouteErrorFallbackProps {
  error: unknown;
  reset: () => void;
}

/** Full-page error boundary fallback for TanStack Router errorComponent. */
export const RouteErrorFallback: React.FC<RouteErrorFallbackProps> = ({
  error,
  reset,
}) => {
  const navigate = useNavigate();

  const message =
    error instanceof Error ? error.message : "An unexpected error occurred.";

  return (
    <PageSection>
      <EmptyState
        titleText="Something went wrong"
        headingLevel="h1"
        icon={ExclamationCircleIcon}
      >
        <EmptyStateBody>{message}</EmptyStateBody>
        <EmptyStateFooter>
          <EmptyStateActions>
            <Button
              variant="primary"
              onClick={() => {
                reset();
                void navigate({ to: "/" });
              }}
            >
              Go to Dashboard
            </Button>
            <Button
              variant="secondary"
              onClick={() => window.location.reload()}
            >
              Reload page
            </Button>
          </EmptyStateActions>
        </EmptyStateFooter>
      </EmptyState>
    </PageSection>
  );
};
