import { useState, useEffect, useRef } from "react";
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
  const [currentFrame, setCurrentFrame] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!visible || !current?.audioBase64) return;

    const audio = new Audio(`data:audio/mp3;base64,${current.audioBase64}`);
    audio.volume = 1;
    audioRef.current = audio;

    audio.play().catch(() => {});

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [visible, current?.audioBase64]);
  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev % 3) + 1);
    }, 150);

    return () => clearInterval(interval);
  }, [visible]);

  useEffect(() => {
    if (!donation) return;

    setCurrent(donation);
    setExiting(false);

    // Enter on next frame so CSS transition triggers
    requestAnimationFrame(() => {
      setVisible(true);
    });

    setCurrentFrame(1);

    const delay = donation.audioDurationMs
      ? donation.audioDurationMs + 3000
      : 5000 + donation.message.length * 40;

    const exitTimer = setTimeout(() => {
      setExiting(true);
      setVisible(false);
    }, Math.min(delay, 15000));

    return () => clearTimeout(exitTimer);
  }, [donation]);

  if (!current) return null;

  return (
    <div className={`${styles.alert} ${visible && !exiting ? styles.visible : exiting ? styles.exit : ""}`}>
      <main className={styles.card} id="donation-alert">
        {/* Left Section (Avatar/Icon) */}
        <section className={styles.leftSection}>
          <div className={styles.avatarBox}>
            <img
              className={styles.avatarImage}
              src={`/images/donation${currentFrame}.png`}
              alt="Avatar"
            />
          </div>
        </section>

        {/* Right Section (Content Area) */}
        <section className={styles.rightSection}>
          {/* Top Content: Username & Label */}
          <div className={styles.userInfo}>
            <h2>{current.donatorName}</h2>
          </div>

          <hr className={styles.divider} />

          {/* Middle Content: Donation Amount */}
          <div className={styles.donationInfo}>
            <span className={styles.amountText}>
              Rp {current.amount.toLocaleString("id-ID")}
            </span>
            <span className={styles.amountLabel}>
              Donation Amount
            </span>
          </div>

          <hr className={styles.divider} />

          {/* Bottom Content: Custom Message */}
          <div className={styles.messageArea}>
            <strong>THANK YOU!</strong><br />
            <span className={styles.messageText}>{current.message}</span>
            {/* <span className={styles.cursor}></span> */}
          </div>
        </section>

        {/* Decorative Glow */}
        <div className={styles.glow}></div>
      </main>
    </div>
  );
}
