import React from "react";

import { Check, Copy } from "lucide-react";

interface ITerminalProps {
  command: string;
  comment?: string;
}

export default function Terminal({
  command,
  comment,
}: ITerminalProps): React.ReactElement {
  const [program, ...args] = command.split(" ");
  const rest = ` ${args.join(" ")}`;
  const [copied, setCopied] = React.useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      data-testid="home-terminal"
      className="overflow-hidden rounded-xl border border-gray-80 bg-gray-95 shadow-[0_24px_64px_-24px_rgba(0,0,0,0.45)] dark:border-gray-70 dark:bg-gray-90"
    >
      <div className="flex items-center justify-between border-b border-gray-80 px-4 dark:border-gray-70 py-2.5">
        <div aria-hidden className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-gray-70" />
          <span className="h-2.5 w-2.5 rounded-full bg-gray-70" />
          <span className="h-2.5 w-2.5 rounded-full bg-gray-70" />
        </div>
        <span className="font-mono text-xs text-gray-40">Terminal</span>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Copied" : "Copy command"}
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-gray-40 transition-colors hover:bg-gray-80 hover:text-white"
        >
          {copied ? <Check size={15} /> : <Copy size={15} />}
        </button>
      </div>
      <pre className="m-0 overflow-x-auto rounded-none border-0 bg-transparent p-6 font-mono text-sm leading-7 text-gray-20">
        <code className="border-0 bg-transparent p-0 text-inherit">
          <span className="text-gray-50 select-none">$ </span>
          <span className="text-brand-30">{program}</span>
          {rest}
          {comment && (
            <>
              {"\n\n"}
              <span className="text-gray-40"># {comment}</span>
            </>
          )}
        </code>
      </pre>
    </div>
  );
}
