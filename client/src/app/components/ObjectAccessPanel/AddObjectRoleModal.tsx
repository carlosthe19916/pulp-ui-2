import type React from "react";
import { useState } from "react";

import {
  Button,
  Form,
  FormGroup,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@patternfly/react-core";

import { FormSubmitError } from "@app/components/FormSubmitError";
import { TypeaheadSelect } from "@app/components/TypeaheadSelect";
import { DROPDOWN_PAGE_SIZE } from "@app/constants";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useNotifications } from "@app/hooks/useNotifications";
import { useSubmitError } from "@app/hooks/useSubmitError";
import { useAddObjectRoleMutation } from "@app/queries/access";
import { useGroupsListQuery } from "@app/queries/groups";
import { useRolesListQuery } from "@app/queries/roles";
import { useUsersListQuery } from "@app/queries/users";
import { resolvePulpType } from "@app/queries/utils/pulpHref";
import { getMutationErrorMessage } from "@app/utils/utils";

import { NameMultiSelect } from "./NameMultiSelect";

interface IAddObjectRoleModalProps {
  href: string;
  name: string;
  onClose: () => void;
}

/** Grants one role on an object to the picked users and groups. */
export const AddObjectRoleModal: React.FC<IAddObjectRoleModalProps> = ({
  href,
  name,
  onClose,
}) => {
  const { addNotification } = useNotifications();
  const { submitError, setSubmitError, clearSubmitError } = useSubmitError();
  const [role, setRole] = useState("");
  const [users, setUsers] = useState<string[]>([]);
  const [groups, setGroups] = useState<string[]>([]);
  const [roleTerm, setRoleTerm] = useState("");
  const [userTerm, setUserTerm] = useState("");
  const [groupTerm, setGroupTerm] = useState("");
  const debouncedRole = useDebouncedValue({ value: roleTerm });
  const debouncedUser = useDebouncedValue({ value: userTerm });
  const debouncedGroup = useDebouncedValue({ value: groupTerm });

  // Roles of the object's plugin ("file.filerepository_owner"); tasks etc. are core.
  const app = resolvePulpType(href)?.split(".")[0] ?? "core";
  const roles = useRolesListQuery({
    params: {
      limit: DROPDOWN_PAGE_SIZE,
      offset: 0,
      ordering: "name",
      name__startswith: `${app}.`,
      name__icontains: debouncedRole || undefined,
    },
  });
  const userQuery = useUsersListQuery({
    params: {
      limit: DROPDOWN_PAGE_SIZE,
      offset: 0,
      ordering: "username",
      username__icontains: debouncedUser || undefined,
    },
  });
  const groupQuery = useGroupsListQuery({
    params: {
      limit: DROPDOWN_PAGE_SIZE,
      offset: 0,
      ordering: "name",
      name__icontains: debouncedGroup || undefined,
    },
  });

  const mutation = useAddObjectRoleMutation({
    onSuccess: (_data, { body }) =>
      addNotification({
        title: `Role "${body.role}" granted on "${name}"`,
        variant: "success",
      }),
    onError: (error) =>
      setSubmitError(
        getMutationErrorMessage({ error, fallback: "Failed to grant role" }),
      ),
  });

  const isValid = !!role && users.length + groups.length > 0;

  return (
    <Modal isOpen onClose={onClose} variant="small">
      <ModalHeader title={`Add role — "${name}"`} />
      <ModalBody>
        <Form
          id="add-object-role-form"
          onSubmit={(event) => {
            event.preventDefault();
            clearSubmitError();
            mutation.mutate(
              { href, body: { role, users, groups } },
              { onSuccess: onClose },
            );
          }}
        >
          <FormSubmitError error={submitError} />
          <FormGroup label="Role" fieldId="object-role" isRequired>
            <TypeaheadSelect
              id="object-role"
              ariaLabel="Role"
              placeholder="Select a role…"
              options={(roles.data?.results ?? []).map((item) => ({
                value: item.name,
                label: item.name,
              }))}
              value={role}
              onChange={setRole}
              onFilterChange={setRoleTerm}
              isLoading={roles.isFetching}
            />
          </FormGroup>
          <FormGroup label="Users" fieldId="object-role-users">
            <NameMultiSelect
              id="object-role-users"
              label="Users"
              options={(userQuery.data?.results ?? []).map(
                (user) => user.username,
              )}
              isLoading={userQuery.isFetching}
              onSearch={setUserTerm}
              value={users}
              onChange={setUsers}
            />
          </FormGroup>
          <FormGroup label="Groups" fieldId="object-role-groups">
            <NameMultiSelect
              id="object-role-groups"
              label="Groups"
              options={(groupQuery.data?.results ?? []).map(
                (group) => group.name,
              )}
              isLoading={groupQuery.isFetching}
              onSearch={setGroupTerm}
              value={groups}
              onChange={setGroups}
            />
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          type="submit"
          form="add-object-role-form"
          isLoading={mutation.isPending}
          isDisabled={!isValid || mutation.isPending}
        >
          Add
        </Button>
        <Button variant="link" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};
