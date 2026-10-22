import type React from "react";
import { useId, useState } from "react";

import {
  ClipboardCopy,
  ClipboardCopyButton,
  CodeBlock,
  CodeBlockAction,
  CodeBlockCode,
} from "@patternfly/react-core";

const CopyableCodeBlock: React.FC<{ code: string }> = ({ code }) => {
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

/** Copyable command or config: an inline copy field, or a code block when multi-line. */
export const Snippet: React.FC<{ code: string }> = ({ code }) =>
  code.includes("\n") ? (
    <CopyableCodeBlock code={code} />
  ) : (
    <ClipboardCopy isReadOnly isCode hoverTip="Copy" clickTip="Copied">
      {code}
    </ClipboardCopy>
  );
