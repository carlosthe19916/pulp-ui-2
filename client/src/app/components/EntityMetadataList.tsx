import type React from "react";

import {
  ClipboardCopy,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Label,
} from "@patternfly/react-core";

import { formatDateTime } from "@app/utils/utils";

const COLUMNS = { default: "1Col", md: "2Col" } as const;

interface IEntityMetadataListProps {
  entity: {
    pulp_created?: string;
    pulp_last_updated?: string;
    prn?: string;
    pulp_href?: string;
  };
  pulpType: string;
  /** The object's labels editor; its mutation is the caller's. */
  labels: React.ReactNode;
}

interface IFactProps {
  term: string;
  children: React.ReactNode;
}

const Fact: React.FC<IFactProps> = ({ term, children }) => (
  <DescriptionListGroup>
    <DescriptionListTerm>{term}</DescriptionListTerm>
    <DescriptionListDescription>{children}</DescriptionListDescription>
  </DescriptionListGroup>
);

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

/** The Metadata facts every detail page shows: type, timestamps, labels, PRN and HREF. */
export const EntityMetadataList: React.FC<IEntityMetadataListProps> = ({
  entity,
  pulpType,
  labels,
}) => (
  <DescriptionList columnModifier={COLUMNS}>
    <Fact term="Type">
      <Label color="blue">{pulpType}</Label>
    </Fact>
    <Fact term="Created">{formatDateTime(entity.pulp_created) ?? "—"}</Fact>
    <Fact term="Last updated">
      {formatDateTime(entity.pulp_last_updated) ?? "—"}
    </Fact>
    <Fact term="Labels">{labels}</Fact>
    <Fact term="PRN">
      <CopyableValue value={entity.prn} />
    </Fact>
    <Fact term="HREF">
      <CopyableValue value={entity.pulp_href} />
    </Fact>
  </DescriptionList>
);
