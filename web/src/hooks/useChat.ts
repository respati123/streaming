import { useEffect, useRef, useState, useCallback } from "react";
import type { ChatMessage, WsMessage } from "../lib/types";

interface UseChatOptions {
  maxMessages?: number;
  onTransition?: (name: string) => void;
}

export function useChat({ maxMessages = 50, onTransition }: UseChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    const host = location.hostname === "localhost" ? "localhost:3000" : location.host;
    const ws = new WebSocket(`${protocol}//${host}/ws/chat`);

    ws.onopen = () => {
      console.log("[ws] connected");
    };

    ws.onmessage = (event) => {
      try {
        const data: any = JSON.parse(event.data);
        
        if (data.type === "chat") {
          setMessages((prev) => {
            const isDuplicate = prev.some(
              (m) => m.publishedAt === data.publishedAt && m.content === data.content && m.user.name === data.user.name
            );
            if (isDuplicate) return prev;

            const next = [...prev, { ...data, id: data.id || crypto.randomUUID(), isNew: true }];
            return next.length > maxMessages ? next.slice(-maxMessages) : next;
          });
        } else if (data.type === "transition") {
          if (onTransition) onTransition(data.phase || 'start');
        }
      } catch {}
    };

    ws.onclose = () => {
      console.log("[ws] disconnected");
    };

    ws.onerror = () => ws.close();

    wsRef.current = ws;
    return ws;
  }, [maxMessages]);

  useEffect(() => {
    // Fetch initial history
    fetch("/api/streams/history/recent?limit=" + maxMessages)
      .then(res => res.json())
      .then(data => {
        if (data.messages) {
          setMessages(data.messages.map((m: any) => ({ 
            ...m, 
            id: m.id || `hist-${m.publishedAt}-${m.user.name}`,
            isNew: false 
          })));
        }
      })
      .catch(err => console.error("[history] failed to fetch", err));

    const ws = connect();
    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [connect, maxMessages]);

  return { messages };
}
