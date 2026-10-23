import type React from "react";

import { Link } from "@tanstack/react-router";

import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
  ContentVariants,
} from "@patternfly/react-core";

import { useVulnReportsListQuery } from "@app/queries/vuln-reports";

/** How many content units have vulnerability reports in the selected domain. */
export const VulnerabilitiesCard: React.FC<{ pulpDomain: string }> = ({
  pulpDomain,
}) => {
  const { data } = useVulnReportsListQuery({
    params: { limit: 1, offset: 0 },
  });
  const count = data?.count ?? 0;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vulnerabilities</CardTitle>
      </CardHeader>
      <CardBody>
        <Content component={ContentVariants.p}>
          {count === 0
            ? "No vulnerability reports."
            : `${count} scanned content unit${count === 1 ? "" : "s"} with reports.`}
        </Content>
        <Link
          to="/monitoring/$pulpDomain/vulnerability-reports"
          params={{ pulpDomain }}
        >
          View reports
        </Link>
      </CardBody>
    </Card>
  );
};
