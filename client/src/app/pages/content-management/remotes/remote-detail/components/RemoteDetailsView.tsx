import type React from "react";

import {
  ClipboardCopy,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Label,
  Stack,
  StackItem,
} from "@patternfly/react-core";

import type { GenericRemoteResponse } from "@app/client";
import { DetailSectionCard } from "@app/components/DetailSectionCard";
import { EditablePulpLabels } from "@app/components/EditablePulpLabels";
import { EntityDetailFields } from "@app/components/EntityDetailFields";
import { getEntityForm, toDetailSections } from "@app/forms";
import { useNotifications } from "@app/hooks/useNotifications";
import { useObjectPermissions } from "@app/hooks/useObjectPermissions";
import { useRemoteLabelsMutation } from "@app/queries/remotes";
import { notifyLabelsResult } from "@app/utils/batchNotify";
import { toFieldRecord } from "@app/utils/formSchema";
import { formatDateTime } from "@app/utils/utils";

const COLUMNS = { default: "1Col", md: "2Col" } as const;

interface IRemoteDetailsViewProps {
  remote: GenericRemoteResponse;
  pulpType: string;
}

interface ICopyableValueProps {
  value?: string;
}

const CopyableValue: React.FC<ICopyableValueProps> = ({ value }) =>
  value ? (
    <ClipboardCopy variant="inline-compact" isReadOnly>
      {value}
    </ClipboardCopy>
  ) : (
    <>—</>
  );

const RemoteMetadata: React.FC<IRemoteDetailsViewProps> = ({
  remote,
  pulpType,
}) => {
  const href = remote.pulp_href ?? "";
  const { disabledProps } = useObjectPermissions({ href });
  const { addNotification } = useNotifications();
  const { mutateAsync, isPending } = useRemoteLabelsMutation({
    onSuccess: (result) => notifyLabelsResult({ addNotification, result }),
  });
  return (
    <DescriptionList columnModifier={COLUMNS}>
      <DescriptionListGroup>
        <DescriptionListTerm>Type</DescriptionListTerm>
        <DescriptionListDescription>
          <Label color="blue">{pulpType}</Label>
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
        <DescriptionListTerm>Labels</DescriptionListTerm>
        <DescriptionListDescription>
          <EditablePulpLabels
            labels={remote.pulp_labels}
            actionProps={disabledProps("change")}
            isSaving={isPending}
            onSave={(changes) => mutateAsync({ href, ...changes })}
          />
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>PRN</DescriptionListTerm>
        <DescriptionListDescription>
          <CopyableValue value={remote.prn} />
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>HREF</DescriptionListTerm>
        <DescriptionListDescription>
          <CopyableValue value={remote.pulp_href} />
        </DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );
};

interface ISection {
  id: string;
  title: string;
  content: React.ReactNode;
}

export const RemoteDetailsView: React.FC<IRemoteDetailsViewProps> = ({
  remote,
  pulpType,
}) => {
  const form = getEntityForm({
    entity: "remote",
    pulpType,
    mode: "edit",
  })?.form;
  const data = toFieldRecord(remote);

  // Grouped and labelled the way the remote's form is (ADR 0009).
  const sections: ISection[] = [
    ...(form ? toDetailSections(form) : []).map((section) => ({
      id: section.id,
      title: section.title,
      content: (
        <EntityDetailFields
          fields={section.fields}
          data={data}
          copyableKeys={["url"]}
          columnModifier={COLUMNS}
        />
      ),
    })),
    {
      id: "metadata",
      title: "Metadata",
      content: <RemoteMetadata remote={remote} pulpType={pulpType} />,
    },
  ];

  return (
    <Stack hasGutter>
      {sections.map((section) => (
        <StackItem key={section.id}>
          <DetailSectionCard id={section.id} title={section.title}>
            {section.content}
          </DetailSectionCard>
        </StackItem>
      ))}
    </Stack>
  );
};
