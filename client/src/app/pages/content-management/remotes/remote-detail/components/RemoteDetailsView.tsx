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
import OutlinedClockIcon from "@patternfly/react-icons/dist/esm/icons/outlined-clock-icon";
import TachometerAltIcon from "@patternfly/react-icons/dist/esm/icons/tachometer-alt-icon";

import type { GenericRemoteResponse } from "@app/client";
import { EditablePulpLabels } from "@app/components/EditablePulpLabels";
import { EntityDetailFields } from "@app/components/EntityDetailFields";
import { useNotifications } from "@app/hooks/useNotifications";
import { useObjectPermissions } from "@app/hooks/useObjectPermissions";
import { useRemoteLabelsMutation } from "@app/queries/remotes";
import { notifyLabelsResult } from "@app/utils/batchNotify";
import { formatDateTime } from "@app/utils/utils";
import { getRemoteEditFields } from "@catalog";

const DEFAULT_GROUP = "General";

const COLUMNS = { default: "1Col", md: "2Col" } as const;

// Shared transport groups, in trailing order. Any other group is plugin-specific and
// is surfaced right after General, so each plugin's distinctive fields lead the page.
const CONNECTION_GROUPS = ["Authentication", "TLS", "Timeouts", "Limits"];

const SECTION_ICONS: Record<string, React.ComponentType> = {
  General: CogIcon,
  Authentication: KeyIcon,
  TLS: LockIcon,
  Timeouts: OutlinedClockIcon,
  Limits: TachometerAltIcon,
  Metadata: InfoCircleIcon,
};

const orderGroups = (groups: string[]): string[] => {
  const general = groups.filter((g) => g === DEFAULT_GROUP);
  const pluginGroups = groups.filter(
    (g) => g !== DEFAULT_GROUP && !CONNECTION_GROUPS.includes(g),
  );
  const connection = CONNECTION_GROUPS.filter((g) => groups.includes(g));
  return [...general, ...pluginGroups, ...connection];
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
  title: string;
  content: React.ReactNode;
}

const SectionCard: React.FC<ISection> = ({ title, content }) => {
  const IconComponent = SECTION_ICONS[title] ?? CubesIcon;
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
  const fields = getRemoteEditFields(pulpType);
  const data = remote as Record<string, unknown>;

  const groupNames = orderGroups([
    ...new Set(fields.map((field) => field.group ?? DEFAULT_GROUP)),
  ]);

  const sections: ISection[] = groupNames.map((groupName) => ({
    title: groupName,
    content: (
      <EntityDetailFields
        fields={fields.filter(
          (field) => (field.group ?? DEFAULT_GROUP) === groupName,
        )}
        data={data}
        copyableKeys={["url"]}
        columnModifier={COLUMNS}
      />
    ),
  }));

  sections.push({
    title: "Metadata",
    content: <RemoteMetadata remote={remote} pulpType={pulpType} />,
  });

  return (
    <Stack hasGutter>
      {sections.map((section) => (
        <StackItem key={section.title}>
          <SectionCard title={section.title} content={section.content} />
        </StackItem>
      ))}
    </Stack>
  );
};
