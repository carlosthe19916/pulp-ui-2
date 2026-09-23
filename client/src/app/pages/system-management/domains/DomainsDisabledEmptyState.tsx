import type React from "react";

import {
  Content,
  ContentVariants,
  EmptyState,
  EmptyStateBody,
  PageSection,
} from "@patternfly/react-core";
import { CubesIcon } from "@patternfly/react-icons";

import { DocumentTitle } from "@app/components/DocumentTitle";

/** Shown when pulpcore is not running with `DOMAIN_ENABLED`. */
export const DomainsDisabledEmptyState: React.FC = () => (
  <>
    <DocumentTitle title="Domains" />
    <PageSection>
      <Content component={ContentVariants.h1}>Domains</Content>
      <EmptyState
        variant="sm"
        icon={CubesIcon}
        titleText="Domains are not enabled"
        headingLevel="h4"
      >
        <EmptyStateBody>
          This Pulp deployment is not running with domains enabled. A domain is
          a tenancy boundary (similar to a namespace) that isolates content and
          has its own storage backend. Ask an administrator to set{" "}
          <code>DOMAIN_ENABLED</code> to manage domains.
        </EmptyStateBody>
      </EmptyState>
    </PageSection>
  </>
);
