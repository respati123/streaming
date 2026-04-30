import { useEffect, useState } from "react";
import { ChatList } from "../components/ChatList";
import { Leaderboard } from "../components/Leaderboard";
import { StreamStatus } from "../components/StreamStatus";
import { useChat } from "../hooks/useChat";
import { StreamerbotActions } from "../components/StreamerbotActions";
import type { ApiUser, ApiStream } from "../lib/types";
import styles from "./Dashboard.module.css";

export function Dashboard() {
  const { messages } = useChat({ maxMessages: 50 });
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [streams, setStreams] = useState<ApiStream[]>([]);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => setUsers(d.users))
      .catch(() => {});

    fetch("/api/streams")
      .then((r) => r.json())
      .then((d) => setStreams(d.streams))
      .catch(() => {});

    const interval = setInterval(() => {
      fetch("/api/users")
        .then((r) => r.json())
        .then((d) => setUsers(d.users))
        .catch(() => {});
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <h1 className={styles.logo}>Streaming Dashboard</h1>
        <StreamStatus />
      </header>

      <div className={styles.grid}>
        <section className={styles.chat}>
          <h2 className={styles.sectionTitle}>Live Chat</h2>
          <div className={styles.chatBox}>
            <ChatList messages={messages} />
          </div>
        </section>

        <aside className={styles.sidebar}>
          <Leaderboard users={users} />
          
          <StreamerbotActions />

          <div className={styles.history}>
            <h3 className={styles.sectionTitle}>Stream History</h3>
            {streams.map((s) => (
              <div key={s.id} className={styles.streamRow}>
                <span className={styles.streamStatus}>{s.status}</span>
                <span className={styles.streamTitle}>{s.title}</span>
                <span className={styles.streamMsgs}>{s._count.messages} msgs</span>
              </div>
            ))}
            {streams.length === 0 && (
              <div className={styles.empty}>No streams yet</div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
