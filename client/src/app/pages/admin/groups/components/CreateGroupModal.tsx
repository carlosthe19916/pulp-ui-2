import type React from "react";

import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@patternfly/react-core";

import type { GroupResponse } from "@app/client";

import { useGroupForm } from "../hooks/useGroupForm";
import { GroupForm } from "./GroupForm";

interface IGroupModalProps {
  group?: GroupResponse;
  onClose: () => void;
}

/**
 * Inner modal that owns the form state. It is only mounted while open (see the
 * wrappers below) so react-hook-form re-initializes on every open.
 */
const GroupModal: React.FC<IGroupModalProps> = ({ group, onClose }) => {
  const { form, isCreate, onSubmit, isSubmitting } = useGroupForm({
    group,
    onClose,
  });

  return (
    <Modal isOpen onClose={onClose} variant="small">
      <ModalHeader title={isCreate ? "Create Group" : `Edit ${group?.name}`} />
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
          {isCreate ? "Create" : "Save"}
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

interface IEditGroupModalProps {
  isOpen: boolean;
  group: GroupResponse;
  onClose: () => void;
}

export const EditGroupModal: React.FC<IEditGroupModalProps> = ({
  isOpen,
  group,
  onClose,
}) => (isOpen ? <GroupModal group={group} onClose={onClose} /> : null);
