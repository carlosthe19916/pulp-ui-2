import type React from "react";

import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@patternfly/react-core";

import { useGroupForm } from "../hooks/useGroupForm";
import { GroupForm } from "./GroupForm";

interface IGroupModalProps {
  onClose: () => void;
}

/**
 * Inner modal that owns the form state. Only mounted while open (see the
 * wrapper below) so react-hook-form re-initializes on every open.
 */
const GroupModal: React.FC<IGroupModalProps> = ({ onClose }) => {
  const { form, onSubmit, isSubmitting } = useGroupForm({ onClose });

  return (
    <Modal isOpen onClose={onClose} variant="small">
      <ModalHeader title="Create Group" />
      <ModalBody>
        <GroupForm form={form} onSubmit={onSubmit} />
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          onClick={onSubmit}
          isLoading={isSubmitting}
          isDisabled={isSubmitting}
        >
          Create
        </Button>
        <Button variant="link" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

interface ICreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateGroupModal: React.FC<ICreateGroupModalProps> = ({
  isOpen,
  onClose,
}) => (isOpen ? <GroupModal onClose={onClose} /> : null);
