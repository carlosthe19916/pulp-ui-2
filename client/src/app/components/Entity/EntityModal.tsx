import { type ReactNode, use, useState } from "react";

import {
  Bullseye,
  Button,
  Form,
  FormGroup,
  FormSelect,
  FormSelectOption,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Spinner,
} from "@patternfly/react-core";

import {
  type EntityType,
  getAvailablePlugins,
  getEntityLabel,
  getPlugin,
  type IPlugin,
} from "@catalog";
import { EntityFormFields } from "@app/components/EntityFormFields";
import { EntityWizardBody } from "@app/components/Entity/EntityWizardBody";
import type { ITypeaheadOption } from "@app/components/TypeaheadSelect";
import type { IContentFamilyConfig } from "@app/queries/utils/families";
import { ApiStatusContext } from "@app/context/ApiStatus/ApiStatusContext";
import { useEntityForm, type IEntityForEdit } from "@app/hooks/useEntityForm";
import { usePublicationsListQuery } from "@app/queries/publications";
import { useRemotesListQuery } from "@app/queries/remotes";
import { useRepositoriesListQuery } from "@app/queries/repositories";
import { useEntityDetailQuery } from "@app/queries/utils/entityCrud";
import {
  extractIdFromHref,
  resolvePulpType,
} from "@app/queries/utils/pulpHref";

const FORM_ID = "entity-form";

/** pulp_types that can't be created from the UI (e.g. push repos are populated by `podman push`). */
const NON_CREATABLE_TYPES = new Set(["container.container-push"]);

interface IEntityFormBodyProps {
  config: IContentFamilyConfig;
  plugin: IPlugin | undefined;
  entity?: IEntityForEdit;
  onClose: () => void;
  typeSelector?: ReactNode;
  resourceOptions: Partial<Record<EntityType, ITypeaheadOption[]>>;
}

/** Keyed by selected type so the form re-initializes when the type changes. */
const EntityFormBody = ({
  config,
  plugin,
  entity,
  onClose,
  typeSelector,
  resourceOptions,
}: IEntityFormBodyProps) => {
  const { form, isCreate, fields, onSubmit, isSubmitting } = useEntityForm({
    config,
    plugin,
    entity,
    onClose,
  });

  return (
    <>
      <ModalBody>
        <Form
          id={FORM_ID}
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          {typeSelector}
          <EntityFormFields
            fields={fields}
            control={form.control}
            idPrefix={FORM_ID}
            resourceOptions={resourceOptions}
          />
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="primary"
          type="submit"
          form={FORM_ID}
          isLoading={isSubmitting}
          isDisabled={isSubmitting || (isCreate && !plugin)}
        >
          {isCreate ? "Create" : "Save"}
        </Button>
        <Button variant="link" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </>
  );
};

interface IEntityModalInnerProps {
  config: IContentFamilyConfig;
  entity?: IEntityForEdit;
  onClose: () => void;
}

