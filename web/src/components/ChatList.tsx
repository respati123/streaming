import { useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import type { ChatMessage as ChatMessageType } from "../lib/types";
import styles from "./ChatList.module.css";

interface Props {
  messages: ChatMessageType[];
}

export function ChatList({ messages }: Props) {

  return (
    <div className={styles.container}>
      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} />
      ))}
    </div>
  );
}
