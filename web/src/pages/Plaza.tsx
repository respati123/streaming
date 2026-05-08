import { useMemo } from "react";
import { ChatMessage as ChatMessageComponent } from "../components/ChatMessage";
import { CanvasArena } from "../components/CanvasArena";
import type { Chatter } from "../components/CanvasArena";
import { useChat } from "../hooks/useChat";
import styles from "./Plaza.module.css";

const MAX_CHATTERS = 5;

export function Plaza() {
  const { messages: chatMessages } = useChat();

  const chatters: Chatter[] = useMemo(() => {
    const seen = new Map<string, Chatter>();
    for (const msg of chatMessages) {
      if (seen.size >= MAX_CHATTERS) break;
      if (!seen.has(msg.user.name)) {
        seen.set(msg.user.name, { name: msg.user.name, badge: msg.user.badge, color: msg.user.color });
      }
    }
    return Array.from(seen.values());
  }, [chatMessages]);

  const latestMessage = chatMessages.length > 0 ? chatMessages[chatMessages.length - 1] : undefined;

  return (
    <div className={styles.plaza}>
      <div className={styles.chatContainer}>
        {chatMessages.map(msg => (
          <ChatMessageComponent key={msg.id} message={msg} />
        ))}
      </div>

      <CanvasArena
        characterId="char_2"
        chatters={chatters}
        latestMessage={latestMessage}
        bounds={{
          minXPercentage: 0.12,
          maxXPercentage: 0.88,
          minYPercentage: 0.28,
          maxYPercentage: 0.88,
          allowedActions: ["Idle", "Walking", "Jumping"],
          scaleMultiplier: 0.4
        }}
        zIndex={10}
      />
    </div>
  );
}
