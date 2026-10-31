import type React from "react";
import { lazy, Suspense } from "react";

import { Button, TextArea } from "@patternfly/react-core";

import type { CodeLanguage } from "../../types";

export interface ICodeEditorFieldProps {
  id: string;
  label: string;
  language: CodeLanguage;
  value: string;
  template?: string;
  downloadName?: string;
  onChange: (value: string) => void;
}

// Monaco is large: only pages that render a code field fetch it.
const CodeEditorImpl = lazy(() =>
  import("./CodeEditorImpl").then((module) => ({
    default: module.CodeEditorImpl,
  })),
);

/** YAML, JSON or PEM text in a code editor, with upload, download and copy. */
export const CodeEditorField: React.FC<ICodeEditorFieldProps> = (props) => {
  const { id, label, value, template, onChange } = props;
  return (
    <>
      <Suspense
        fallback={
          <TextArea
            id={id}
            aria-label={label}
            value={value}
            resizeOrientation="vertical"
            onChange={(_event, next) => onChange(next)}
          />
        }
      >
        <CodeEditorImpl {...props} />
      </Suspense>
      {template && !value && (
        <Button variant="link" isInline onClick={() => onChange(template)}>
          Use template
        </Button>
      )}
    </>
  );
};
