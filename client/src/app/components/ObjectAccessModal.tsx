import type React from "react";

import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@patternfly/react-core";

import { ObjectAccessPanel } from "@app/components/ObjectAccessPanel";

interface IObjectAccessModalProps {
  href: string;
  name: string;
  onClose: () => void;
}

/** Object access for resources without a detail page (distributions, publications…). */
export const ObjectAccessModal: React.FC<IObjectAccessModalProps> = ({
  href,
  name,
  onClose,
}) => (
  <Modal isOpen onClose={onClose} variant="medium">
    <ModalHeader title={`Access — "${name}"`} />
    <ModalBody>
      <ObjectAccessPanel href={href} name={name} />
    </ModalBody>
    <ModalFooter>
      <Button variant="primary" onClick={onClose}>
        Done
      </Button>
    </ModalFooter>
  </Modal>
);
