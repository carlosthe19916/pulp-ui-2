import type React from "react";

import { ExpandableSection, Flex, Stack } from "@patternfly/react-core";

import type { PythonPackageProvenanceResponse } from "@app/client";
import {
  ExternalLink,
  FactDescriptions,
  facts,
} from "@app/components/ContentPanelLayout";
import { ResourceHrefLink } from "@app/components/ResourceHrefLink";
import {
  type IRelatedPaging,
  RelatedSection,
} from "@app/components/Signatures";
import { Snippet } from "@app/components/Snippet";

import { readProvenance } from "./provenance";

interface IPythonProvenanceProps {
  provenances: PythonPackageProvenanceResponse[];
  isLoading?: boolean;
  emptyText?: string;
  /** Links each provenance to its own page; off on that page. */
  linkUnit?: boolean;
  paging?: IRelatedPaging;
}

/** PyPI-style provenance: the publisher and transparency log entries; not a verification. */
export const PythonProvenance: React.FC<IPythonProvenanceProps> = ({
  provenances,
  isLoading,
  emptyText,
  linkUnit = true,
  paging,
}) => (
  <RelatedSection
    title="Provenance"
    shown={provenances.length}
    isLoading={isLoading}
    emptyText={emptyText}
    paging={paging}
  >
    {provenances.map((unit) => (
      <Stack key={unit.pulp_href} hasGutter>
        {readProvenance(unit.provenance).map((bundle, index) => {
          const { kind, repository, workflow, environment } = bundle.publisher;
          return (
            <FactDescriptions
              key={`${kind}/${repository}/${workflow}`}
              aria-label="Provenance"
              items={facts({
                Publisher: kind,
                Repository: bundle.repositoryUrl ? (
                  <ExternalLink url={bundle.repositoryUrl}>
                    {repository}
                  </ExternalLink>
                ) : (
                  repository
                ),
                Workflow: workflow,
                Environment: environment,
                Attestations: bundle.attestationCount,
                "Transparency log": bundle.logEntries.length > 0 && (
                  <Flex direction={{ default: "column" }}>
                    {bundle.logEntries.map(({ index: logIndex, url }) => (
                      <ExternalLink key={url} url={url}>
                        Sigstore entry {logIndex}
                      </ExternalLink>
                    ))}
                  </Flex>
                ),
                Provenance: linkUnit && index === 0 && (
                  <ResourceHrefLink
                    kind="content"
                    href={unit.pulp_href}
                    label="View provenance"
                  />
                ),
              })}
            />
          );
        })}
        <ExpandableSection toggleText="Raw provenance">
          <Snippet code={JSON.stringify(unit.provenance, null, 2)} />
        </ExpandableSection>
      </Stack>
    ))}
  </RelatedSection>
);
