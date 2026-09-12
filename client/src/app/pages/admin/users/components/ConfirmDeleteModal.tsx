import type React from "react";

import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@patternfly/react-core";

interface IConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  body: React.ReactNode;
  isDeleting?: boolean;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDeleteModal: React.FC<IConfirmDeleteModalProps> = ({
  isOpen,
  title,
  body,
  isDeleting,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}) => (
  <Modal isOpen={isOpen} onClose={onCancel} variant="small">
    <ModalHeader title={title} />
    <ModalBody>{body}</ModalBody>
    <ModalFooter>
      <Button variant="danger" onClick={onConfirm} isLoading={isDeleting}>
        {confirmLabel}
      </Button>
      <Button variant="link" onClick={onCancel}>
        Cancel
      </Button>
    </ModalFooter>
  </Modal>
);
