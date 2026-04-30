import { useEffect, useState } from "react";
import type { ApiStream } from "../lib/types";
import styles from "./StreamStatus.module.css";

export function StreamStatus() {
  const [status, setStatus] = useState<"connected" | "disconnected">("disconnected");
  const [stream, setStream] = useState<ApiStream | null>(null);

  useEffect(() => {
    fetch("/api/streamerbot/status")
      .then((r) => r.json())
      .then((d) => setStatus(d.connected ? "connected" : "disconnected"))
      .catch(() => setStatus("disconnected"));

    fetch("/api/streams/current")
      .then((r) => r.json())
      .then((d) => d.stream && setStream(d.stream))
      .catch(() => {});

    const interval = setInterval(() => {
      fetch("/api/streamerbot/status")
        .then((r) => r.json())
        .then((d) => setStatus(d.connected ? "connected" : "disconnected"))
        .catch(() => {});
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.status}>
        <div
          className={`${styles.dot} ${status === "connected" ? styles.on : styles.off}`}
        />
        <span>StreamerBot {status}</span>
      </div>
      {stream && (
        <div className={styles.stream}>
          <span className={styles.live}>LIVE</span>
          <span className={styles.title}>{stream.title}</span>
        </div>
      )}
    </div>
  );
}
