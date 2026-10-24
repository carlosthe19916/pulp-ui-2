import type React from "react";
import { useId, useState } from "react";

import {
  ClipboardCopy,
  ClipboardCopyButton,
  CodeBlock,
  CodeBlockAction,
  CodeBlockCode,
} from "@patternfly/react-core";

interface ICopyableCodeBlockProps {
  code: string;
}

const CopyableCodeBlock: React.FC<ICopyableCodeBlockProps> = ({ code }) => {
  const id = useId();
  const [copied, setCopied] = useState(false);
  return (
    <CodeBlock
      actions={
        <CodeBlockAction>
          <ClipboardCopyButton
            id={`${id}-copy`}
            aria-label="Copy to clipboard"
            variant="plain"
            onClick={() => {
              navigator.clipboard?.writeText(code).then(
                () => setCopied(true),
                () => undefined,
              );
            }}
            onTooltipHidden={() => setCopied(false)}
          >
            {copied ? "Copied" : "Copy"}
          </ClipboardCopyButton>
        </CodeBlockAction>
      }
    >
      <CodeBlockCode>{code}</CodeBlockCode>
    </CodeBlock>
  );
};

interface ISnippetProps {
  code: string;
}

/** Copyable command or config: an inline copy field, or a code block when multi-line. */
export const Snippet: React.FC<ISnippetProps> = ({ code }) =>
  code.includes("\n") ? (
    <CopyableCodeBlock code={code} />
  ) : (
    <ClipboardCopy isReadOnly isCode hoverTip="Copy" clickTip="Copied">
      {code}
    </ClipboardCopy>
  );
