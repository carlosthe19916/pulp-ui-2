import type React from "react";
import { useState } from "react";

import {
  Alert,
  Button,
  Content,
  Form,
  FormGroup,
  FormSelect,
  FormSelectOption,
  MultipleFileUpload,
  MultipleFileUploadMain,
  Stack,
  StackItem,
  TextInput,
} from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import TimesIcon from "@patternfly/react-icons/dist/esm/icons/times-icon";
import UploadIcon from "@patternfly/react-icons/dist/esm/icons/upload-icon";

import {
  getContentType,
  getRepositoryTypesForContent,
  type IContentType,
} from "@catalog";
import type { RepositoryResponse } from "@app/client";
import { TypeaheadSelect } from "@app/components/TypeaheadSelect";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import {
  type IRepositoryListParams,
  useRepositoriesListQuery,
} from "@app/queries/repositories";

import { formatSize, perFileFields } from "./uploadFields";
import type { useUploadQueue } from "./useUploadQueue";

interface IUploadFilesFormProps {
  contentTypes: IContentType[];
  pulpType: string;
  onPulpTypeChange: (pulpType: string) => void;
  queue: ReturnType<typeof useUploadQueue>;
  errors: Map<string, string>;
  /** Shown only when the page doesn't decide the repository. */
  repositoryPicker?: {
    value?: RepositoryResponse;
    onChange: (repository?: RepositoryResponse) => void;
  };
}

/** Before uploading: content type, optional repository, drop zone and per-file fields. */
export const UploadFilesForm: React.FC<IUploadFilesFormProps> = ({
  contentTypes,
  pulpType,
  onPulpTypeChange,
  queue,
  errors,
  repositoryPicker,
}) => {
  const fields = perFileFields(getContentType(pulpType));
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue({ value: search });
  const { data, isLoading } = useRepositoriesListQuery({
    params: {
      limit: 20,
      name__icontains: debouncedSearch || undefined,
      pulp_type__in: getRepositoryTypesForContent(
        pulpType,
      ) as IRepositoryListParams["pulp_type__in"],
    },
  });
  const repositories = (data?.results ?? []).filter((repo) => repo.pulp_href);

  return (
    <Stack hasGutter>
      <StackItem>
        <Form onSubmit={(event) => event.preventDefault()}>
          {contentTypes.length > 1 && (
            <FormGroup label="Content type" fieldId="upload-type">
              <FormSelect
                id="upload-type"
                value={pulpType}
                onChange={(_event, value) => onPulpTypeChange(value)}
              >
                {contentTypes.map((type) => (
                  <FormSelectOption
                    key={type.pulpType}
                    value={type.pulpType}
                    label={type.pulpType}
                  />
                ))}
              </FormSelect>
            </FormGroup>
          )}
          {repositoryPicker && (
            <FormGroup label="Repository" fieldId="upload-repository">
              <TypeaheadSelect
                id="upload-repository"
                ariaLabel="Repository"
                placeholder="None (content only)"
                options={repositories.map((repo) => ({
                  value: repo.pulp_href ?? "",
                  label: repo.name,
                }))}
                value={repositoryPicker.value?.pulp_href ?? ""}
                selectedLabel={repositoryPicker.value?.name}
                isLoading={isLoading}
                onFilterChange={setSearch}
                onChange={(value) =>
                  repositoryPicker.onChange(
                    repositories.find((repo) => repo.pulp_href === value),
                  )
                }
              />
            </FormGroup>
          )}
        </Form>
      </StackItem>

      {repositoryPicker && !repositoryPicker.value && (
        <StackItem>
          <Alert variant="warning" isInline isPlain title="No repository">
            Content that isn&apos;t in any repository may be removed by orphan
            cleanup.
          </Alert>
        </StackItem>
      )}

      <StackItem>
        <MultipleFileUpload onFileDrop={(_event, files) => queue.add(files)}>
          <MultipleFileUploadMain
            titleIcon={<UploadIcon />}
            titleText="Drag and drop files here"
            titleTextSeparator="or"
            browseButtonText="Browse"
            infoText="Large files are uploaded in chunks."
          />
        </MultipleFileUpload>
      </StackItem>

      {queue.items.length > 0 && (
        <StackItem>
          <Table aria-label="Files to upload" variant="compact">
            <Thead>
              <Tr>
                <Th>File</Th>
                {fields.map((field) => (
                  <Th
                    key={field.key}
                    info={
                      field.helpText
                        ? { popover: field.helpText, ariaLabel: field.label }
                        : undefined
                    }
                  >
                    {field.label}
                    {field.required && " *"}
                  </Th>
                ))}
                <Th screenReaderText="Remove" />
              </Tr>
            </Thead>
            <Tbody>
              {queue.items.map((item) => (
                <Tr key={item.id}>
                  <Td dataLabel="File">
                    {item.file.name}{" "}
                    <Content component="small">
                      {formatSize(item.file.size)}
                    </Content>
                  </Td>
                  {fields.map((field) => (
                    <Td key={field.key} dataLabel={field.label}>
                      <TextInput
                        aria-label={`${field.label} of ${item.file.name}`}
                        value={item.fields[field.key] ?? ""}
                        validated={errors.has(item.id) ? "error" : "default"}
                        onChange={(_event, value) =>
                          queue.setFields({
                            id: item.id,
                            fields: { [field.key]: value },
                          })
                        }
                      />
                      {errors.has(item.id) && (
                        <Content component="small">
                          {errors.get(item.id)}
                        </Content>
                      )}
                    </Td>
                  ))}
                  <Td isActionCell>
                    <Button
                      variant="plain"
                      aria-label={`Remove ${item.file.name}`}
                      icon={<TimesIcon />}
                      onClick={() => queue.remove(item.id)}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </StackItem>
      )}
    </Stack>
  );
};
