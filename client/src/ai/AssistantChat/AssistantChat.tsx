/* eslint-disable jsx-a11y/aria-role -- PatternFly's Message takes role="user" | "bot", not an ARIA role */
import type React from "react";
import { useState } from "react";
import { createPortal } from "react-dom";

import {
  useAgent,
  useCopilotKit,
  useRenderToolCall,
} from "@copilotkit/react-core/v2";

import Chatbot, {
  ChatbotDisplayMode,
} from "@patternfly/chatbot/dist/dynamic/Chatbot";
import ChatbotContent from "@patternfly/chatbot/dist/dynamic/ChatbotContent";
import ChatbotFooter, {
  ChatbotFootnote,
} from "@patternfly/chatbot/dist/dynamic/ChatbotFooter";
import ChatbotHeader, {
  ChatbotHeaderActions,
  ChatbotHeaderCloseButton,
  ChatbotHeaderMain,
  ChatbotHeaderOptionsDropdown,
  ChatbotHeaderTitle,
} from "@patternfly/chatbot/dist/dynamic/ChatbotHeader";
import ChatbotToggle from "@patternfly/chatbot/dist/dynamic/ChatbotToggle";
import ChatbotWelcomePrompt from "@patternfly/chatbot/dist/dynamic/ChatbotWelcomePrompt";
import Message from "@patternfly/chatbot/dist/dynamic/Message";
import MessageBar from "@patternfly/chatbot/dist/dynamic/MessageBar";
import MessageBox from "@patternfly/chatbot/dist/dynamic/MessageBox";
import {
  DropdownGroup,
  DropdownItem,
  DropdownList,
} from "@patternfly/react-core";
import ColumnsIcon from "@patternfly/react-icons/dist/esm/icons/columns-icon";
import OpenDrawerRightIcon from "@patternfly/react-icons/dist/esm/icons/open-drawer-right-icon";
import OutlinedWindowRestoreIcon from "@patternfly/react-icons/dist/esm/icons/outlined-window-restore-icon";

import type { AssistantDisplayMode } from "@app/layout/assistantDisplayMode";

import styles from "./AssistantChat.module.css";

const ASSISTANT_NAME = "Pulp assistant";

/** PatternFly's display modes, in its options-menu order. */
const DISPLAY_MODES: {
  mode: AssistantDisplayMode;
  chatbotMode: ChatbotDisplayMode;
  label: string;
  Icon: typeof OutlinedWindowRestoreIcon;
}[] = [
  {
    mode: "default",
    chatbotMode: ChatbotDisplayMode.default,
    label: "Overlay",
    Icon: OutlinedWindowRestoreIcon,
  },
  {
    mode: "docked",
    chatbotMode: ChatbotDisplayMode.docked,
    label: "Dock to window",
    Icon: OpenDrawerRightIcon,
  },
  {
    mode: "drawer",
    chatbotMode: ChatbotDisplayMode.drawer,
    label: "Beside the page",
    Icon: ColumnsIcon,
  },
];

interface IAssistantChatProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  displayMode: AssistantDisplayMode;
  onDisplayModeChange: (mode: AssistantDisplayMode) => void;
  /** Where the chat renders in drawer mode: the layout's drawer panel. */
  drawerPanel: HTMLElement | null;
}

