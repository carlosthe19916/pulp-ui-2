import type React from "react";

import { useNavigate } from "@tanstack/react-router";

import { Button, PageSection } from "@patternfly/react-core";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";

import { FullPageEmptyState } from "@app/components/FullPageEmptyState";

interface IRouteErrorFallbackProps {
  error: unknown;
  reset: () => void;
}

/** Full-page error boundary fallback for TanStack Router errorComponent. */
export const RouteErrorFallback: React.FC<IRouteErrorFallbackProps> = ({
  error,
  reset,
}) => {
  const navigate = useNavigate();

  const message =
    error instanceof Error ? error.message : "An unexpected error occurred.";

  return (
    <PageSection>
      <FullPageEmptyState
        titleText="Something went wrong"
        icon={ExclamationCircleIcon}
        status="danger"
        body={message}
        actions={
          <>
            <Button
              variant="primary"
              onClick={() => {
                reset();
                void navigate({ to: "/" });
              }}
            >
              Go to dashboard
            </Button>
            <Button
              variant="secondary"
              onClick={() => window.location.reload()}
            >
              Reload page
            </Button>
          </>
        }
      />
    </PageSection>
  );
};
