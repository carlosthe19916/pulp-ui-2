import type React from "react";

import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Stack,
  StackItem,
} from "@patternfly/react-core";

import { getPlugin } from "@catalog";
import type { GenericRemoteResponse } from "@app/client";
import { EntityDetailFields } from "@app/components/EntityDetailFields";
import { PulpTypeLabel } from "@app/components/PulpTypeLabel";
import { formatDateTime } from "@app/utils/utils";

interface IRemoteDetailsTabProps {
  remote: GenericRemoteResponse;
  pulpType: string;
}

export const RemoteDetailsTab: React.FC<IRemoteDetailsTabProps> = ({
  remote,
  pulpType,
}) => {
  const fields = getPlugin(pulpType)?.entities.remote?.form.editFields ?? [];

  return (
    <Stack hasGutter>
      <StackItem>
        <EntityDetailFields
          fields={fields}
          data={remote as Record<string, unknown>}
        />
      </StackItem>
      <StackItem>
        <DescriptionList isHorizontal>
          <DescriptionListGroup>
            <DescriptionListTerm>Type</DescriptionListTerm>
            <DescriptionListDescription>
              <PulpTypeLabel pulpType={pulpType} />
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Created</DescriptionListTerm>
            <DescriptionListDescription>
              {formatDateTime(remote.pulp_created) ?? "—"}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Last updated</DescriptionListTerm>
            <DescriptionListDescription>
              {formatDateTime(remote.pulp_last_updated) ?? "—"}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>PRN</DescriptionListTerm>
            <DescriptionListDescription>
              {remote.prn ?? "—"}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </StackItem>
    </Stack>
  );
};
