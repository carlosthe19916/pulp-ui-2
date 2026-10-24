import type React from "react";
import { useState } from "react";

import {
  Button,
  Checkbox,
  Content,
  Form,
  FormGroup,
  FormSelect,
  FormSelectOption,
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
  TabTitleText,
  Tabs,
} from "@patternfly/react-core";

import { ContentPicker } from "@app/components/ContentPicker";
import { getRepositoryContentTypes } from "@catalog";
import type { RepositoryResponse } from "@app/client";
import { TypeaheadSelect } from "@app/components/TypeaheadSelect";
import type { useContentChangeTask } from "@app/hooks/useContentChangeTask";
import { useContentUnitSelection } from "@app/hooks/useContentUnitSelection";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useNotifications } from "@app/hooks/useNotifications";
import {
  type IRepositoryListParams,
  useRepositoriesListQuery,
  useRepositoryModifyMutation,
  useRepositoryVersionsListQuery,
} from "@app/queries/repositories";
import { getMutationErrorMessage } from "@app/utils/utils";

interface IAddContentModalProps {
  repository: RepositoryResponse;
  repositoryType: string;
  onClose: () => void;
  onStarted: ReturnType<typeof useContentChangeTask>["watch"];
}

/** "From another repository": pick a repository and one of its versions. */
const SourcePicker: React.FC<{
  repositoryType: string;
  excludeHref: string;
  onChange: (versionHref?: string) => void;
}> = ({ repositoryType, excludeHref, onChange }) => {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue({ value: search });
  const [source, setSource] = useState<RepositoryResponse>();
  const [versionHref, setVersionHref] = useState("");
  const { data, isLoading } = useRepositoriesListQuery({
    params: {
      limit: 20,
      name__icontains: debouncedSearch || undefined,
      pulp_type__in: [repositoryType] as IRepositoryListParams["pulp_type__in"],
    },
  });
  const repositories = (data?.results ?? []).filter(
    (repo) => repo.pulp_href && repo.pulp_href !== excludeHref,
  );
  const { data: versions } = useRepositoryVersionsListQuery({
    repositoryHref: source?.pulp_href ?? "",
    params: { limit: 50, ordering: "-number" },
    options: { enabled: !!source },
  });

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
          <FormSelect
            id="add-content-source-version"
            value={versionHref}
            onChange={(_event, value) => {
              setVersionHref(value);
              onChange(value);
            }}
          >
            {(versions?.results ?? []).map((version) => (
              <FormSelectOption
                key={version.pulp_href}
                value={version.pulp_href ?? ""}
                label={
                  version.pulp_href === source.latest_version_href
                    ? `Latest (version ${version.number})`
                    : `Version ${version.number}`
                }
              />
            ))}
          </FormSelect>
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
