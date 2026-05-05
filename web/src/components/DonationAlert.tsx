import { useState, useEffect } from "react";
import { playDonationSound } from "../lib/audio";
import styles from "./DonationAlert.module.css";

interface DonationData {
  id: number;
  donatorName: string;
  amount: number;
  message: string;
  createdAt: string;
  audioBase64: string | null;
  audioDurationMs: number | null;
}

interface Props {
  donation: DonationData | null;
}

export function DonationAlert({ donation }: Props) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [current, setCurrent] = useState<DonationData | null>(null);

  useEffect(() => {
    if (!donation) return;

    setCurrent(donation);
    setVisible(true);
    setExiting(false);

    let fallbackTimer: Timer;

    const triggerExit = (delayMs: number = 0) => {
      fallbackTimer = setTimeout(() => {
        setExiting(true);
        setTimeout(() => {
          setVisible(false);
          setCurrent(null);
        }, 600); // 600ms matches CSS exit animation duration
      }, delayMs);
    };

    // Play TTS audio if available, otherwise fallback to generated tone
    if (donation.audioBase64) {
      const audio = new Audio(`data:audio/mpeg;base64,${donation.audioBase64}`);
      audio.volume = 0.8;

      // Wait for exactly when the audio finishes to start fadeout
      audio.onended = () => {
        triggerExit(1000); // 1s buffer after exact audio ends
      };

      audio.play().catch((e) => {
        console.warn("[audio] TTS play failed, falling back to tone:", e);
        playDonationSound();
        triggerExit(calcDisplayDuration(donation.message));
      });
    } else {
      playDonationSound();
      triggerExit(calcDisplayDuration(donation.message));
    }

    return () => {
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, [donation]);

  if (!visible || !current) return null;

  const formatted = formatRupiah(current.amount);

  return (
    <div className={`${styles.alert} ${exiting ? styles.exit : ""}`}>
      <div className={styles.glow} />
      <div className={styles.content}>
        <div className={styles.icon}>💎</div>
        <div className={styles.info}>
          <div className={styles.header}>
            <span className={styles.name}>{current.donatorName}</span>
            <span className={styles.amount}>{formatted}</span>
          </div>
          {current.message && (
            <div className={styles.message}>{current.message}</div>
          )}
        </div>
      </div>
      <div className={styles.particles}>
        {Array.from({ length: 12 }).map((_, i) => (
          <span
            key={i}
            className={styles.particle}
            style={{
              "--delay": `${Math.random() * 0.5}s`,
              "--x": `${(Math.random() - 0.5) * 200}px`,
              "--y": `${-Math.random() * 300 - 100}px`,
              "--size": `${Math.random() * 6 + 3}px`,
            } as React.CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}

function formatRupiah(amount: number): string {
  return "Rp " + amount.toLocaleString("id-ID");
}

/**
 * Calculate how long the alert should stay visible based on message length.
 * - No message: 4s (base time to read the name + amount)
 * - Short message (< 50 chars): up to 6s
 * - Longer message: scales at ~150ms per character
 * - Max cap: 15s
 */
function calcDisplayDuration(message: string): number {
  const BASE_MS = 4000;
  const MIN_MS = 4000;
  const MAX_MS = 8000;
  const MS_PER_CHAR = 40;

  if (!message) return BASE_MS;

  const duration = BASE_MS + message.length * MS_PER_CHAR;
  return Math.min(Math.max(duration, MIN_MS), MAX_MS);
}

