import type React from "react";

import { CopilotKitProvider } from "@copilotkit/react-core/v2";

import "@patternfly/chatbot/dist/css/main.css";

import type { AssistantDisplayMode } from "@app/layout/assistantDisplayMode";

import { AssistantChat } from "./AssistantChat";
import { usePageContext } from "./context/usePageContext";
import { useAssistantTools } from "./tools";

/** Served by the UI server, on the same origin. */
const RUNTIME_URL = "/copilotkit";

const AssistantTools: React.FC = () => {
  usePageContext();
  useAssistantTools();
  return null;
};

interface IAiAssistantProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  displayMode: AssistantDisplayMode;
  onDisplayModeChange: (mode: AssistantDisplayMode) => void;
  drawerPanel: HTMLElement | null;
}

/** The AI assistant; rendered only when a provider is configured. */
export const AiAssistant: React.FC<IAiAssistantProps> = (chatProps) => (
  <CopilotKitProvider
    runtimeUrl={RUNTIME_URL}
    showIntelligenceIndicator={false}
    // The chat is PatternFly's; CopilotKit's dev inspector would float over the masthead.
    enableInspector={false}
  >
    <AssistantTools />
    <AssistantChat {...chatProps} />
  </CopilotKitProvider>
);
