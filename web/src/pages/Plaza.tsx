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

      {/* 2D Canvas Engine restricted to the pavement area of the park */}
      <CanvasArena 
        spawnCount={5} 
        bounds={{ minYPercentage: 0.45, maxYPercentage: 0.95 }} 
      />
    </div>
  );
}