const EntityModalInner = ({
  config,
  entity,
  onClose,
}: IEntityModalInnerProps) => {
  const isCreate = !entity;
  const plugins = use(ApiStatusContext)?.plugins ?? [];

  const available = getAvailablePlugins(config.kind, plugins).filter(
    (plugin) => !NON_CREATABLE_TYPES.has(plugin.pulpType),
  );
  const [selectedType, setSelectedType] = useState(
    available[0]?.pulpType ?? "",
  );

  const editType = entity ? (resolvePulpType(entity.pulp_href) ?? "") : "";
  const plugin = getPlugin(isCreate ? selectedType : editType);

  // Edit: fetch the full typed entity so plugin-specific fields pre-fill.
  const { data: fullEntity, isLoading: isDetailLoading } =
    useEntityDetailQuery<IEntityForEdit>(
      config.rootQueryKey,
      entity?.pulp_href ?? "",
    );
  const effectiveEntity = fullEntity ?? entity;

  // Options for `resource` fields (repository/remote/publication pickers).
  const { data: repoData } = useRepositoriesListQuery({
    limit: 100,
    offset: 0,
    ordering: "name",
  });
  const { data: remoteData } = useRemotesListQuery({
    limit: 100,
    offset: 0,
    ordering: "name",
  });
  const { data: publicationData } = usePublicationsListQuery({
    limit: 100,
    offset: 0,
  });

  // Restrict reference pickers to compatible types (mirroring the backend): a
  // Repository's Remote picker to its `compatibleRemoteTypes`, and a Publication's
  // Repository picker to repos whose `compatiblePublicationTypes` include its type.
  const compatibleRemoteTypes =
    config.kind === "repository"
      ? plugin?.entities.repository?.compatibleRemoteTypes
      : undefined;
  const publicationType =
    config.kind === "publication" ? plugin?.pulpType : undefined;

  const repositoryOptions: ITypeaheadOption[] = (repoData?.results ?? [])
    .filter((repo) => {
      if (!publicationType) return true;
      const repoType = resolvePulpType(repo.pulp_href);
      const repoPlugin = repoType ? getPlugin(repoType) : undefined;
      return (
        repoPlugin?.entities.repository?.compatiblePublicationTypes.includes(
          publicationType,
        ) ?? false
      );
    })
    .map((repo) => ({ value: repo.pulp_href ?? "", label: repo.name ?? "" }));
  const remoteOptions: ITypeaheadOption[] = (remoteData?.results ?? [])
    .filter(
      (remote) =>
        !compatibleRemoteTypes ||
        compatibleRemoteTypes.includes(resolvePulpType(remote.pulp_href) ?? ""),
    )
    .map((remote) => ({
      value: remote.pulp_href ?? "",
      label: remote.name ?? "",
    }));
  const publicationOptions: ITypeaheadOption[] = (
    publicationData?.results ?? []
  ).map((pub) => ({
    value: pub.pulp_href ?? "",
    label: pub.pulp_href
      ? `Publication ${extractIdFromHref(pub.pulp_href)}`
      : "",
  }));

  const typeSelector =
    isCreate && available.length > 1 ? (
      <FormGroup label="Type" fieldId="entity-type" isRequired>
        <FormSelect
          id="entity-type"
          value={selectedType}
          onChange={(_e, value) => setSelectedType(value)}
        >
          {available.map((p) => (
            <FormSelectOption
              key={p.pulpType}
              value={p.pulpType}
              label={p.label}
            />
          ))}
        </FormSelect>
      </FormGroup>
    ) : undefined;

  const label = getEntityLabel(config.kind);
  const title = isCreate ? `Create ${label}` : `Edit ${entity?.name ?? label}`;
  const bodyKey = isCreate
    ? selectedType
    : (effectiveEntity?.pulp_href ?? "edit");
  const resourceOptions = {
    repository: repositoryOptions,
    remote: remoteOptions,
    publication: publicationOptions,
  };

  // Wizard vs plain modal comes from the catalog plugin (`form.isWizard`); wizard
  // steps come from each field's `group`.
  const useWizard = plugin?.entities[config.kind]?.form.isWizard ?? false;

  if (!isCreate && isDetailLoading) {
    return (
      <Modal
        isOpen
        onClose={onClose}
        variant={useWizard ? "large" : "medium"}
        aria-label={title}
      >
        <ModalHeader title={title} />
        <ModalBody>
          <Bullseye>
            <Spinner aria-label="Loading" />
          </Bullseye>
        </ModalBody>
      </Modal>
    );
  }

  if (useWizard) {
    // No Modal `onClose` here: it would render a second close button next to the
    // WizardHeader's. Escape is wired via `onEscapePress` instead.
    return (
      <Modal isOpen onEscapePress={onClose} variant="large" aria-label={title}>
        <EntityWizardBody
          key={bodyKey}
          config={config}
          plugin={plugin}
          entity={isCreate ? undefined : effectiveEntity}
          onClose={onClose}
          title={title}
          typeSelector={typeSelector}
          resourceOptions={resourceOptions}
        />
      </Modal>
    );
  }

  return (
    <Modal isOpen onClose={onClose} variant="medium">
      <ModalHeader title={title} />
      <EntityFormBody
        key={bodyKey}
        config={config}
        plugin={plugin}
        entity={isCreate ? undefined : effectiveEntity}
        onClose={onClose}
        typeSelector={typeSelector}
        resourceOptions={resourceOptions}
      />
    </Modal>
  );
};

interface IEntityModalProps {
  config: IContentFamilyConfig;
  isOpen: boolean;
  entity?: IEntityForEdit;
  onClose: () => void;
}

/** Generic create/edit modal for any content family; only mounted while open. */
export const EntityModal = ({
  config,
  isOpen,
  entity,
  onClose,
}: IEntityModalProps) =>
  isOpen ? (
    <EntityModalInner config={config} entity={entity} onClose={onClose} />
  ) : null;
