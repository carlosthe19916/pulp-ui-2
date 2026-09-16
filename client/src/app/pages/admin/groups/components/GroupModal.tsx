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

interface IGroupModalInnerProps {
  group?: GroupResponse;
  onClose: () => void;
}

/**
 * Inner modal that owns the form state. Only mounted while open (see the
 * wrapper below) so react-hook-form re-initializes on every open.
 */
const GroupModalInner: React.FC<IGroupModalInnerProps> = ({
  group,
  onClose,
}) => {
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

interface IGroupModalProps {
  isOpen: boolean;
  group?: GroupResponse;
  onClose: () => void;
}

/**
 * Single modal for both create and edit. Passing a `group` selects edit mode;
 * omitting it selects create mode.
 */
export const GroupModal: React.FC<IGroupModalProps> = ({
  isOpen,
  group,
  onClose,
}) => (isOpen ? <GroupModalInner group={group} onClose={onClose} /> : null);
