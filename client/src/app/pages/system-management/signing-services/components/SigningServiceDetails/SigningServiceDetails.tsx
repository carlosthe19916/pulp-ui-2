import type React from "react";

import {
  Button,
  ClipboardCopy,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  FlexItem,
  Stack,
} from "@patternfly/react-core";
import DownloadIcon from "@patternfly/react-icons/dist/esm/icons/download-icon";

import type { SigningServiceResponse } from "@app/client";
import { formatDateTime } from "@app/utils/utils";

import { downloadPublicKey, longKeyId } from "../../utils/publicKey";
import { FingerprintCopy } from "../FingerprintCopy";

interface ISigningServiceDetailsProps {
  service: SigningServiceResponse;
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

interface ICopyableCodeProps {
  value?: string;
}

const CopyableCode: React.FC<ICopyableCodeProps> = ({ value }) =>
  value ? (
    <ClipboardCopy variant="inline-compact" isCode isReadOnly>
      {value}
    </ClipboardCopy>
  ) : (
    <>—</>
  );

/** Expanded-row detail of a signing service: its key identity, script and public key. */
export const SigningServiceDetails: React.FC<ISigningServiceDetailsProps> = ({
  service,
}) => (
  <Stack hasGutter>
    <DescriptionList isCompact columnModifier={{ default: "1Col", lg: "2Col" }}>
      <Fact term="Fingerprint">
        <FingerprintCopy fingerprint={service.pubkey_fingerprint} />
      </Fact>
      <Fact term="Key ID">
        <CopyableCode value={longKeyId(service.pubkey_fingerprint)} />
      </Fact>
      <Fact term="Script">
        <CopyableCode value={service.script} />
      </Fact>
      <Fact term="PRN">
        <CopyableCode value={service.prn} />
      </Fact>
      <Fact term="Created">{formatDateTime(service.pulp_created) ?? "—"}</Fact>
      <Fact term="Last updated">
        {formatDateTime(service.pulp_last_updated) ?? "—"}
      </Fact>
    </DescriptionList>
    <DescriptionList isCompact>
      <Fact term="Public key">
        {service.public_key ? (
          <Flex
            direction={{ default: "column" }}
            spaceItems={{ default: "spaceItemsSm" }}
          >
            <ClipboardCopy
              variant="expansion"
              isReadOnly
              isCode
              hoverTip="Copy public key"
              clickTip="Copied"
              textAriaLabel="Public key"
              toggleAriaLabel="Show public key"
            >
              {service.public_key}
            </ClipboardCopy>
            <FlexItem>
              <Button
                variant="link"
                isInline
                icon={<DownloadIcon />}
                onClick={() =>
                  downloadPublicKey({
                    name: service.name,
                    publicKey: service.public_key,
                  })
                }
              >
                Download public key ({service.name}.asc)
              </Button>
            </FlexItem>
          </Flex>
        ) : (
          "—"
        )}
      </Fact>
    </DescriptionList>
  </Stack>
);
