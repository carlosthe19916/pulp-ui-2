import type React from "react";
import { useState } from "react";

import {
  Button,
  Checkbox,
  Content,
  Form,
  FormGroup,
  Label,
  LabelGroup,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Stack,
  StackItem,
  Tab,
  TabContentBody,
  Tabs,
  TabTitleText,
} from "@patternfly/react-core";

import type { RepositoryResponse } from "@app/client";
import { ContentPicker } from "@app/components/ContentPicker";
import { TypeaheadSelect } from "@app/components/TypeaheadSelect";
import { VersionSelect } from "@app/components/VersionSelect";
import { DROPDOWN_PAGE_SIZE } from "@app/constants";
import type { useContentChangeTask } from "@app/hooks/useContentChangeTask";
import { useContentUnitSelection } from "@app/hooks/useContentUnitSelection";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useNotifications } from "@app/hooks/useNotifications";
import {
  type IRepositoryListParams,
  useRepositoriesListQuery,
  useRepositoryModifyMutation,
} from "@app/queries/repositories";
import { getMutationErrorMessage } from "@app/utils/utils";
import { getRepositoryContentTypes } from "@catalog";

interface IAddContentModalProps {
  repository: RepositoryResponse;
  repositoryType: string;
  onClose: () => void;
  onStarted: ReturnType<typeof useContentChangeTask>["watch"];
}

interface ISourcePickerProps {
  repositoryType: string;
  excludeHref: string;
  onChange: (versionHref?: string) => void;
}

/** "From another repository": pick a repository and one of its versions. */
const SourcePicker: React.FC<ISourcePickerProps> = ({
  repositoryType,
  excludeHref,
  onChange,
}) => {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue({ value: search });
  const [source, setSource] = useState<RepositoryResponse>();
  const [versionHref, setVersionHref] = useState("");
  const { data, isLoading } = useRepositoriesListQuery({
    params: {
      limit: DROPDOWN_PAGE_SIZE,
      offset: 0,
      name__icontains: debouncedSearch || undefined,
      pulp_type__in: [repositoryType] as IRepositoryListParams["pulp_type__in"],
    },
  });
  const repositories = (data?.results ?? []).filter(
    (repo) => repo.pulp_href && repo.pulp_href !== excludeHref,
  );

  return (
    <Form isHorizontal onSubmit={(event) => event.preventDefault()}>
      <FormGroup label="Repository" fieldId="add-content-source">
        <TypeaheadSelect
          id="add-content-source"
          ariaLabel="Source repository"
          placeholder="Select a repository"
          options={repositories.map((repo) => ({
            value: repo.pulp_href ?? "",
            label: repo.name,
          }))}
          value={source?.pulp_href ?? ""}
          selectedLabel={source?.name}
          isLoading={isLoading}
          onFilterChange={setSearch}
          onChange={(value) => {
            const next = repositories.find((repo) => repo.pulp_href === value);
            setSource(next);
            setVersionHref(next?.latest_version_href ?? "");
            onChange(next?.latest_version_href ?? undefined);
          }}
        />
      </FormGroup>
      {source && (
        <FormGroup label="Version" fieldId="add-content-source-version">
          <VersionSelect
            // A new source starts a fresh search.
            key={source.pulp_href}
            id="add-content-source-version"
            label="Version"
            repositoryHref={source.pulp_href ?? ""}
            latestVersionHref={source.latest_version_href ?? undefined}
            value={versionHref}
            onChange={(value) => {
              setVersionHref(value);
              onChange(value);
            }}
            isToggleFullWidth
          />
        </FormGroup>
      )}
    </Form>
  );
};

/**
 * Adds existing content to a repository, picked from all content or from another
 * repository's version. One selection tray spans both tabs.
 */
