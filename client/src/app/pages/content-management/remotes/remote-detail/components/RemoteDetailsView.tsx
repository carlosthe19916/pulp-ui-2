import type React from "react";

import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  ClipboardCopy,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  FlexItem,
  Icon,
  Label,
  Stack,
  StackItem,
} from "@patternfly/react-core";
import CogIcon from "@patternfly/react-icons/dist/esm/icons/cog-icon";
import CubesIcon from "@patternfly/react-icons/dist/esm/icons/cubes-icon";
import InfoCircleIcon from "@patternfly/react-icons/dist/esm/icons/info-circle-icon";
import KeyIcon from "@patternfly/react-icons/dist/esm/icons/key-icon";
import LockIcon from "@patternfly/react-icons/dist/esm/icons/lock-icon";
import NetworkIcon from "@patternfly/react-icons/dist/esm/icons/network-icon";
import OutlinedClockIcon from "@patternfly/react-icons/dist/esm/icons/outlined-clock-icon";
import TachometerAltIcon from "@patternfly/react-icons/dist/esm/icons/tachometer-alt-icon";

import type { GenericRemoteResponse } from "@app/client";
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

// Icons for the shared remote sections, by form section id; plugin sections get a default.
const SECTION_ICONS: Record<string, React.ComponentType> = {
  essentials: CogIcon,
  auth: KeyIcon,
  tls: LockIcon,
  proxy: NetworkIcon,
  downloads: TachometerAltIcon,
  timeouts: OutlinedClockIcon,
  metadata: InfoCircleIcon,
};

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

const SectionCard: React.FC<ISection> = ({ id, title, content }) => {
  const IconComponent = SECTION_ICONS[id] ?? CubesIcon;
  return (
    <Card isFullHeight>
      <CardHeader>
        <CardTitle>
          <Flex
            spaceItems={{ default: "spaceItemsSm" }}
            alignItems={{ default: "alignItemsCenter" }}
          >
            <FlexItem>
              <Icon size="md" isInline>
                <IconComponent />
              </Icon>
            </FlexItem>
            <FlexItem>{title}</FlexItem>
          </Flex>
        </CardTitle>
      </CardHeader>
      <CardBody>{content}</CardBody>
    </Card>
  );
};

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
          <SectionCard {...section} />
        </StackItem>
      ))}
    </Stack>
  );
};
