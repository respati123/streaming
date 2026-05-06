import { useEffect, useRef, useState, useCallback } from "react";
import type { ChatMessage, WsMessage } from "../lib/types";

interface UseChatOptions {
  maxMessages?: number;
  onTransition?: (phase: string) => void;
  onDonation?: (donation: {
    id: number;
    donatorName: string;
    amount: number;
    message: string;
    createdAt: string;
    audioBase64: string | null;
    audioDurationMs: number | null;
    isAiReply?: boolean;
    userMessage?: string;
    originalDonatorName?: string;
  }) => void;
}

export function useChat({ maxMessages = 50, onTransition, onDonation }: UseChatOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  
  // Use refs to store the latest callbacks without triggering re-renders
  const onTransitionRef = useRef(onTransition);
  const onDonationRef = useRef(onDonation);

  useEffect(() => {
    onTransitionRef.current = onTransition;
    onDonationRef.current = onDonation;
  }, [onTransition, onDonation]);

  const connect = useCallback(() => {
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${location.host}/ws/chat`);

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
          if (onTransitionRef.current) onTransitionRef.current(data.phase || 'start');
        } else if (data.type === "donation") {
          if (onDonationRef.current) onDonationRef.current(data);
        }
      } catch {}
    };

    ws.onclose = () => {
      console.log("[ws] disconnected, reconnecting in 3s...");
      wsRef.current = null;
      setTimeout(connect, 3000);
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
