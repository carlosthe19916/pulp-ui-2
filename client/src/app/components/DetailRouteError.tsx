import type React from "react";

import type { ErrorComponentProps } from "@tanstack/react-router";

import { PageSection } from "@patternfly/react-core";
import ExclamationCircleIcon from "@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon";
import LockIcon from "@patternfly/react-icons/dist/esm/icons/lock-icon";
import PathMissingIcon from "@patternfly/react-icons/dist/esm/icons/path-missing-icon";

import { FullPageEmptyState } from "@app/components/FullPageEmptyState";
import { isForbiddenError, isNotFoundError } from "@app/utils/isHttpError";

/** Shared route `errorComponent` for detail pages: 403 / 404 / generic states. */
export const DetailRouteError: React.FC<ErrorComponentProps> = ({ error }) => {
  if (isForbiddenError(error)) {
    return (
      <PageSection>
        <FullPageEmptyState
          titleText="403: Access denied"
          icon={LockIcon}
          body="You do not have permission to view this page. Contact your administrator if you believe this is an error."
        />
      </PageSection>
    );
  }

  if (isNotFoundError(error)) {
    return (
      <PageSection>
        <FullPageEmptyState
          titleText="404: That page does not exist"
          icon={PathMissingIcon}
          body="Another page might have the information you need."
        />
      </PageSection>
    );
  }

  return (
    <PageSection>
      <FullPageEmptyState
        titleText="Unable to load resource"
        icon={ExclamationCircleIcon}
        status="danger"
        body="Something went wrong while loading this page. Try again later."
      />
    </PageSection>
  );
};
