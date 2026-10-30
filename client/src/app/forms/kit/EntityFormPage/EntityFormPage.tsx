import type React from "react";
import { useId, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";

import { PageHeader } from "@patternfly/react-component-groups/dist/dynamic/PageHeader";
import {
  Button,
  Flex,
  FlexItem,
  Form,
  Grid,
  GridItem,
  JumpLinks,
  JumpLinksItem,
  PageSection,
} from "@patternfly/react-core";

import { ConfirmActionModal } from "@app/components/ConfirmActionModal";
import { DocumentTitle } from "@app/components/DocumentTitle";
import { FormSubmitError } from "@app/components/FormSubmitError";
import { GatedButton } from "@app/components/GatedButton";
import { toFieldRecord } from "@app/utils/formSchema";
import type { ResourceFilterMap } from "@app/utils/resourceFilter";
import type { IMutationErrorMessage } from "@app/utils/utils";

import { buildCreateBody, buildPatchBody } from "../derive/body";
import { buildDefaultValues } from "../derive/defaults";
import {
  initialExpandedSections,
  sectionsWithErrors,
} from "../derive/sectionState";
import { isSectionVisible } from "../derive/visibility";
import type { FormMode, FormValues, IFormContext, IFormDef } from "../types";
import { formResolver } from "./formResolver";
import { FormSectionView } from "./FormSectionView";
import { type ITypeOption, PluginTypeSelect } from "./PluginTypeSelect";
import { useUnsavedChangesGuard } from "./useUnsavedChangesGuard";

/** Jump links appear once a form has this many visible sections. */
const JUMP_LINKS_MIN_SECTIONS = 4;

export interface ISubmitHelpers {
  /** Call when the request succeeds: lifts the leave prompt, then runs `onSaved`. */
  saved: (href?: string) => void;
}

export interface ITypeSelectProps {
  options: ITypeOption[];
  value: string;
  /** Called with the current values so the page can carry the shared ones over. */
  onChange: (pulpType: string, values: FormValues) => void;
}

interface IEntityFormPageProps {
  form: IFormDef;
  mode: FormMode;
  /** The edited object, as the detail query returned it. */
  entity?: object;
  /** Values carried over from another type; they count as unsaved changes. */
  initialValues?: FormValues;
  breadcrumbs: React.ReactNode;
  /** Shown beside the title (e.g. the plugin type). */
  label?: React.ReactNode;
  typeSelect?: ITypeSelectProps;
  resourceFilter: ResourceFilterMap;
  submitError: IMutationErrorMessage | null;
  isSubmitting: boolean;
  /** Permission props for the submit button (`disabledProps("change")`). */
  submitProps?: {
    isAriaDisabled?: boolean;
    tooltipProps?: { content: React.ReactNode };
  };
  /** Runs the request; call `saved()` from its success callback. */
  onSubmit: (body: Record<string, unknown>, helpers: ISubmitHelpers) => void;
  /** Where to go after saving, given the saved object's href when the request returned it. */
  onSaved: (href?: string) => void;
  onCancel: () => void;
}

/**
 * A create/edit page rendered from a form definition: header, optional jump links,
 * sections, sticky Save/Cancel and an unsaved-changes prompt. Controlled: the page owns
 * the mutation, toasts and navigation.
 */
export const EntityFormPage: React.FC<IEntityFormPageProps> = ({
  form,
  mode,
  entity: editedObject,
  initialValues,
  breadcrumbs,
  label,
  typeSelect,
  resourceFilter,
  submitError,
  isSubmitting,
  submitProps,
  onSubmit,
  onSaved,
  onCancel,
}) => {
  const formId = useId();
  const entity = editedObject ? toFieldRecord(editedObject) : undefined;
  // Carried-over values go in as `values`, not defaults, so the form starts dirty and
  // leaving still asks.
  const [defaultValues] = useState<FormValues>(() =>
    buildDefaultValues({ form, mode, entity }),
  );
  const [startValues] = useState<FormValues | undefined>(() =>
    initialValues ? { ...defaultValues, ...initialValues } : undefined,
  );
  // Built once: a resolver recreated on every render re-registers with the form.
  const [resolver] = useState(() => formResolver({ form, mode, entity }));
  const methods = useForm<FormValues>({
    defaultValues,
    values: startValues,
    resetOptions: { keepDefaultValues: true },
    mode: "onChange",
    resolver,
  });
  const values = useWatch({ control: methods.control }) as FormValues;
  const ctx: IFormContext = { mode, values, entity };

  const [expanded, setExpanded] = useState<Set<string>>(() =>
    initialExpandedSections({
      form,
      ctx: { mode, values: startValues ?? defaultValues, entity },
    }),
  );
  const setSectionExpanded = ({
    id,
    isExpanded,
  }: {
    id: string;
    isExpanded: boolean;
  }) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (isExpanded) next.add(id);
      else next.delete(id);
      return next;
    });

  const { isDirty } = methods.formState;
  const guard = useUnsavedChangesGuard({ when: isDirty && !isSubmitting });

  const visibleSections = form.sections.filter((section) =>
    isSectionVisible({ section, ctx }),
  );
  const anchorId = (sectionId: string) => `${formId}-section-${sectionId}`;
  const hasJumpLinks = visibleSections.length >= JUMP_LINKS_MIN_SECTIONS;
  const title = form.title[mode];

  const saved = (href?: string) => {
    guard.allowLeave();
    onSaved(href);
  };

  const submit = methods.handleSubmit(
    (submitted) => {
      if (mode === "create") {
        onSubmit(buildCreateBody({ form, values: submitted }), { saved });
        return;
      }
      const body = buildPatchBody({
        form,
        values: submitted,
        initialValues: defaultValues,
        entity,
      });
      // E.g. "Change" opened on a secret but left empty: no request, no pointless task.
      if (Object.keys(body).length === 0) saved();
      else onSubmit(body, { saved });
    },
    (errors) => {
      const toOpen = sectionsWithErrors({
        form,
        errorKeys: Object.keys(errors),
      });
      setExpanded((current) => new Set([...current, ...toOpen]));
    },
  );

  const jumpTo = (sectionId: string) => {
    setSectionExpanded({ id: sectionId, isExpanded: true });
    document
      .getElementById(anchorId(sectionId))
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const formBody = (
    <Form id={formId} onSubmit={(event) => void submit(event)} isWidthLimited>
      <FormSubmitError error={submitError} />
      {typeSelect && (
        <PluginTypeSelect
          id={`${formId}-type`}
          options={typeSelect.options}
          value={typeSelect.value}
          onChange={(pulpType) =>
            typeSelect.onChange(pulpType, methods.getValues())
          }
        />
      )}
      {visibleSections.map((section) => (
        <FormSectionView
          key={section.id}
          section={section}
          ctx={ctx}
          anchorId={anchorId(section.id)}
          idPrefix={formId}
          resourceFilter={resourceFilter}
          isExpanded={expanded.has(section.id)}
          onToggle={(isExpanded) =>
            setSectionExpanded({ id: section.id, isExpanded })
          }
        />
      ))}
    </Form>
  );

  return (
    <>
      <DocumentTitle title={title} />
      <PageHeader
        title={title}
        label={label}
        breadcrumbs={breadcrumbs}
        linkProps={
          form.docsUrl
            ? {
                label: "Plugin documentation",
                href: form.docsUrl,
                isExternal: true,
              }
            : undefined
        }
      />
      <PageSection isFilled>
        <FormProvider {...methods}>
          {hasJumpLinks ? (
            <Grid hasGutter>
              <GridItem md={3} xl={2}>
                <JumpLinks isVertical label="Jump to section">
                  {visibleSections.map((section) => (
                    <JumpLinksItem
                      key={section.id}
                      href={`#${anchorId(section.id)}`}
                      onClick={(event) => {
                        event.preventDefault();
                        jumpTo(section.id);
                      }}
                    >
                      {section.title}
                    </JumpLinksItem>
                  ))}
                </JumpLinks>
              </GridItem>
              <GridItem md={9} xl={10}>
                {formBody}
              </GridItem>
            </Grid>
          ) : (
            formBody
          )}
        </FormProvider>
      </PageSection>
      <PageSection stickyOnBreakpoint={{ default: "bottom" }}>
        <Flex>
          <FlexItem>
            <GatedButton
              type="submit"
              form={formId}
              variant="primary"
              isLoading={isSubmitting}
              isDisabled={isSubmitting || (mode === "edit" && !isDirty)}
              {...submitProps}
            >
              {mode === "create" ? "Create" : "Save"}
            </GatedButton>
          </FlexItem>
          <FlexItem>
            <Button variant="link" onClick={onCancel}>
              Cancel
            </Button>
          </FlexItem>
        </Flex>
      </PageSection>
      <ConfirmActionModal
        isOpen={guard.isBlocked}
        title="Leave without saving?"
        body="Your changes on this page will be lost."
        confirmLabel="Leave"
        cancelLabel="Stay"
        confirmVariant="primary"
        onConfirm={guard.proceed}
        onCancel={guard.stay}
      />
    </>
  );
};
