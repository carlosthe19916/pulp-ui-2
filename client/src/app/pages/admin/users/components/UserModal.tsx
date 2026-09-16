import type React from "react";

import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@patternfly/react-core";

import type { UserResponse } from "@app/client";

import { useUserForm } from "../hooks/useUserForm";
import { UserForm } from "./UserForm";

interface IUserModalInnerProps {
  user?: UserResponse;
  onClose: () => void;
}

/** Only mounted while open so react-hook-form re-initializes on every open. */
const UserModalInner: React.FC<IUserModalInnerProps> = ({ user, onClose }) => {
  const { form, isCreate, onSubmit, isSubmitting } = useUserForm({
    user,
    onClose,
  });

  return (
    <Modal isOpen onClose={onClose} variant="medium">
      <ModalHeader
        title={isCreate ? "Create User" : `Edit ${user?.username}`}
      />
      <ModalBody>
        <UserForm form={form} isCreate={isCreate} onSubmit={onSubmit} />
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

interface IUserModalProps {
  isOpen: boolean;
  user?: UserResponse;
  onClose: () => void;
}

/** Passing a `user` selects edit mode; omitting it selects create mode. */
export const UserModal: React.FC<IUserModalProps> = ({
  isOpen,
  user,
  onClose,
}) => (isOpen ? <UserModalInner user={user} onClose={onClose} /> : null);
