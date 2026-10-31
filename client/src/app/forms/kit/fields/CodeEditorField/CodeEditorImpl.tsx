import type React from "react";
import { useRef } from "react";

import {
  CodeEditor,
  CodeEditorControl,
  Language,
} from "@patternfly/react-code-editor";
import { UploadIcon } from "@patternfly/react-icons/dist/esm/icons/upload-icon";

import "./monacoSetup";
import type { CodeLanguage } from "../../types";
import type { ICodeEditorFieldProps } from "./CodeEditorField";

const LANGUAGE: Record<CodeLanguage, Language> = {
  yaml: Language.yaml,
  json: Language.json,
  pem: Language.plaintext,
};

const HEIGHT: Record<CodeLanguage, string> = {
  yaml: "240px",
  json: "240px",
  pem: "160px",
};

/** The Monaco-backed editor; loaded lazily by `CodeEditorField`. */
export const CodeEditorImpl: React.FC<ICodeEditorFieldProps> = ({
  label,
  language,
  value,
  downloadName,
  isDisabled,
  onChange,
}) => {
  // The editor's own upload swaps it for a large drop zone while empty, too heavy in a
  // form: a header control opens a hidden file input instead.
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        hidden
        aria-label={`Upload ${label}`}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void file.text().then(onChange);
          event.target.value = "";
        }}
      />
      <CodeEditor
        code={value}
        onCodeChange={onChange}
        language={LANGUAGE[language]}
        isReadOnly={isDisabled}
        isDownloadEnabled
        isCopyEnabled
        isLanguageLabelVisible
        downloadFileName={downloadName}
        height={HEIGHT[language]}
        customControls={
          isDisabled ? undefined : (
            <CodeEditorControl
              icon={<UploadIcon />}
              aria-label={`Upload ${label.toLowerCase()} from a file`}
              tooltipProps={{ content: "Upload from a file" }}
              onClick={() => fileInputRef.current?.click()}
            />
          )
        }
        options={{
          ariaLabel: label,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: language === "pem" ? "on" : "off",
        }}
      />
    </>
  );
};
