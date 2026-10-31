import type React from "react";

import { StackItem } from "@patternfly/react-core";

import { DetailSectionCard } from "@app/components/DetailSectionCard";
import { EntityDetailFields } from "@app/components/EntityDetailFields";
import type { IDetailSection } from "@app/forms";

const COLUMNS = { default: "1Col", md: "2Col" } as const;

interface IFormDetailSectionsProps {
  /** `toDetailSections(form)`, already narrowed by the page. */
  sections: IDetailSection[];
  data: Record<string, unknown>;
  copyableKeys?: string[];
}

/** An object's settings as one card per form section (ADR 0010); render inside a `Stack`. */
export const FormDetailSections: React.FC<IFormDetailSectionsProps> = ({
  sections,
  data,
  copyableKeys,
}) =>
  sections.map((section) => (
    <StackItem key={section.id}>
      <DetailSectionCard id={section.id} title={section.title}>
        <EntityDetailFields
          fields={section.fields}
          data={data}
          copyableKeys={copyableKeys}
          columnModifier={COLUMNS}
        />
      </DetailSectionCard>
    </StackItem>
  ));
