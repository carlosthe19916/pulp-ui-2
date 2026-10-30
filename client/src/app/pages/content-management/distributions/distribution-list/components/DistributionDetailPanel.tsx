import type React from "react";

import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from "@patternfly/react-core";

import type { DistributionResponse } from "@app/client";
import { ContentUrlLink } from "@app/components/ContentUrlLink";
import { EditablePulpLabels } from "@app/components/EditablePulpLabels";
import { NamedResourceHrefLink } from "@app/components/NamedResourceHrefLink";
import { PluginRepositoryClientSetup } from "@app/components/PluginRepositoryClientSetup";
import { useNotifications } from "@app/hooks/useNotifications";
import { useDistributionLabelsMutation } from "@app/queries/distributions";
import { notifyLabelsResult } from "@app/utils/batchNotify";
import { formatDateTime } from "@app/utils/utils";

interface IDistributionDetailPanelProps {
  distribution: DistributionResponse;
}

/**
 * Expanded-row detail for a distribution: what the list columns omit (serving URL,
 * content guard, what it serves, metadata).
 */
export const DistributionDetailPanel: React.FC<
  IDistributionDetailPanelProps
> = ({ distribution }) => {
  const record = distribution as Record<string, unknown>;
  // Plugin-specific (file distributions): only on typed payloads.
  const publication =
    typeof record.publication === "string" ? record.publication : null;
  const href = distribution.pulp_href ?? "";
  const { addNotification } = useNotifications();
  const { mutateAsync, isPending } = useDistributionLabelsMutation({
    onSuccess: (result) => notifyLabelsResult({ addNotification, result }),
  });

  return (
    <DescriptionList isCompact>
      <DescriptionListGroup>
        <DescriptionListTerm>Base URL</DescriptionListTerm>
        <DescriptionListDescription>
          <ContentUrlLink distribution={distribution} />
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Client setup</DescriptionListTerm>
        <DescriptionListDescription>
          <PluginRepositoryClientSetup distribution={distribution} />
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Content guard</DescriptionListTerm>
        <DescriptionListDescription>
          {distribution.content_guard || "—"}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Repository</DescriptionListTerm>
        <DescriptionListDescription>
          <NamedResourceHrefLink
            kind="repository"
            href={distribution.repository}
          />
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Repository version</DescriptionListTerm>
        <DescriptionListDescription>
          <NamedResourceHrefLink
            kind="repositoryVersion"
            href={distribution.repository_version}
          />
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Publication</DescriptionListTerm>
        <DescriptionListDescription>
          {publication || "—"}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Labels</DescriptionListTerm>
        <DescriptionListDescription>
          <EditablePulpLabels
            labels={distribution.pulp_labels}
            isSaving={isPending}
            onSave={(changes) => mutateAsync({ href, ...changes })}
          />
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Hidden</DescriptionListTerm>
        <DescriptionListDescription>
          {distribution.hidden ? "Yes" : "No"}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Created</DescriptionListTerm>
        <DescriptionListDescription>
          {formatDateTime(distribution.pulp_created) ?? "—"}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>PRN</DescriptionListTerm>
        <DescriptionListDescription>
          {distribution.prn ?? "—"}
        </DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );
};
