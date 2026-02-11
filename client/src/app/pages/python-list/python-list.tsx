import React from "react";

import {
  Divider,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  PageSection,
  Title,
} from "@patternfly/react-core";
import CubesIcon from "@patternfly/react-icons/dist/esm/icons/cubes-icon";

import type { DistributionResponse } from "@app/client";
import { DocumentMetadata } from "@app/components/DocumentMetadata";
import { useFetchDistributions } from "@app/queries/distributions";

import { CardList } from "./components/CardList";
import { DistributionSelector } from "./components/DistributionsSelector";

export const PythonList: React.FC = () => {
  const { distributions } = useFetchDistributions();
  const [selectedDistribution, setSelectedDistribution] =
    React.useState<DistributionResponse | null>(null);
  const onDistributionSelected = (value: DistributionResponse) => {
    setSelectedDistribution(value);
  };

  return (
    <>
      <DocumentMetadata title={"Python"} />
      <PageSection type="breadcrumb">
        <DistributionSelector
          distributions={distributions}
          selected={selectedDistribution}
          onChange={onDistributionSelected}
        />
      </PageSection>
      <PageSection>
        <Divider />
      </PageSection>
      {selectedDistribution ? (
        <>
          <PageSection>
            <Title headingLevel="h1" size="2xl">
              {selectedDistribution.name}
            </Title>
          </PageSection>
          <PageSection>
            {selectedDistribution && (
              <CardList distribution={selectedDistribution} />
            )}
          </PageSection>
        </>
      ) : (
        <PageSection>
          <EmptyState
            titleText="Empty state"
            headingLevel="h4"
            icon={CubesIcon}
          >
            <EmptyStateBody>
              Packages are grouped in distributions. Select one to see packages.
            </EmptyStateBody>
            <EmptyStateFooter>
              <EmptyStateActions>
                <DistributionSelector
                  distributions={distributions}
                  selected={selectedDistribution}
                  onChange={onDistributionSelected}
                />
              </EmptyStateActions>
            </EmptyStateFooter>
          </EmptyState>
        </PageSection>
      )}
    </>
  );
};
