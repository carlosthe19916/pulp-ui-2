import type React from "react";
import { useEffect, useRef } from "react";

import "@xterm/xterm/css/xterm.css";
import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";

import { useSelectedDomain } from "@app/hooks/useSelectedDomain";

import { complete, runCommand } from "./commands";
import { useCommandContext } from "./useCommandContext";
import styles from "./WebTerminal.module.css";

const WELCOME = [
  "\x1b[1mPulp command line\x1b[0m (read-only)",
  "Its commands come from this server's API, so every installed plugin works.",
  "Try: pulp --help, pulp rpm repository list, pulp task list --state failed. Tab completes.",
  "",
].join("\r\n");

/** A pulp-cli-like terminal reading this Pulp as the signed-in user. */
export const WebTerminal: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const context = useCommandContext();
  const { name: domainName } = useSelectedDomain();
  // xterm's callbacks outlive renders; they read the latest values through refs.
  const contextRef = useRef(context);
  contextRef.current = context;
  const promptRef = useRef("");
  promptRef.current = `\x1b[1;32mpulp\x1b[0m:\x1b[1;34m${domainName}\x1b[0m$ `;

  useEffect(() => {
    if (!containerRef.current) return;
    const mono = getComputedStyle(document.documentElement)
      .getPropertyValue("--pf-t--global--font--family--mono")
      .trim();
    const terminal = new Terminal({
      convertEol: true,
      cursorBlink: false,
      fontFamily: mono || "monospace",
      fontSize: 16,
    });
    const fit = new FitAddon();
    terminal.loadAddon(fit);
    terminal.open(containerRef.current);
    fit.fit();
    const resize = new ResizeObserver(() => fit.fit());
    resize.observe(containerRef.current);

    let line = "";
    let busy = false;
    const history: string[] = [];
    let historyIndex = 0;
    const prompt = () => terminal.write(`\r\n${promptRef.current}`);
    const replaceLine = (next: string) => {
      terminal.write(`\r\x1b[2K${promptRef.current}${next}`);
      line = next;
    };

    terminal.write(WELCOME);
    terminal.write(promptRef.current);
    terminal.focus();

    const onData = terminal.onData(async (data) => {
      if (busy) return;
      if (data === "\r") {
        const command = line.trim();
        line = "";
        terminal.write("\r\n");
        if (!command) return terminal.write(promptRef.current);
        history.push(command);
        historyIndex = history.length;
        if (command === "clear") {
          terminal.clear();
          return terminal.write(`\r\x1b[2K${promptRef.current}`);
        }
        busy = true;
        terminal.write("\x1b[2m…\x1b[0m");
        const output = await runCommand(command, contextRef.current);
        terminal.write(`\r\x1b[2K${output}`);
        busy = false;
        return prompt();
      }
      if (data === "\x7f") {
        if (line) {
          line = line.slice(0, -1);
          terminal.write("\b \b");
        }
        return;
      }
      if (data === "\t") {
        const options = await complete(line, contextRef.current);
        if (options.length === 1) {
          const typed = line.endsWith(" ")
            ? ""
            : (line.split(/\s+/).pop() ?? "");
          replaceLine(
            `${line.slice(0, line.length - typed.length)}${options[0]} `,
          );
        } else if (options.length > 1) {
          terminal.write(`\r\n${options.join("  ")}`);
          prompt();
          terminal.write(line);
        }
        return;
      }
      if (data === "\x1b[A" || data === "\x1b[B") {
        historyIndex = Math.max(
          0,
          Math.min(history.length, historyIndex + (data === "\x1b[A" ? -1 : 1)),
        );
        return replaceLine(history[historyIndex] ?? "");
      }
      if (data === "\x03") {
        line = "";
        terminal.write("^C");
        return prompt();
      }
      if (data === "\x0c") {
        terminal.clear();
        return replaceLine(line);
      }
      // Other keys (left/right arrows…) send escape sequences; they are ignored.
      if (data.startsWith("\x1b")) return;
      // Typed or pasted text, without control characters such as pasted newlines.
      const text = [...data]
        .filter((char) => char >= " " && char !== "\x7f")
        .join("");
      line += text;
      terminal.write(text);
    });

    return () => {
      onData.dispose();
      resize.disconnect();
      terminal.dispose();
    };
  }, []);

  return <div ref={containerRef} className={styles.terminal} />;
};
