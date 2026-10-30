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
  /** Lets the next navigation through without the unsaved-changes prompt. */
  allowLeave: () => void;
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
  entity?: Record<string, unknown>;
  /** Values that override the defaults (carried over from another type). */
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
  onSubmit: (body: Record<string, unknown>, helpers: ISubmitHelpers) => void;
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
  entity,
  initialValues,
  breadcrumbs,
  label,
  typeSelect,
  resourceFilter,
  submitError,
  isSubmitting,
  submitProps,
  onSubmit,
  onCancel,
}) => {
  const formId = useId();
  const [defaultValues] = useState<FormValues>(() => ({
    ...buildDefaultValues({ form, mode, entity }),
    ...initialValues,
  }));
  const methods = useForm<FormValues>({
    defaultValues,
    mode: "onChange",
    resolver: formResolver({ form, mode, entity }),
  });
  const values = useWatch({ control: methods.control }) as FormValues;
  const ctx: IFormContext = {
    mode,
    values: { ...defaultValues, ...values },
    entity,
  };

  const [expanded, setExpanded] = useState<Set<string>>(() =>
    initialExpandedSections({
      form,
      ctx: { mode, values: defaultValues, entity },
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

  const submit = methods.handleSubmit(
    (submitted) => {
      const body =
        mode === "create"
          ? buildCreateBody({ form, values: submitted })
          : buildPatchBody({
              form,
              values: submitted,
              initialValues: defaultValues,
              entity,
            });
      onSubmit(body, { allowLeave: guard.allowLeave });
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
