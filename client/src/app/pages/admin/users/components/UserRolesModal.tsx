import type React from "react";
import { useMemo, useState } from "react";

import {
  Button,
  Bullseye,
  DualListSelector,
  DualListSelectorControl,
  DualListSelectorControlsWrapper,
  DualListSelectorList,
  DualListSelectorListItem,
  DualListSelectorPane,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  SearchInput,
  Spinner,
} from "@patternfly/react-core";
import AngleDoubleLeftIcon from "@patternfly/react-icons/dist/esm/icons/angle-double-left-icon";
import AngleDoubleRightIcon from "@patternfly/react-icons/dist/esm/icons/angle-double-right-icon";
import AngleLeftIcon from "@patternfly/react-icons/dist/esm/icons/angle-left-icon";
import AngleRightIcon from "@patternfly/react-icons/dist/esm/icons/angle-right-icon";

import type { UserResponse } from "@app/client";
import { LoadingWrapper } from "@app/components/LoadingWrapper";
import { DefaultErrorState } from "@app/components/LoadingWrapper/DefaultErrorState";
import { useRolesListQuery } from "@app/queries/roles";
import { useUserRolesListQuery } from "@app/queries/users";

import { useUserRoleActions } from "../hooks/useUserRoleActions";

interface IRoleOption {
  name: string;
  selected: boolean;
  isVisible: boolean;
}

interface IAssignedRole {
  name: string;
  /** Assignment href (UserRoleResponse.pulp_href), used to unassign. */
  href: string;
}

interface IUserRolesFormProps {
  userHref: string;
  /** Roles currently assigned to the user, with their assignment hrefs. */
  assignedRoles: IAssignedRole[];
  /** All role names available in the system. */
  allRoleNames: string[];
  onClose: () => void;
}

const toOptions = (names: string[]): IRoleOption[] =>
  names.map((name) => ({ name, selected: false, isVisible: true }));

/**
 * Dual-list role editor. Seeds its list state once from the loaded data (it is
 * only mounted after both queries resolve), diffs against the original
 * assignment on save, and applies the additions/removals in one batch.
 */
