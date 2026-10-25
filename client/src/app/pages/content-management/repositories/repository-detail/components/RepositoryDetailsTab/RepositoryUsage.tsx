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
import {
  repositoryDistributionsPickerParams,
  useDistributionsListQuery,
} from "@app/queries/distributions";

interface IRepositoryUsageProps {
  repositoryHref: string;
  onViewDistributions: () => void;
}

/**
 * How clients consume the repository: the content URL and setup snippet of one of the
 * distributions serving it directly.
 */
export const RepositoryUsage: React.FC<IRepositoryUsageProps> = ({
  repositoryHref,
  onViewDistributions,
}) => {
  const { data, isLoading } = useDistributionsListQuery({
    params: repositoryDistributionsPickerParams(repositoryHref),
  });
  const [selectedHref, setSelectedHref] = useState<string>();

  if (isLoading) {
    return null;
  }

  const distributions = data?.results ?? [];

  const selected =
    distributions.find((d) => d.pulp_href === selectedHref) ?? distributions[0];
  if (!selected) {
    return (
      <EmptyState titleText="Not served yet" headingLevel="h4" variant="xs">
        <EmptyStateBody>
          No distribution serves this repository directly. Create one for it to
          let clients consume it; distributions serving one of its publications
          aren&apos;t listed here.
        </EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <Stack hasGutter>
      {(data?.count ?? 0) > 1 && (
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
