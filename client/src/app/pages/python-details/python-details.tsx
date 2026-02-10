import type React from "react";

import {
  PageSection,
  PageSectionVariants,
  Title,
} from "@patternfly/react-core";

import { DocumentMetadata } from "@app/components/DocumentMetadata";
import { useFetchPackageById } from "@app/queries/packages";
import { PathParam, useRouteParams } from "@app/Routes";

export const PythonDetails: React.FC = () => {
  const packageId = useRouteParams(PathParam.PYTHON_ID);
  const { pkg } = useFetchPackageById(packageId);

  return (
    <>
      <DocumentMetadata title={"Python"} />
      <PageSection variant={PageSectionVariants.default}>
        <Title headingLevel="h1" size="2xl">
          Python Details
        </Title>
      </PageSection>
      <PageSection>{pkg?.name}</PageSection>
    </>
  );
};
