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

interface IUserModalProps {
  user?: UserResponse;
  onClose: () => void;
}

/**
 * Inner modal that owns the form state. It is only mounted while open (see the
 * wrappers below) so react-hook-form re-initializes on every open.
 */
const UserModal: React.FC<IUserModalProps> = ({ user, onClose }) => {
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

interface IUserCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserCreateModal: React.FC<IUserCreateModalProps> = ({
  isOpen,
  onClose,
}) => (isOpen ? <UserModal onClose={onClose} /> : null);

interface IUserEditModalProps {
  isOpen: boolean;
  user: UserResponse;
  onClose: () => void;
}

export const UserEditModal: React.FC<IUserEditModalProps> = ({
  isOpen,
  user,
  onClose,
}) => (isOpen ? <UserModal user={user} onClose={onClose} /> : null);
