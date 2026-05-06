import { useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import type { ChatMessage as ChatMessageType } from "../lib/types";
import styles from "./ChatList.module.css";

interface Props {
  messages: ChatMessageType[];
}

export function ChatList({ messages }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <aside className={styles.sidebar} id="chat-sidebar">

      {/* Main Content Area */}
      <main ref={scrollRef} className={styles.scrollArea}>
        {messages.length === 0 ? (
          <div style={{ color: 'var(--text-tertiary)', fontSize: '12px', textAlign: 'center', marginTop: '40px' }}>
            AWAITING TRANSMISSION...
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))
        )}
      </main>
    </aside>
  );
}