export const AddContentModal: React.FC<IAddContentModalProps> = ({
  repository,
  repositoryType,
  onClose,
  onStarted,
}) => {
  const { addNotification } = useNotifications();
  const modifyMutation = useRepositoryModifyMutation({
    onSuccess: (data, variables) =>
      onStarted({ taskHref: data.task, ...variables }),
    onError: (error) =>
      addNotification({
        ...getMutationErrorMessage({
          error,
          fallback: `Could not add content to "${repository.name}"`,
        }),
        variant: "danger",
      }),
  });
  const selection = useContentUnitSelection();
  const [activeTab, setActiveTab] = useState<string | number>("existing");
  const [sourceVersionHref, setSourceVersionHref] = useState<string>();
  const [overwrite, setOverwrite] = useState(true);
  const contentTypes = getRepositoryContentTypes(repositoryType).filter(
    (type) => type.apiPath,
  );
  const latestVersionHref = repository.latest_version_href ?? undefined;
  const count = selection.selected.length;

  return (
    <Modal isOpen onClose={onClose} variant="large">
      <ModalHeader
        title={`Add content to "${repository.name}"`}
        description="Each change creates a new version of the repository."
      />
      <ModalBody>
        <Stack hasGutter>
          <StackItem>
            <Tabs
              activeKey={activeTab}
              onSelect={(_event, key) => setActiveTab(key)}
              aria-label="Content source"
              mountOnEnter
            >
              <Tab
                eventKey="existing"
                title={<TabTitleText>Existing content</TabTitleText>}
              >
                <TabContentBody hasPadding>
                  <ContentPicker
                    contentTypes={contentTypes}
                    latestVersionHref={latestVersionHref}
                    repositoryName={repository.name}
                    selection={selection}
                  />
                </TabContentBody>
              </Tab>
              <Tab
                eventKey="repository"
                title={<TabTitleText>From another repository</TabTitleText>}
              >
                <TabContentBody hasPadding>
                  <Stack hasGutter>
                    <StackItem>
                      <SourcePicker
                        repositoryType={repositoryType}
                        excludeHref={repository.pulp_href ?? ""}
                        onChange={setSourceVersionHref}
                      />
                    </StackItem>
                    {sourceVersionHref && (
                      <StackItem>
                        <ContentPicker
                          // A new source version starts a fresh list.
                          key={sourceVersionHref}
                          contentTypes={contentTypes}
                          latestVersionHref={latestVersionHref}
                          sourceVersionHref={sourceVersionHref}
                          repositoryName={repository.name}
                          selection={selection}
                        />
                      </StackItem>
                    )}
                  </Stack>
                </TabContentBody>
              </Tab>
            </Tabs>
          </StackItem>
          <StackItem>
            {count > 0 ? (
              <LabelGroup
                categoryName={`Selected (${count})`}
                numLabels={8}
                isClosable
                onClick={selection.clear}
                closeBtnAriaLabel="Clear the selection"
              >
                {selection.selected.map((unit) => (
                  <Label
                    key={unit.href}
                    onClose={() =>
                      selection.setUnits({ units: [unit], isSelecting: false })
                    }
                  >
                    {unit.label}
                  </Label>
                ))}
              </LabelGroup>
            ) : (
              <Content component="small">No content selected.</Content>
            )}
          </StackItem>
          <StackItem>
            <Checkbox
              id="add-content-overwrite"
              label="Overwrite matching content"
              description="Replace content in the repository that has the same identity (for example the same relative path). Clear to fail instead."
              isChecked={overwrite}
              onChange={(_event, checked) => setOverwrite(checked)}
            />
          </StackItem>
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          isDisabled={count === 0 || modifyMutation.isPending}
          isLoading={modifyMutation.isPending}
          onClick={() =>
            modifyMutation.mutate(
              {
                repository,
                body: {
                  add_content_units: selection.selected.map(
                    (unit) => unit.href,
                  ),
                  overwrite,
                },
              },
              { onSuccess: onClose },
            )
          }
        >
          {count > 0
            ? `Add ${count === 1 ? "1 unit" : `${count} units`}`
            : "Add"}
        </Button>
        <Button variant="link" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};