const UserRolesForm: React.FC<IUserRolesFormProps> = ({
  userHref,
  assignedRoles,
  allRoleNames,
  onClose,
}) => {
  const { syncRoles, isSaving } = useUserRoleActions();

  const assignedSet = useMemo(
    () => new Set(assignedRoles.map((role) => role.name)),
    [assignedRoles],
  );

  const [available, setAvailable] = useState<IRoleOption[]>(() =>
    toOptions(allRoleNames.filter((name) => !assignedSet.has(name))),
  );
  const [chosen, setChosen] = useState<IRoleOption[]>(() =>
    toOptions(allRoleNames.filter((name) => assignedSet.has(name))),
  );
  const [availableFilter, setAvailableFilter] = useState("");
  const [chosenFilter, setChosenFilter] = useState("");

  const applyFilter = (options: IRoleOption[], filter: string): IRoleOption[] =>
    options.map((option) => ({
      ...option,
      isVisible:
        filter === "" ||
        option.name.toLowerCase().includes(filter.toLowerCase()),
    }));

  const onFilterChange = (value: string, isAvailable: boolean) => {
    if (isAvailable) {
      setAvailableFilter(value);
      setAvailable((prev) => applyFilter(prev, value));
    } else {
      setChosenFilter(value);
      setChosen((prev) => applyFilter(prev, value));
    }
  };

  const onOptionSelect = (index: number, isChosen: boolean) => {
    const setter = isChosen ? setChosen : setAvailable;
    setter((prev) =>
      prev.map((option, i) =>
        i === index ? { ...option, selected: !option.selected } : option,
      ),
    );
  };

  const moveSelected = (fromAvailable: boolean) => {
    const source = fromAvailable ? available : chosen;
    const destination = fromAvailable ? chosen : available;
    const moved = source
      .filter((option) => option.selected && option.isVisible)
      .map((option) => ({ ...option, selected: false }));
    const remaining = source.filter(
      (option) => !(option.selected && option.isVisible),
    );
    const nextDestination = [...destination, ...moved];
    if (fromAvailable) {
      setAvailable(remaining);
      setChosen(nextDestination);
    } else {
      setChosen(remaining);
      setAvailable(nextDestination);
    }
  };

  const moveAll = (fromAvailable: boolean) => {
    const source = fromAvailable ? available : chosen;
    const destination = fromAvailable ? chosen : available;
    const moved = source
      .filter((option) => option.isVisible)
      .map((option) => ({ ...option, selected: false }));
    const remaining = source.filter((option) => !option.isVisible);
    const nextDestination = [...destination, ...moved];
    if (fromAvailable) {
      setAvailable(remaining);
      setChosen(nextDestination);
    } else {
      setChosen(remaining);
      setAvailable(nextDestination);
    }
  };

  const buildSearchInput = (isAvailable: boolean) => (
    <SearchInput
      value={isAvailable ? availableFilter : chosenFilter}
      onChange={(_e, value) => onFilterChange(value, isAvailable)}
      onClear={() => onFilterChange("", isAvailable)}
      aria-label={
        isAvailable ? "Search available roles" : "Search assigned roles"
      }
    />
  );

  const handleSave = async () => {
    const chosenNames = new Set(chosen.map((option) => option.name));
    const toAdd = [...chosenNames].filter((name) => !assignedSet.has(name));
    const toRemove = assignedRoles
      .filter((role) => !chosenNames.has(role.name))
      .map((role) => role.href);
    try {
      await syncRoles({ userHref, toAdd, toRemove });
      onClose();
    } catch {
      // Notification handled in useUserRoleActions; keep the modal open.
    }
  };

  return (
    <>
      <ModalBody>
        <DualListSelector>
          <DualListSelectorPane
            title="Available roles"
            searchInput={buildSearchInput(true)}
            listMinHeight="300px"
          >
            <DualListSelectorList>
              {available.map((option, index) =>
                option.isVisible ? (
                  <DualListSelectorListItem
                    key={option.name}
                    isSelected={option.selected}
                    onOptionSelect={() => onOptionSelect(index, false)}
                  >
                    {option.name}
                  </DualListSelectorListItem>
                ) : null,
              )}
            </DualListSelectorList>
          </DualListSelectorPane>
          <DualListSelectorControlsWrapper>
            <DualListSelectorControl
              isDisabled={!available.some((option) => option.selected)}
              onClick={() => moveSelected(true)}
              aria-label="Assign selected"
              icon={<AngleRightIcon />}
            />
            <DualListSelectorControl
              isDisabled={available.length === 0}
              onClick={() => moveAll(true)}
              aria-label="Assign all"
              icon={<AngleDoubleRightIcon />}
            />
            <DualListSelectorControl
              isDisabled={chosen.length === 0}
              onClick={() => moveAll(false)}
              aria-label="Remove all"
              icon={<AngleDoubleLeftIcon />}
            />
            <DualListSelectorControl
              isDisabled={!chosen.some((option) => option.selected)}
              onClick={() => moveSelected(false)}
              aria-label="Remove selected"
              icon={<AngleLeftIcon />}
            />
          </DualListSelectorControlsWrapper>
          <DualListSelectorPane
            title="Assigned roles"
            searchInput={buildSearchInput(false)}
            listMinHeight="300px"
            isChosen
          >
            <DualListSelectorList>
              {chosen.map((option, index) =>
                option.isVisible ? (
                  <DualListSelectorListItem
                    key={option.name}
                    isSelected={option.selected}
                    onOptionSelect={() => onOptionSelect(index, true)}
                  >
                    {option.name}
                  </DualListSelectorListItem>
                ) : null,
              )}
            </DualListSelectorList>
          </DualListSelectorPane>
        </DualListSelector>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          onClick={() => void handleSave()}
          isLoading={isSaving}
          isDisabled={isSaving}
        >
          Save
        </Button>
        <Button variant="link" onClick={onClose} isDisabled={isSaving}>
          Cancel
        </Button>
      </ModalFooter>
    </>
  );
};

interface IUserRolesModalInnerProps {
  user: UserResponse;
  onClose: () => void;
}

const UserRolesModalInner: React.FC<IUserRolesModalInnerProps> = ({
  user,
  onClose,
}) => {
  const userHref = user.pulp_href ?? "";
  const {
    data: assignedData,
    isLoading: assignedLoading,
    error: assignedError,
  } = useUserRolesListQuery(userHref);
  const {
    data: allRolesData,
    isLoading: allRolesLoading,
    error: allRolesError,
  } = useRolesListQuery({
    limit: 1000,
  });

  const isLoading = assignedLoading || allRolesLoading;
  const error = assignedError ?? allRolesError;

  return (
    <Modal isOpen onClose={onClose} variant="large">
      <ModalHeader title={`Manage roles for ${user.username}`} />
      <LoadingWrapper
        isFetching={isLoading}
        fetchError={error}
        isFetchingState={
          <ModalBody>
            <Bullseye>
              <Spinner aria-label="Loading roles" />
            </Bullseye>
          </ModalBody>
        }
        fetchErrorState={() => (
          <ModalBody>
            <DefaultErrorState />
          </ModalBody>
        )}
      >
        <UserRolesForm
          userHref={userHref}
          assignedRoles={(assignedData?.results ?? [])
            .filter((userRole) => userRole.pulp_href)
            .map((userRole) => ({
              name: userRole.role,
              href: userRole.pulp_href as string,
            }))}
          allRoleNames={(allRolesData?.results ?? []).map((role) => role.name)}
          onClose={onClose}
        />
      </LoadingWrapper>
    </Modal>
  );
};

interface IUserRolesModalProps {
  isOpen: boolean;
  user: UserResponse;
  onClose: () => void;
}

export const UserRolesModal: React.FC<IUserRolesModalProps> = ({
  isOpen,
  user,
  onClose,
}) => (isOpen ? <UserRolesModalInner user={user} onClose={onClose} /> : null);
