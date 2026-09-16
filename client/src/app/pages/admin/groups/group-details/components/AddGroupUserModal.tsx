import type React from "react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import {
  Button,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from "@patternfly/react-core";

import { TypeaheadSelect } from "@app/components/TypeaheadSelect";
import { useNotifications } from "@app/context/useNotifications";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useGroupUserCreateMutation } from "@app/queries/groups";
import { useUsersListQuery } from "@app/queries/users";

const addUserSchema = yup.object({
  username: yup.string().required("User is required"),
});

type AddUserFormValues = yup.InferType<typeof addUserSchema>;

interface IAddGroupUserModalInnerProps {
  groupHref: string;
  groupName: string;
  onClose: () => void;
}

/**
 * Inner modal that owns the form state and the user-options query. Only mounted
 * while open (see the wrapper below) so react-hook-form re-initializes and the
 * user list is only fetched when the modal is actually opened.
 */
const AddGroupUserModalInner: React.FC<IAddGroupUserModalInnerProps> = ({
  groupHref,
  groupName,
  onClose,
}) => {
  const { addNotification } = useNotifications();

  const [userSearch, setUserSearch] = useState("");
  const debouncedUserSearch = useDebouncedValue(userSearch);
  const { data: allUsersData, isLoading: isUsersLoading } = useUsersListQuery({
    limit: 20,
    username__icontains: debouncedUserSearch || undefined,
  });
  const userCreateMutation = useGroupUserCreateMutation();

  const form = useForm<AddUserFormValues>({
    resolver: yupResolver(addUserSchema),
    defaultValues: { username: "" },
  });

  const userOptions = useMemo(
    () =>
      (allUsersData?.results ?? []).map((user) => ({
        value: user.username,
        label: user.username,
      })),
    [allUsersData?.results],
  );

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await userCreateMutation.mutateAsync({
        groupHref,
        body: { username: values.username },
      });
      addNotification({
        title: `User "${values.username}" added to group "${groupName}"`,
        variant: "success",
      });
      onClose();
    } catch {
      addNotification({
        title: "Failed to add user to group",
        variant: "danger",
      });
    }
  });

  const isSubmitting =
    form.formState.isSubmitting || userCreateMutation.isPending;

  return (
    <Modal isOpen onClose={onClose} variant="small">
      <ModalHeader title="Add User to Group" />
      <ModalBody>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            void onSubmit();
          }}
        >
          <FormGroup label="User" isRequired fieldId="add-user-username">
            <TypeaheadSelect
              id="add-user-username"
              ariaLabel="User"
              placeholder="Select a user"
              options={userOptions}
              value={form.watch("username")}
              isLoading={isUsersLoading}
              onFilterChange={setUserSearch}
              onChange={(value) =>
                form.setValue("username", value, {
                  shouldValidate: true,
                })
              }
            />
            {form.formState.errors.username && (
              <FormHelperText>
                <HelperText>
                  <HelperTextItem variant="error">
                    {form.formState.errors.username.message}
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          onClick={() => void onSubmit()}
          isDisabled={isSubmitting}
          isLoading={isSubmitting}
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

interface IAddGroupUserModalProps {
  isOpen: boolean;
  groupHref: string;
  groupName: string;
  onClose: () => void;
}

/**
 * Modal for adding a user to a group. Mounted only while open so its form and
 * user-options query reset on every open.
 */
export const AddGroupUserModal: React.FC<IAddGroupUserModalProps> = ({
  isOpen,
  groupHref,
  groupName,
  onClose,
}) =>
  isOpen ? (
    <AddGroupUserModalInner
      groupHref={groupHref}
      groupName={groupName}
      onClose={onClose}
    />
  ) : null;
