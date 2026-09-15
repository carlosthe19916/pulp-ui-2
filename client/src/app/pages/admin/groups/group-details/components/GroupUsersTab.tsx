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
  Stack,
  StackItem,
} from "@patternfly/react-core";
import { ActionsColumn } from "@patternfly/react-table";
import {
  DataView,
  DataViewTable,
  type DataViewTr,
} from "@patternfly/react-data-view";

import type { GroupUserResponse } from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { dataViewBodyStates } from "@app/components/DataView";
import { TypeaheadSelect } from "@app/components/TypeaheadSelect";
import { useNotifications } from "@app/context/useNotifications";
import {
  useGroupUserCreateMutation,
  useGroupUserDeleteMutation,
  useGroupUsersListQuery,
} from "@app/queries/groups";
import { useUsersListQuery } from "@app/queries/users";

const addUserSchema = yup.object({
  username: yup.string().required("User is required"),
});

type AddUserFormValues = yup.InferType<typeof addUserSchema>;

interface IGroupUsersTabProps {
  groupId: string;
  groupHref: string;
  groupName: string;
}

export const GroupUsersTab: React.FC<IGroupUsersTabProps> = ({
  groupId,
  groupHref,
  groupName,
}) => {
  const { addNotification } = useNotifications();

  const { data: usersData } = useGroupUsersListQuery(groupId);
  const { data: allUsersData } = useUsersListQuery({ limit: 200 });

  const userCreateMutation = useGroupUserCreateMutation();
  const userDeleteMutation = useGroupUserDeleteMutation();

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [removeUserTarget, setRemoveUserTarget] =
    useState<GroupUserResponse | null>(null);

  const addUserForm = useForm<AddUserFormValues>({
    resolver: yupResolver(addUserSchema),
    defaultValues: { username: "" },
  });

  const users = usersData?.results ?? [];

  const userOptions = useMemo(
    () =>
      (allUsersData?.results ?? []).map((user) => ({
        value: user.username,
        label: user.username,
      })),
    [allUsersData?.results],
  );

  const userColumns = [
    "Username",
    { cell: "", props: { screenReaderText: "Actions" } },
  ];

  const userRows: DataViewTr[] = users.map((user) => ({
    id: user.pulp_href,
    row: [
      { cell: user.username, props: { dataLabel: "Username" } },
      {
        cell: (
          <ActionsColumn
            items={[
              {
                title: "Remove",
                isDanger: true,
                onClick: () => setRemoveUserTarget(user),
              },
            ]}
          />
        ),
        props: { dataLabel: "Actions", isActionCell: true },
      },
    ],
  }));

  const onAddUser = addUserForm.handleSubmit(async (values) => {
    try {
      await userCreateMutation.mutateAsync({
        groupHref,
        body: { username: values.username },
      });
      addNotification({
        title: `User "${values.username}" added to group "${groupName}"`,
        variant: "success",
      });
      addUserForm.reset();
      setIsAddUserOpen(false);
    } catch {
      addNotification({
        title: "Failed to add user to group",
        variant: "danger",
      });
    }
  });

  const handleRemoveUser = async () => {
    if (!removeUserTarget?.pulp_href) return;
    try {
      await userDeleteMutation.mutateAsync(removeUserTarget.pulp_href);
      addNotification({
        title: `User "${removeUserTarget.username}" removed from group "${groupName}"`,
        variant: "success",
      });
    } catch {
      addNotification({
        title: "Failed to remove user from group",
        variant: "danger",
      });
    }
    setRemoveUserTarget(null);
  };

  const groupUsersStates = dataViewBodyStates({
    empty: users.length === 0,
    emptyState: "No users in this group.",
  });

  return (
    <>
      <Stack hasGutter>
        <StackItem>
          <Button variant="primary" onClick={() => setIsAddUserOpen(true)}>
            Add User
          </Button>
        </StackItem>
        <StackItem>
          <DataView activeState={groupUsersStates.activeState}>
            <DataViewTable
              aria-label="Group users table"
              columns={userColumns}
              rows={userRows}
              bodyStates={groupUsersStates.bodyStates}
            />
          </DataView>
        </StackItem>
      </Stack>

      <Modal
        isOpen={isAddUserOpen}
        onClose={() => {
          addUserForm.reset();
          setIsAddUserOpen(false);
        }}
        variant="small"
      >
        <ModalHeader title="Add User to Group" />
        <ModalBody>
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              void onAddUser();
            }}
          >
            <FormGroup label="User" isRequired fieldId="add-user-username">
              <TypeaheadSelect
                id="add-user-username"
                ariaLabel="User"
                placeholder="Select a user"
                options={userOptions}
                value={addUserForm.watch("username")}
                onChange={(value) =>
                  addUserForm.setValue("username", value, {
                    shouldValidate: true,
                  })
                }
              />
              {addUserForm.formState.errors.username && (
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem variant="error">
                      {addUserForm.formState.errors.username.message}
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
            onClick={() => void onAddUser()}
            isDisabled={
              addUserForm.formState.isSubmitting || userCreateMutation.isPending
            }
            isLoading={
              addUserForm.formState.isSubmitting || userCreateMutation.isPending
            }
          >
            Add
          </Button>
          <Button
            variant="link"
            onClick={() => {
              addUserForm.reset();
              setIsAddUserOpen(false);
            }}
          >
            Cancel
          </Button>
        </ModalFooter>
      </Modal>

      <ConfirmActionModal
        isOpen={!!removeUserTarget}
        title="Remove User"
        body={`Are you sure you want to remove user "${removeUserTarget?.username}" from the group?`}
        isConfirming={userDeleteMutation.isPending}
        confirmLabel="Remove"
        onConfirm={() => void handleRemoveUser()}
        onCancel={() => setRemoveUserTarget(null)}
      />
    </>
  );
};
