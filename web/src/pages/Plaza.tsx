import { useMemo } from "react";
import { ChatMessage as ChatMessageComponent } from "../components/ChatMessage";
import { CanvasArena } from "../components/CanvasArena";
import { useChat } from "../hooks/useChat";
import styles from "./Plaza.module.css";

export function Plaza() {
  const { messages: chatMessages } = useChat();

  return (
    <div className={styles.plaza}>
      <div className={styles.chatContainer}>
        {chatMessages.map(msg => (
          <ChatMessageComponent key={msg.id} message={msg} />
        ))}
      </div>

      <CanvasArena
        characterId="char_2"
        spawnCount={5}
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
