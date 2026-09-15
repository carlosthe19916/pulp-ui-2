import type React from "react";

import {
  Button,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@patternfly/react-core";

import type { RoleResponse } from "@app/client";

import { useRoleForm } from "../hooks/useRoleForm";
import { RoleForm } from "./RoleForm";

interface IRoleModalProps {
  role?: RoleResponse;
  onClose: () => void;
}

/**
 * Inner modal that owns the form state. Only mounted while open (see the
 * wrappers below) so react-hook-form re-initializes on every open.
 */
const RoleModal: React.FC<IRoleModalProps> = ({ role, onClose }) => {
  const { form, isCreate, onSubmit, isSubmitting } = useRoleForm({
    role,
    onClose,
  });

  return (
    <Modal isOpen onClose={onClose} variant="medium">
      <ModalHeader
        title={isCreate ? "Create Role" : `Edit Role: ${role?.name}`}
      />
      <ModalBody>
        <RoleForm form={form} isCreate={isCreate} onSubmit={onSubmit} />
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

interface IRoleCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoleCreateModal: React.FC<IRoleCreateModalProps> = ({
  isOpen,
  onClose,
}) => (isOpen ? <RoleModal onClose={onClose} /> : null);

interface IRoleEditModalProps {
  isOpen: boolean;
  role: RoleResponse;
  onClose: () => void;
}

export const RoleEditModal: React.FC<IRoleEditModalProps> = ({
  isOpen,
  role,
  onClose,
}) => (isOpen ? <RoleModal role={role} onClose={onClose} /> : null);
