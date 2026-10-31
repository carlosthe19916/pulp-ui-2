import type React from "react";

import { Stack, StackItem } from "@patternfly/react-core";

import type { GenericRemoteResponse } from "@app/client";
import { DetailSectionCard } from "@app/components/DetailSectionCard";
import { EditablePulpLabels } from "@app/components/EditablePulpLabels";
import { EntityMetadataList } from "@app/components/EntityMetadataList";
import { FormDetailSections } from "@app/components/FormDetailSections";
import { useNotifications } from "@app/hooks/useNotifications";
import { useObjectPermissions } from "@app/hooks/useObjectPermissions";
import { toDetailSections } from "@app/plugin-forms";
import { useRemoteLabelsMutation } from "@app/queries/remotes";
import { notifyLabelsResult } from "@app/utils/batchNotify";
import { toFieldRecord } from "@app/utils/formSchema";
import { getEntityForm } from "@plugins";

interface IRemoteDetailsViewProps {
  remote: GenericRemoteResponse;
  pulpType: string;
}

/** A remote's Details tab: its settings grouped the way its form groups them, then metadata. */
export const RemoteDetailsView: React.FC<IRemoteDetailsViewProps> = ({
  remote,
  pulpType,
}) => {
  const href = remote.pulp_href ?? "";
  const { disabledProps } = useObjectPermissions({ href });
  const { addNotification } = useNotifications();
  const { mutateAsync, isPending } = useRemoteLabelsMutation({
    onSuccess: (result) => notifyLabelsResult({ addNotification, result }),
  });
  const form = getEntityForm({
    entity: "remote",
    pulpType,
    mode: "edit",
  })?.form;

  return (
    <Stack hasGutter>
      <FormDetailSections
        sections={form ? toDetailSections(form) : []}
        data={toFieldRecord(remote)}
        copyableKeys={["url"]}
      />
      <StackItem>
        <DetailSectionCard id="metadata" title="Metadata">
          <EntityMetadataList
            entity={remote}
            pulpType={pulpType}
            labels={
              <EditablePulpLabels
                labels={remote.pulp_labels}
                actionProps={disabledProps("change")}
                isSaving={isPending}
                onSave={(changes) => mutateAsync({ href, ...changes })}
              />
            }
          />
        </DetailSectionCard>
      </StackItem>
    </Stack>
  );
};
