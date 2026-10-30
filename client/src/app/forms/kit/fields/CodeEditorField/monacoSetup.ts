import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import EditorWorker from "monaco-editor/editor/editor.worker?worker";
import JsonWorker from "monaco-editor/language/json/json.worker?worker";

// Bundle Monaco and its workers instead of the CDN default, so air-gapped installs work.
self.MonacoEnvironment = {
  getWorker: (_workerId: string, label: string) =>
    label === "json" ? new JsonWorker() : new EditorWorker(),
};

loader.config({ monaco });
