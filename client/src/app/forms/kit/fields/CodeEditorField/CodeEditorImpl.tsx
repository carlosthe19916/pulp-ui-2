import type React from "react";

import { CodeEditor, Language } from "@patternfly/react-code-editor";

import "./monacoSetup";
import type { CodeLanguage } from "../../types";
import type { ICodeEditorFieldProps } from "./CodeEditorField";

const LANGUAGE: Record<CodeLanguage, Language> = {
  yaml: Language.yaml,
  json: Language.json,
  pem: Language.plaintext,
};

/** The Monaco-backed editor; loaded lazily by `CodeEditorField`. */
export const CodeEditorImpl: React.FC<ICodeEditorFieldProps> = ({
  id,
  label,
  language,
  value,
  downloadName,
  isDisabled,
  onChange,
}) => (
  <CodeEditor
    code={value}
    onCodeChange={onChange}
    language={LANGUAGE[language]}
    isReadOnly={isDisabled}
    isUploadEnabled={!isDisabled}
    isDownloadEnabled
    isCopyEnabled
    isLanguageLabelVisible
    downloadFileName={downloadName}
    height="sizeToFit"
    editorProps={{ wrapperProps: { id: `${id}-editor` } }}
    options={{
      ariaLabel: label,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: language === "pem" ? "on" : "off",
    }}
    emptyStateTitle={`Start editing ${label.toLowerCase()}`}
    emptyStateBody="Drag a file here, upload one, or start typing."
  />
);
