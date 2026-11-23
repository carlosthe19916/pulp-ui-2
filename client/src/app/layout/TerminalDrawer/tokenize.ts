/** Shell-like words: spaces separate, single or double quotes group. */
export const tokenize = (line: string): string[] =>
  [...line.matchAll(/"([^"]*)"|'([^']*)'|(\S+)/g)].map(
    (match) => match[1] ?? match[2] ?? match[3] ?? "",
  );

export interface IParsedArgs {
  words: string[];
  flags: Record<string, string>;
  help: boolean;
}

/** Positional words, `--flag value` / `--flag=value` options, and `--help`. */
export const parseArgs = (tokens: string[]): IParsedArgs => {
  const words: string[] = [];
  const flags: Record<string, string> = {};
  let help = false;
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index] as string;
    if (token === "--help" || token === "-h") {
      help = true;
    } else if (token.startsWith("--")) {
      const [name, inline] = token.slice(2).split(/=(.*)/s, 2) as [
        string,
        string?,
      ];
      if (inline !== undefined) {
        flags[name] = inline;
      } else {
        flags[name] = tokens[index + 1] ?? "";
        index += 1;
      }
    } else {
      words.push(token);
    }
  }
  return { words, flags, help };
};
