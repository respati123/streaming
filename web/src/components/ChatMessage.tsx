import type { ChatMessage as ChatMessageType } from "../lib/types";
import { BADGE_EMOJI } from "../lib/types";
import styles from "./ChatMessage.module.css";

interface Props {
  message: ChatMessageType;
}

export function ChatMessage({ message }: Props) {
  const { user, content, publishedAt } = message;

  // Format the time if available (e.g., "08:20")
  const timeString = publishedAt
    ? new Date(publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : "";

  // The Twitch widget design uses text for badges (e.g., "MODERATOR", "VIP")
  const badgeText = user.badge ? user.badge.toUpperCase() : "";

  return (
    <div
      className={`${styles.messageWrapper} ${message.isNew ? styles.animate : ""}`}
      style={{ "--user-color": user.color || "#ca8a04" } as React.CSSProperties}
    >
      {/* Avatar Section */}
      <div className={styles.avatarContainer}>
        {user.profileImageUrl ? (
          <img
            className={styles.avatar}
            src={user.profileImageUrl}
            alt={user.name}
          />
        ) : (
          <span className={styles.avatarInitial}>{user.name.charAt(0)}</span>
        )}
      </div>

      {/* Content Section */}
      <div className={styles.contentContainer}>
        {/* Header Row */}
        <div className={styles.headerRow}>
          <span className={styles.username}>{user.name}</span>
          {badgeText && <span className={styles.badge}>{badgeText}</span>}
          {timeString && <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px", fontWeight: 600 }}>{timeString}</span>}
        </div>

        {/* Message Row */}
        <div className={styles.messageText}>{content}</div>
      </div>
    </div>
  );
}
