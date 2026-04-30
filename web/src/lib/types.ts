export interface ChatUser {
  name: string;
  color: string;
  badge: string;
  points: number;
  profileImageUrl: string | null;
}

export interface ChatMessage {
  type: "chat";
  id?: string | number;
  user: ChatUser;
  content: string;
  publishedAt: string;
  isNew?: boolean;
}

export interface ConnectedMessage {
  type: "connected";
  message: string;
}

export type WsMessage = ChatMessage | ConnectedMessage;

export interface ApiUser {
  id: number;
  youtubeId: string;
  name: string;
  profileImageUrl: string | null;
  points: number;
  lastSeen: string;
  createdAt: string;
  _count: { messages: number };
}

export interface ApiStream {
  id: number;
  youtubeVideoId: string;
  title: string;
  description: string | null;
  status: string;
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
  _count: { messages: number };
}

export const BADGE_EMOJI: Record<string, string> = {
  crown: "👑",
  shield: "🛡️",
  star: "⭐",
  heart: "❤️",
  thumbsup: "👍",
  eye: "👁️",
};
