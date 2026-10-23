import type React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import {
  Button,
  Checkbox,
  Content,
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

import { getRepositoryTypesForContent } from "@catalog";
import type { RepositoryResponse } from "@app/client";
import { FormSubmitError } from "@app/components/FormSubmitError";
import { TypeaheadSelect } from "@app/components/TypeaheadSelect";
import type { useContentChangeTask } from "@app/hooks/useContentChangeTask";
import type { IContentUnitRef } from "@app/hooks/useContentUnitSelection";
import { useDebouncedValue } from "@app/hooks/useDebouncedValue";
import { useSubmitError } from "@app/hooks/useSubmitError";
import {
  type IRepositoryListParams,
  useRepositoriesListQuery,
  useRepositoryModifyMutation,
} from "@app/queries/repositories";
import { latestVersionNumber } from "@app/utils/latestVersionNumber";
import { getMutationErrorMessage } from "@app/utils/utils";

const addSchema = yup.object({
  repository: yup.string().required("Select a repository"),
  overwrite: yup.boolean(),
});

type AddFormValues = yup.InferType<typeof addSchema>;

/** Repository types that can hold every selected unit's type. */
const compatibleRepositoryTypes = (units: IContentUnitRef[]): string[] => {
  const contentTypes = [...new Set(units.map((unit) => unit.pulpType ?? ""))];
  const [first = "", ...rest] = contentTypes;
  return getRepositoryTypesForContent(first).filter((repositoryType) =>
    rest.every((type) =>
      getRepositoryTypesForContent(type).includes(repositoryType),
    ),
  );
};

interface IAddToRepositoryModalProps {
  units: IContentUnitRef[];
  onClose: () => void;
  /** The change was accepted: the page follows its task to the end. */
  onStarted: ReturnType<typeof useContentChangeTask>["watch"];
}

/** Adds content units to a repository the user picks; the change creates a new version. */
export const AddToRepositoryModal: React.FC<IAddToRepositoryModalProps> = ({
  units,
  onClose,
  onStarted,
}) => {
  const { submitError, setSubmitError, clearSubmitError } = useSubmitError();
  const modifyMutation = useRepositoryModifyMutation();

  const repositoryTypes = compatibleRepositoryTypes(units);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue({ value: search });
  const [selected, setSelected] = useState<RepositoryResponse>();
  const { data, isLoading } = useRepositoriesListQuery({
    params: {
      limit: 20,
      name__icontains: debouncedSearch || undefined,
      pulp_type__in: repositoryTypes as IRepositoryListParams["pulp_type__in"],
    },
  });
  const repositories = (data?.results ?? []).filter((repo) => repo.pulp_href);

  const {
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AddFormValues>({
    resolver: yupResolver(addSchema),
    defaultValues: { repository: "", overwrite: true },
  });
  const repositoryHref = watch("repository");
  const overwrite = watch("overwrite");

  const onSubmit = handleSubmit(async (values) => {
    clearSubmitError();
    if (!selected) return;
    const body = {
      add_content_units: units.map((unit) => unit.href),
      overwrite: values.overwrite,
    };
    try {
      const result = await modifyMutation.mutateAsync({
        repository: selected,
        body,
      });
      onStarted({ taskHref: result.task, repository: selected, body });
    } catch (error) {
      setSubmitError(
        getMutationErrorMessage({
          error,
          fallback: `Could not add content to "${selected.name}"`,
        }),
      );
      return;
    }
    onClose();
  });

  const count = units.length === 1 ? "1 unit" : `${units.length} units`;
  const selectedVersion = latestVersionNumber(selected);

  return (
    <Modal isOpen onClose={onClose} variant="small">
      <ModalHeader title={`Add ${count} to a repository`} />
      <ModalBody>
        <Form
          id="add-to-repository-form"
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit();
          }}
        >
          <FormSubmitError error={submitError} />
          {repositoryTypes.length === 0 ? (
            <Content component="p">
              No repository type can hold all of the selected content.
            </Content>
          ) : (
            <FormGroup
              label="Repository"
              fieldId="add-to-repository"
              isRequired
            >
              <TypeaheadSelect
                id="add-to-repository"
                ariaLabel="Repository"
                placeholder="Select a repository"
                options={repositories.map((repo) => ({
                  value: repo.pulp_href ?? "",
                  label: repo.name,
                }))}
                value={repositoryHref}
                selectedLabel={selected?.name}
                isLoading={isLoading}
                onFilterChange={setSearch}
                onChange={(value) => {
                  setValue("repository", value, { shouldValidate: true });
                  setSelected(
                    repositories.find((repo) => repo.pulp_href === value),
                  );
                }}
              />
              <FormHelperText>
                <HelperText>
                  <HelperTextItem
                    variant={errors.repository ? "error" : "default"}
                  >
                    {errors.repository?.message ??
                      (selected
                        ? `"${selected.name}" is at version ${selectedVersion ?? 0}. Adding creates a new version.`
                        : "Only repositories that can hold this content are listed.")}
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            </FormGroup>
          )}
          <FormGroup fieldId="add-to-repository-overwrite">
            <Checkbox
              id="add-to-repository-overwrite"
              label="Overwrite matching content"
              description="Replace content in the repository that has the same identity (for example the same relative path). Clear to fail instead."
              isChecked={Boolean(overwrite)}
              onChange={(_event, checked) => setValue("overwrite", checked)}
            />
          </FormGroup>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          type="submit"
          form="add-to-repository-form"
          isLoading={isSubmitting || modifyMutation.isPending}
          isDisabled={
            repositoryTypes.length === 0 ||
            isSubmitting ||
            modifyMutation.isPending
          }
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
