import type React from "react";
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
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
  TextInput,
} from "@patternfly/react-core";
import { ActionsColumn } from "@patternfly/react-table";
import {
  DataView,
  DataViewTable,
  type DataViewTr,
} from "@patternfly/react-data-view";

import type { GroupRoleResponse } from "@app/client";
import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { dataViewBodyStates } from "@app/components/DataView";
import { TypeaheadSelect } from "@app/components/TypeaheadSelect";
import { useNotifications } from "@app/context/useNotifications";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import {
  useAllGroupRolesListQuery,
  useGroupRoleCreateMutation,
  useGroupRoleDeleteMutation,
} from "@app/queries/groups";
import { useRolesListQuery } from "@app/queries/roles";
import { extractIdFromHref } from "@app/queries/utils/pulpHref";

const addRoleSchema = yup.object({
  role: yup.string().required("Role is required"),
  content_object: yup.string(),
});

type AddRoleFormValues = yup.InferType<typeof addRoleSchema>;

interface IGroupRolesTabProps {
  groupId: string;
  groupName: string;
}

export const GroupRolesTab: React.FC<IGroupRolesTabProps> = ({
  groupId,
  groupName,
}) => {
  const { addNotification } = useNotifications();

  const { data: rolesData } = useAllGroupRolesListQuery(groupId);

  const roleCreateMutation = useGroupRoleCreateMutation();
  const roleDeleteMutation = useGroupRoleDeleteMutation();

  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [removeRoleTarget, setRemoveRoleTarget] =
    useState<GroupRoleResponse | null>(null);

  const addRoleForm = useForm<AddRoleFormValues>({
    resolver: yupResolver(addRoleSchema),
    defaultValues: { role: "", content_object: "" },
  });

  const roles = rolesData?.results ?? [];

  const [roleSearch, setRoleSearch] = useState("");
  const debouncedRoleSearch = useDebouncedValue(roleSearch);
  const { data: pickerRolesData, isLoading: isPickerRolesLoading } =
    useRolesListQuery({
      limit: 20,
      name__icontains: debouncedRoleSearch || undefined,
    });

  const roleOptions = useMemo(
    () =>
      (pickerRolesData?.results ?? []).map((role) => ({
        value: role.name,
        label: role.name,
      })),
    [pickerRolesData?.results],
  );

  // Resolve role name → id only for the assigned roles shown in the table, so
  // the links don't require fetching every role in the system.
  const assignedRoleNames = useMemo(
    () => (rolesData?.results ?? []).map((role) => role.role),
    [rolesData?.results],
  );
  const { data: linkRolesData } = useRolesListQuery(
    assignedRoleNames.length
      ? { name__in: assignedRoleNames, limit: assignedRoleNames.length }
      : { limit: 1 },
  );

  const roleNameToId = useMemo(() => {
    const map = new Map<string, string>();
    for (const role of linkRolesData?.results ?? []) {
      if (role.pulp_href) {
        map.set(role.name, extractIdFromHref(role.pulp_href));
      }
    }
    return map;
  }, [linkRolesData?.results]);

  const roleColumns = [
    "Role",
    "Description",
    "Permissions",
    { cell: "", props: { screenReaderText: "Actions" } },
  ];

  const roleRows: DataViewTr[] = roles.map((role) => {
    const roleId = roleNameToId.get(role.role);
    return {
      id: role.pulp_href,
      row: [
        {
          cell: roleId ? (
            <Link to="/admin/roles/$roleId" params={{ roleId }}>
              {role.role}
            </Link>
          ) : (
            role.role
          ),
          props: { dataLabel: "Role" },
        },
        {
          cell: role.description ?? "—",
          props: { dataLabel: "Description" },
        },
        {
          cell: role.permissions?.length ?? 0,
          props: { dataLabel: "Permissions" },
        },
        {
          cell: (
            <ActionsColumn
              items={[
                {
                  title: "Remove",
                  isDanger: true,
                  onClick: () => setRemoveRoleTarget(role),
                },
              ]}
            />
          ),
          props: { dataLabel: "Actions", isActionCell: true },
        },
      ],
    };
  });

  const onAddRole = addRoleForm.handleSubmit(async (values) => {
    try {
      await roleCreateMutation.mutateAsync({
        groupId,
        body: {
          role: values.role,
          content_object: values.content_object || null,
        },
      });
      addNotification({
        title: `Role "${values.role}" assigned to group "${groupName}"`,
        variant: "success",
      });
      addRoleForm.reset();
      setIsAddRoleOpen(false);
    } catch {
      addNotification({
        title: "Failed to assign role to group",
        variant: "danger",
      });
    }
  });

  const handleRemoveRole = async () => {
    if (!removeRoleTarget?.pulp_href) return;
    try {
      await roleDeleteMutation.mutateAsync({
        groupId,
        assignmentId: extractIdFromHref(removeRoleTarget.pulp_href),
      });
      addNotification({
        title: `Role "${removeRoleTarget.role}" removed from group "${groupName}"`,
        variant: "success",
      });
    } catch {
      addNotification({
        title: "Failed to remove role from group",
        variant: "danger",
      });
    }
    setRemoveRoleTarget(null);
  };

  const groupRolesStates = dataViewBodyStates({
    empty: roles.length === 0,
    emptyState: "No roles assigned to this group.",
  });

  return (
    <>
      <Stack hasGutter>
        <StackItem>
          <Button variant="primary" onClick={() => setIsAddRoleOpen(true)}>
            Add Role
          </Button>
        </StackItem>
        <StackItem>
          <DataView activeState={groupRolesStates.activeState}>
            <DataViewTable
              aria-label="Group roles table"
              columns={roleColumns}
              rows={roleRows}
              bodyStates={groupRolesStates.bodyStates}
            />
          </DataView>
        </StackItem>
      </Stack>

      <Modal
        isOpen={isAddRoleOpen}
        onClose={() => {
          addRoleForm.reset();
          setIsAddRoleOpen(false);
        }}
        variant="small"
      >
        <ModalHeader title="Assign Role to Group" />
        <ModalBody>
          <Form
            onSubmit={(e) => {
              e.preventDefault();
              void onAddRole();
            }}
          >
            <FormGroup label="Role" isRequired fieldId="add-role-name">
              <TypeaheadSelect
                id="add-role-name"
                ariaLabel="Role"
                placeholder="Select a role"
                options={roleOptions}
                value={addRoleForm.watch("role")}
                isLoading={isPickerRolesLoading}
                onFilterChange={setRoleSearch}
                onChange={(value) =>
                  addRoleForm.setValue("role", value, {
                    shouldValidate: true,
                  })
                }
              />
              {addRoleForm.formState.errors.role && (
                <FormHelperText>
                  <HelperText>
                    <HelperTextItem variant="error">
                      {addRoleForm.formState.errors.role.message}
                    </HelperTextItem>
                  </HelperText>
                </FormHelperText>
              )}
            </FormGroup>
            <FormGroup label="Content Object" fieldId="add-role-content-object">
              <TextInput
                id="add-role-content-object"
                value={addRoleForm.watch("content_object")}
                onChange={(_e, value) =>
                  addRoleForm.setValue("content_object", value)
                }
                placeholder="Optional pulp_href"
              />
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="primary"
            onClick={() => void onAddRole()}
            isDisabled={
              addRoleForm.formState.isSubmitting || roleCreateMutation.isPending
            }
            isLoading={
              addRoleForm.formState.isSubmitting || roleCreateMutation.isPending
            }
          >
            Assign
          </Button>
          <Button
            variant="link"
            onClick={() => {
              addRoleForm.reset();
              setIsAddRoleOpen(false);
            }}
          >
            Cancel
          </Button>
        </ModalFooter>
      </Modal>

      <ConfirmActionModal
        isOpen={!!removeRoleTarget}
        title="Remove Role"
        body={`Are you sure you want to remove role "${removeRoleTarget?.role}" from the group?`}
        isConfirming={roleDeleteMutation.isPending}
        confirmLabel="Remove"
        onConfirm={() => void handleRemoveRole()}
        onCancel={() => setRemoveRoleTarget(null)}
      />
    </>
  );
};
