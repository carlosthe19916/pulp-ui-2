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
          titleText="Access permissions needed"
          icon={LockIcon}
          body="To view this page, ask your administrator to adjust your permissions."
        />
      </PageSection>
    );
  }

  if (isNotFoundError(error)) {
    return (
      <PageSection>
        <FullPageEmptyState
          titleText="404: That page no longer exists"
          icon={PathMissingIcon}
          body="Another page might have what you need."
        />
      </PageSection>
    );
  }

  return (
    <PageSection>
      <FullPageEmptyState
        titleText="Unable to load this page"
        icon={ExclamationCircleIcon}
        status="danger"
        body="Check your connection and reload the page."
      />
    </PageSection>
  );
};
