import type React from "react";

import {
  Button,
  type ButtonProps,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@patternfly/react-core";

interface IConfirmActionModalProps {
  isOpen: boolean;
  title: string;
  body: React.ReactNode;
  /** Shows a loading spinner on the confirm button while the action runs. */
  isConfirming?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Confirm button variant — `danger` for destructive actions (default). */
  confirmVariant?: ButtonProps["variant"];
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Confirmation dialog for consequential actions. Purely presentational — the
 * caller owns the mutation and its toasts.
 */
export const ConfirmActionModal: React.FC<IConfirmActionModalProps> = ({
  isOpen,
  title,
  body,
  isConfirming,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  confirmVariant = "danger",
  onConfirm,
  onCancel,
}) => (
  <Modal isOpen={isOpen} onClose={onCancel} variant="small">
    <ModalHeader title={title} />
    <ModalBody>{body}</ModalBody>
    <ModalFooter>
      <Button
        variant={confirmVariant}
        onClick={onConfirm}
        isLoading={isConfirming}
      >
        {confirmLabel}
      </Button>
      <Button variant="link" onClick={onCancel}>
        {cancelLabel}
      </Button>
    </ModalFooter>
  </Modal>
);
