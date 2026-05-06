import { useEffect, useState, useRef } from "react";
import { unlockAudio } from "../lib/audio";
import styles from "./AiDialogueBox.module.css";

interface AiDialogueData {
  id: number;
  donatorName: string;
  message: string;
  audioBase64: string | null;
  audioDurationMs: number | null;
  userMessage?: string;
  originalDonatorName?: string;
}

interface AiDialogueBoxProps {
  dialogue: AiDialogueData | null;
}

export function AiDialogueBox({ dialogue }: AiDialogueBoxProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [current, setCurrent] = useState<AiDialogueData | null>(null);
  const [phase, setPhase] = useState<"user" | "ai">("ai");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!visible || !current?.audioBase64) return;

    unlockAudio();
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
    if (!dialogue) return;

    setCurrent(dialogue);
    setExiting(false);

    const hasUserMsg = dialogue.userMessage && dialogue.originalDonatorName;

    // Enter on next frame so CSS transition triggers
    requestAnimationFrame(() => {
      setVisible(true);

      if (hasUserMsg) {
        setPhase("user");
      } else {
        setPhase("ai");
      }
    });

    const timers: Timer[] = [];

    // Switch from user phase to AI phase after delay
    if (hasUserMsg) {
      timers.push(setTimeout(() => {
        setPhase("ai");
      }, 3000));
    }

    // Auto-exit
    const aiDelay = hasUserMsg ? 6000 : 3000;
    const exitDelay = current?.audioDurationMs
      ? aiDelay + current.audioDurationMs
      : aiDelay;

    timers.push(setTimeout(() => {
      setExiting(true);
      setVisible(false);
    }, exitDelay));

    return () => timers.forEach(clearTimeout);
  }, [dialogue]);

  if (!current) return null;

  const currentName = phase === "user" && current.originalDonatorName
    ? current.originalDonatorName
    : current.donatorName;

  const currentText = phase === "user" && current.userMessage
    ? current.userMessage
    : current.message;

  return (
    <div className={`${styles.overlay} ${visible && !exiting ? styles.visible : exiting ? styles.exit : ""}`}>
        <div className={styles.container}>

          {/* NPC Name Tag */}
          <div className={styles.nameTagContainer}>
            <div className={styles.nameTag}>
              <span className={styles.tagLabel}>NAME TAG</span>
              <span>{currentName.toUpperCase()}</span>
            </div>
          </div>

          {/* Main Dialogue Box */}
          <div className={styles.dialogueBox}>
            <div className={styles.innerBorder}>
              <div className={styles.content}>

                {/* Character Avatar Area */}
                <div className={styles.avatarArea}>
                  <div className={styles.avatarBox}>
                    <div className={styles.avatarOverlay} />
                    <div className={styles.crossPattern}>
                      <div className={`${styles.crossLine} ${styles.crossLine1}`} />
                      <div className={`${styles.crossLine} ${styles.crossLine2}`} />
                    </div>
                    <img
                      src="/images/donation1.png"
                      alt="Avatar"
                      className={styles.avatarImage}
                    />
                  </div>
                </div>

                {/* Dialogue Text Block */}
                <div className={styles.textBlock}>
                  <div>
                    <span className={styles.messageLabel}>MESSAGE:</span>
                    <p className={styles.messageText}>
                      {currentText}
                      <span className={styles.cursor} />
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
  );
}