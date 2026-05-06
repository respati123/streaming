import type { ChatMessage as ChatMessageType } from "../lib/types";
import styles from "./ChatMessage.module.css";

interface Props {
  message: ChatMessageType;
}

export function ChatMessage({ message }: Props) {
  const { user, content, publishedAt } = message;

  const timeString = publishedAt
    ? new Date(publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : "";

  const hasBadge = user.badge && user.badge !== "none";

  return (
    <article className={styles.item}>
      <header className={styles.header}>
        {hasBadge && (
          <img
            className={`${styles.badge} ${user.badge === "pokeball" ? styles.badgeWhite : ""}`}
            src={`/images/badges/${user.badge}.png`}
            alt={user.badge}
            title={`${user.badge} — ${user.points ?? 0} pts`}
          />
        )}

        <span
          className={styles.username}
          style={{ color: user.color || 'var(--stitch-accent)' }}
        >
          {user.name}
        </span>

        <span className={styles.timestamp}>{timeString}</span>
      </header>

      <div className={styles.content}>
        {content}
      </div>
    </article>
  );
}
