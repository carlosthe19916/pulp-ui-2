// The editor core plus only what the forms edit (YAML, JSON, plain PEM): the full
// `monaco-editor` entry also bundles every language and the TS/CSS/HTML workers.
import "monaco-editor/editor/browser/coreCommands";
import "monaco-editor/editor/contrib/clipboard/browser/clipboard";
import "monaco-editor/editor/contrib/linesOperations/browser/linesOperations";
import "monaco-editor/editor/contrib/wordOperations/browser/wordOperations";
import "monaco-editor/editor/contrib/bracketMatching/browser/bracketMatching";
import "monaco-editor/editor/contrib/folding/browser/folding";
import "monaco-editor/languages/definitions/yaml/register";
import "monaco-editor/languages/features/json/register";
import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor/editor/editor.api";
import EditorWorker from "monaco-editor/editor/editor.worker?worker";
import JsonWorker from "monaco-editor/language/json/json.worker?worker";

// Bundle Monaco and its workers instead of the CDN default, so air-gapped installs work.
self.MonacoEnvironment = {
  getWorker: (_workerId: string, label: string) =>
    label === "json" ? new JsonWorker() : new EditorWorker(),
};

loader.config({ monaco });