/** The chat window: PatternFly's chatbot, driven by CopilotKit's agent. */
export const AssistantChat: React.FC<IAssistantChatProps> = ({
  isOpen,
  onOpenChange,
  displayMode,
  onDisplayModeChange,
  drawerPanel,
}) => {
  const chatbotMode =
    DISPLAY_MODES.find(({ mode }) => mode === displayMode)?.chatbotMode ??
    ChatbotDisplayMode.default;
  const [hasFailed, setHasFailed] = useState(false);
  const { agent } = useAgent();
  const { copilotkit } = useCopilotKit();
  const renderToolCall = useRenderToolCall();

  const messages = agent.messages;
  const isRunning = agent.isRunning;

  const send = (text: string) => {
    if (!text.trim() || isRunning) {
      return;
    }
    setHasFailed(false);
    agent.addMessage({ id: crypto.randomUUID(), role: "user", content: text });
    copilotkit.runAgent({ agent }).catch(() => setHasFailed(true));
  };

  const lastMessage = messages.at(-1);
  const isThinking = isRunning && lastMessage?.role === "user";

  const chatbot = (
    <Chatbot
      displayMode={chatbotMode}
      isVisible={isOpen}
      ariaLabel={ASSISTANT_NAME}
    >
      <ChatbotHeader>
        <ChatbotHeaderMain>
          <ChatbotHeaderTitle>{ASSISTANT_NAME}</ChatbotHeaderTitle>
        </ChatbotHeaderMain>
        <ChatbotHeaderActions>
          <ChatbotHeaderOptionsDropdown
            menuToggleAriaLabel="Assistant options"
            tooltipProps={{ content: "Assistant options" }}
            onSelect={(_event, value) => {
              const picked = DISPLAY_MODES.find(({ mode }) => mode === value);
              if (picked) {
                onDisplayModeChange(picked.mode);
              }
            }}
          >
            <DropdownGroup label="Display mode">
              <DropdownList>
                {DISPLAY_MODES.map(({ mode, label, Icon }) => (
                  <DropdownItem
                    key={mode}
                    value={mode}
                    icon={<Icon aria-hidden />}
                    isSelected={displayMode === mode}
                  >
                    {label}
                  </DropdownItem>
                ))}
              </DropdownList>
            </DropdownGroup>
          </ChatbotHeaderOptionsDropdown>
          <ChatbotHeaderCloseButton onClick={() => onOpenChange(false)} />
        </ChatbotHeaderActions>
      </ChatbotHeader>
      <ChatbotContent>
        <MessageBox
          announcement={
            lastMessage?.role === "assistant" && !isRunning
              ? `${ASSISTANT_NAME} answered`
              : undefined
          }
        >
          {messages.length === 0 ? (
            <ChatbotWelcomePrompt
              title="Ask about your repositories"
              description="For example: show me the repositories named rpm."
            />
          ) : null}
          {messages.map((message) => {
            if (message.role === "user") {
              return (
                <Message
                  key={message.id}
                  role="user"
                  name="You"
                  isAvatarHidden
                  content={
                    typeof message.content === "string" ? message.content : ""
                  }
                />
              );
            }
            if (message.role !== "assistant") {
              return null;
            }
            const toolCards = (message.toolCalls ?? []).map((toolCall) => (
              <div key={toolCall.id}>
                {renderToolCall({
                  toolCall,
                  toolMessage: messages.find(
                    (other): other is Extract<typeof other, { role: "tool" }> =>
                      other.role === "tool" && other.toolCallId === toolCall.id,
                  ),
                })}
              </div>
            ));
            return (
              <Message
                key={message.id}
                role="bot"
                name={ASSISTANT_NAME}
                isAvatarHidden
                content={message.content ?? ""}
                extraContent={
                  toolCards.length > 0
                    ? { afterMainContent: toolCards }
                    : undefined
                }
              />
            );
          })}
          {isThinking ? (
            <Message
              role="bot"
              name={ASSISTANT_NAME}
              isAvatarHidden
              isLoading
            />
          ) : null}
          {hasFailed ? (
            <Message
              role="bot"
              name={ASSISTANT_NAME}
              isAvatarHidden
              content="Sorry, I couldn't answer. Try again in a moment."
            />
          ) : null}
        </MessageBox>
      </ChatbotContent>
      <ChatbotFooter>
        <MessageBar
          onSendMessage={(text) => send(String(text))}
          placeholder="Ask about your repositories"
          hasAttachButton={false}
          hasStopButton={isRunning}
          handleStopButton={() => copilotkit.stopAgent({ agent })}
        />
        <ChatbotFootnote label="Answers are AI-generated and can be wrong." />
      </ChatbotFooter>
    </Chatbot>
  );

  return (
    <>
      {/* Docked or beside the page, the open chat covers the toggle's corner; its header closes it. */}
      {isOpen && displayMode !== "default" ? null : (
        <ChatbotToggle
          tooltipLabel={ASSISTANT_NAME}
          toggleButtonLabel={`${isOpen ? "Close" : "Open"} the ${ASSISTANT_NAME}`}
          isChatbotVisible={isOpen}
          onToggleChatbot={() => onOpenChange(!isOpen)}
          className={styles.toggle}
        />
      )}
      {/* In drawer mode the chat goes in the layout's inline drawer, beside the page. */}
      {displayMode === "drawer"
        ? drawerPanel && createPortal(chatbot, drawerPanel)
        : chatbot}
    </>
  );
};
