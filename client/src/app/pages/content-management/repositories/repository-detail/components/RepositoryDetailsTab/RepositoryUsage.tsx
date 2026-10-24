import type React from "react";
import { useState } from "react";

import {
  Button,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  EmptyState,
  EmptyStateBody,
  Flex,
  FlexItem,
  FormSelect,
  FormSelectOption,
  Stack,
} from "@patternfly/react-core";

import { ContentUrlLink } from "@app/components/ContentUrlLink";
import { PluginRepositoryClientSetup } from "@app/components/PluginRepositoryClientSetup";

import { useServingDistributions } from "@app/hooks/useServingDistributions";

interface IRepositoryUsageProps {
  repositoryHref: string;
  pulpType: string;
  onViewDistributions: () => void;
}

/** How clients consume the repository: the content URL and setup snippet of one of its distributions. */
export const RepositoryUsage: React.FC<IRepositoryUsageProps> = ({
  repositoryHref,
  pulpType,
  onViewDistributions,
}) => {
  const { distributions, isLoading } = useServingDistributions({
    repositoryHref,
    pulpType,
  });
  const [selectedHref, setSelectedHref] = useState<string>();

  if (isLoading) {
    return null;
  }

  const selected =
    distributions.find((d) => d.pulp_href === selectedHref) ?? distributions[0];
  if (!selected) {
    return (
      <EmptyState titleText="Not served yet" headingLevel="h4" variant="xs">
        <EmptyStateBody>
          Create a distribution for this repository to let clients consume it.
        </EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <Stack hasGutter>
      {distributions.length > 1 && (
        <Flex
          spaceItems={{ default: "spaceItemsMd" }}
          alignItems={{ default: "alignItemsCenter" }}
        >
          <FlexItem>
            <FormSelect
              aria-label="Distribution"
              value={selected.pulp_href}
              onChange={(_e, value) => setSelectedHref(value)}
            >
              {distributions.map((d) => (
                <FormSelectOption
                  key={d.pulp_href}
                  value={d.pulp_href}
                  label={`${d.name} (${d.base_path})`}
                />
              ))}
            </FormSelect>
          </FlexItem>
          <FlexItem>
            <Button variant="link" isInline onClick={onViewDistributions}>
              View all distributions
            </Button>
          </FlexItem>
        </Flex>
      )}
      <DescriptionList isCompact isHorizontal>
        <DescriptionListGroup>
          <DescriptionListTerm>Content URL</DescriptionListTerm>
          <DescriptionListDescription>
            <ContentUrlLink distribution={selected} />
          </DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>
      <PluginRepositoryClientSetup distribution={selected} />
    </Stack>
  );
};
