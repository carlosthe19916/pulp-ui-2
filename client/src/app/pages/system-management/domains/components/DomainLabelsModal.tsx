import type React from "react";

import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@patternfly/react-core";

import type { DomainResponse } from "@app/client";
import { EditablePulpLabels } from "@app/components/EditablePulpLabels";
import { domainKeys } from "@app/queries/domains";

/** A domain's labels, edited in place (domains have no detail page). */
export const DomainLabelsModal: React.FC<{
  domain: DomainResponse;
  onClose: () => void;
}> = ({ domain, onClose }) => (
  <Modal isOpen onClose={onClose} variant="small">
    <ModalHeader title={`Labels — "${domain.name}"`} />
    <ModalBody>
      <EditablePulpLabels
        href={domain.pulp_href ?? ""}
        labels={domain.pulp_labels}
        invalidateKey={domainKeys.list()}
      />
    </ModalBody>
    <ModalFooter>
      <Button variant="primary" onClick={onClose}>
        Done
      </Button>
    </ModalFooter>
  </Modal>
);
