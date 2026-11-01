import type React from "react";

import {
  ClipboardCopy,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Stack,
  Title,
} from "@patternfly/react-core";

import type { WorkerResponse } from "@app/client";

interface IWorkerDetailsProps {
  worker: WorkerResponse;
}

/** Expanded-row detail of a worker: its PRN and the versions of its components. */
export const WorkerDetails: React.FC<IWorkerDetailsProps> = ({ worker }) => {
  const versions = Object.entries(worker.versions ?? {}).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  return (
    <Stack hasGutter>
      <DescriptionList isCompact>
        <DescriptionListGroup>
          <DescriptionListTerm>PRN</DescriptionListTerm>
          <DescriptionListDescription>
            {worker.prn ? (
              <ClipboardCopy variant="inline-compact" isCode isReadOnly>
                {worker.prn}
              </ClipboardCopy>
            ) : (
              "—"
            )}
          </DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>
      <Title headingLevel="h3" size="md">
        Component versions
      </Title>
      <DescriptionList
        isCompact
        isHorizontal
        columnModifier={{ default: "1Col", md: "2Col", xl: "3Col" }}
        aria-label="Component versions"
      >
        {versions.map(([component, version]) => (
          <DescriptionListGroup key={component}>
            <DescriptionListTerm>{component}</DescriptionListTerm>
            <DescriptionListDescription>
              {version ?? "—"}
            </DescriptionListDescription>
          </DescriptionListGroup>
        ))}
      </DescriptionList>
    </Stack>
  );
};
