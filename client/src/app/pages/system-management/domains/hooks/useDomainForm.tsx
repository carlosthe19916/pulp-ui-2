import { useForm, type Resolver, type UseFormReturn } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import type {
  Domain,
  DomainResponse,
  PatchedDomain,
  StorageClassEnum,
} from "@app/client";

import { extractIdFromHref } from "@app/queries/utils/pulpHref";

import {
  buildStorageSettingsSchema,
  STORAGE_BACKEND_BY_CLASS,
} from "../storageBackends";
import { useDomainActions } from "./useDomainActions";

const DEFAULT_STORAGE_CLASS: StorageClassEnum =
  "pulpcore.app.models.storage.FileSystem";

const NAME_PATTERN = /^[-a-zA-Z0-9_]+$/;

export type DomainFormValues = {
  name: string;
  description: string;
  storage_class: StorageClassEnum;
  redirect_to_object_storage: boolean;
  hide_guarded_distributions: boolean;
  /** Per-backend `storage_settings` values, keyed by field key. */
  storage_settings: Record<string, string>;
};

const buildDomainSchema = () =>
  yup.object({
    name: yup
      .string()
      .default("")
      .required("Name is required")
      .max(50, "Name must be at most 50 characters")
      .matches(
        NAME_PATTERN,
        "Name may only contain letters, numbers, hyphens and underscores",
      ),
    description: yup.string().default(""),
    storage_class: yup
      .string<StorageClassEnum>()
      .default(DEFAULT_STORAGE_CLASS)
      .required("Storage backend is required"),
    redirect_to_object_storage: yup.boolean().default(true),
    hide_guarded_distributions: yup.boolean().default(false),
    storage_settings: yup
      .object()
      .default({})
      .when("storage_class", ([storageClass]) =>
        buildStorageSettingsSchema(storageClass as StorageClassEnum),
      ),
  });

// Seed only the backend's known fields; secrets the API redacts come back empty.
const toStorageSettingsDefaults = (
  domain?: DomainResponse,
): Record<string, string> => {
  if (!domain) return {};
  const backend = STORAGE_BACKEND_BY_CLASS[domain.storage_class];
  // The generated response type omits storage_settings (write-only in the schema),
  // but the API returns it, so read it through a narrow cast.
  const settings =
    (domain as { storage_settings?: Record<string, unknown> })
      .storage_settings ?? {};
  return Object.fromEntries(
    (backend?.settingsFields ?? [])
      .map((field) => [field.key, settings[field.key]] as const)
      .filter(([, value]) => value != null && value !== "")
      .map(([key, value]) => [key, String(value)]),
  );
};

const toDefaults = (domain?: DomainResponse): DomainFormValues => ({
  name: domain?.name ?? "",
  description: domain?.description ?? "",
  storage_class: domain?.storage_class ?? DEFAULT_STORAGE_CLASS,
  redirect_to_object_storage: domain?.redirect_to_object_storage ?? true,
  hide_guarded_distributions: domain?.hide_guarded_distributions ?? false,
  storage_settings: toStorageSettingsDefaults(domain),
});

const collectStorageSettings = (
  values: Record<string, string>,
): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(values)
      .map(([key, value]) => [key, value?.trim()] as const)
      .filter(([, value]) => value),
  );

interface IUseDomainFormArgs {
  domain?: DomainResponse;
  onClose: () => void;
}

interface IUseDomainFormResult {
  form: UseFormReturn<DomainFormValues>;
  isCreate: boolean;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export const useDomainForm = ({
  domain,
  onClose,
}: IUseDomainFormArgs): IUseDomainFormResult => {
  const isCreate = !domain;
  const { createDomain, updateDomain } = useDomainActions();

  const form = useForm<DomainFormValues>({
    // Cast needed: the `.when(...)`-built `storage_settings` schema is a generic yup
    // object that doesn't infer as Record<string, string>.
    resolver: yupResolver(buildDomainSchema()) as Resolver<DomainFormValues>,
    defaultValues: toDefaults(domain),
    mode: "onChange",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const description = values.description.trim();

    if (isCreate) {
      const body: Domain = {
        name: values.name,
        description: description || null,
        storage_class: values.storage_class,
        storage_settings: collectStorageSettings(values.storage_settings),
        redirect_to_object_storage: values.redirect_to_object_storage,
        hide_guarded_distributions: values.hide_guarded_distributions,
      };
      try {
        await createDomain(body);
        onClose();
      } catch {
        // Keep the modal open; the error is already surfaced as a toast.
      }
      return;
    }

    if (!domain?.pulp_href) return;
    const domainId = extractIdFromHref(domain.pulp_href);
    const body: PatchedDomain = {
      name: values.name,
      description: description || null,
      storage_class: values.storage_class,
      storage_settings: collectStorageSettings(values.storage_settings),
      redirect_to_object_storage: values.redirect_to_object_storage,
      hide_guarded_distributions: values.hide_guarded_distributions,
    };
    try {
      // Wait for the 202 before closing; the row then shows "Updating".
      await updateDomain(domainId, body);
      onClose();
    } catch {
      // Keep the modal open; the error is already surfaced as a toast.
    }
  });

  return {
    form,
    isCreate,
    onSubmit,
    isSubmitting: form.formState.isSubmitting,
  };
};
