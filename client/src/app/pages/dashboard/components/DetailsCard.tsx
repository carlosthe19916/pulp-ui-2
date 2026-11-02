import type React from "react";

import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  ExpandableSection,
  Skeleton,
} from "@patternfly/react-core";

import { useApiStatus } from "@app/hooks/useApiStatus";

import { DashboardCard } from "./DashboardCard";

/** The Pulp version, its plugins, the content origin and whether domains are on. */
export const DetailsCard: React.FC = () => {
  const { status, isLoading } = useApiStatus();

  if (isLoading || !status) {
    return (
      <DashboardCard title="Details">
        <Skeleton screenreaderText="Loading details" height="8rem" />
      </DashboardCard>
    );
  }

  const core = status.versions.find((v) => v.component === "core");
  const plugins = status.versions
    .filter((v) => v.component !== "core")
    .sort((a, b) => a.component.localeCompare(b.component));
  const contentSettings = status.content_settings;

  return (
    <DashboardCard title="Details">
      <DescriptionList isCompact isHorizontal>
        <DescriptionListGroup>
          <DescriptionListTerm>Pulp version</DescriptionListTerm>
          <DescriptionListDescription>
            {core?.version ?? "—"}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Plugins</DescriptionListTerm>
          <DescriptionListDescription>
            <ExpandableSection
              toggleTextCollapsed={`${plugins.length} installed — show versions`}
              toggleTextExpanded="Hide versions"
            >
              <DescriptionList isCompact isHorizontal aria-label="Plugins">
                {plugins.map((v) => (
                  <DescriptionListGroup key={v.component}>
                    <DescriptionListTerm>{v.component}</DescriptionListTerm>
                    <DescriptionListDescription>
                      {v.version}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                ))}
              </DescriptionList>
            </ExpandableSection>
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Content origin</DescriptionListTerm>
          <DescriptionListDescription>
            {contentSettings.content_origin
              ? `${contentSettings.content_origin}${contentSettings.content_path_prefix}`
              : "—"}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Domains</DescriptionListTerm>
          <DescriptionListDescription>
            {status.domain_enabled ? "Enabled" : "Disabled"}
          </DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>
    </DashboardCard>
  );
};
