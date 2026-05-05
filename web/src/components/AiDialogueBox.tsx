import { useEffect, useState, useRef } from "react";
import styles from "./AiDialogueBox.module.css";
import { playDonationSound } from "../lib/audio";

interface AiDialogueData {
  id: number;
  donatorName: string; // Will usually be "AI Respati"
  message: string;
  audioBase64: string | null;
  audioDurationMs: number | null;
  userMessage?: string;
  originalDonatorName?: string;
}

interface AiDialogueBoxProps {
  dialogue: AiDialogueData | null;
}

function calcDisplayDuration(message: string) {
  // Rough estimate: ~130 wpm => ~2 words per sec => ~500ms per word + 3s buffer
  const words = message.split(/\s+/).length;
  return Math.max(words * 500, 3000);
}

export function AiDialogueBox({ dialogue }: AiDialogueBoxProps) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [current, setCurrent] = useState<AiDialogueData | null>(null);
  
  // Phase management: 'user' phase then 'ai' phase
  const [phase, setPhase] = useState<"user" | "ai">("user");

  const switchTimerRef = useRef<Timer | null>(null);
  const fallbackTimerRef = useRef<Timer | null>(null);

  useEffect(() => {
    if (!dialogue) return;

    setCurrent(dialogue);
    setVisible(true);
    setExiting(false);

    // If there's a userMessage, start in 'user' phase, else skip to 'ai'
    if (dialogue.userMessage && dialogue.originalDonatorName) {
      setPhase("user");
    } else {
      setPhase("ai");
    }

    const triggerExit = (delayMs: number = 0) => {
      fallbackTimerRef.current = setTimeout(() => {
        setExiting(true);
        setTimeout(() => {
          setVisible(false);
          setCurrent(null);
        }, 600); // 600ms matches CSS exit animation duration
      }, delayMs);
    };

    if (dialogue.audioBase64) {
      const audio = new Audio(`data:audio/mpeg;base64,${dialogue.audioBase64}`);
      audio.volume = 0.8;
      
      let userDurationMs = 0;
      let aiDurationMs = dialogue.audioDurationMs || calcDisplayDuration(dialogue.message);

      // Calculate proportional duration for user speech if we have both
      if (dialogue.userMessage && dialogue.originalDonatorName) {
        const userWords = dialogue.userMessage.split(/\s+/).length;
        const aiWords = dialogue.message.split(/\s+/).length;
        const totalWords = userWords + aiWords;
        
        // Use provided audio duration or fallback to calculated
        const totalDurationMs = dialogue.audioDurationMs || ((totalWords / 110) * 60 * 1000);
        
        userDurationMs = (userWords / totalWords) * totalDurationMs;
        // add a tiny bit of buffer (200ms) to ensure text switches cleanly
        userDurationMs += 200; 

        switchTimerRef.current = setTimeout(() => {
          setPhase("ai");
        }, userDurationMs);
      }

      audio.onended = () => {
        triggerExit(1000); // 1s buffer after exact audio ends
      };

      audio.play().catch((e) => {
        console.warn("[audio] TTS play failed:", e);
        playDonationSound();
        triggerExit(userDurationMs + aiDurationMs);
      });
    } else {
      playDonationSound();
      const userDurationMs = dialogue.userMessage ? calcDisplayDuration(dialogue.userMessage) : 0;
      const aiDurationMs = calcDisplayDuration(dialogue.message);
      
      if (userDurationMs > 0) {
        switchTimerRef.current = setTimeout(() => {
          setPhase("ai");
        }, userDurationMs);
      }
      
      triggerExit(userDurationMs + aiDurationMs);
    }

    return () => {
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      if (switchTimerRef.current) clearTimeout(switchTimerRef.current);
    };
  }, [dialogue]);

  if (!visible || !current) return null;

  const currentName = phase === "user" && current.originalDonatorName 
    ? current.originalDonatorName 
    : current.donatorName;
    
  const currentText = phase === "user" && current.userMessage 
    ? current.userMessage 
    : current.message;

  return (
    <div className={`${styles.dialogueContainer} ${exiting ? styles.exit : ""}`}>
      {/* Name plate */}
      <div className={styles.namePlate}>
        {currentName.toUpperCase()}
      </div>
      
      {/* Dialogue box */}
      <div className={styles.dialogueBox}>
        {/* We use a key based on phase to re-trigger the CSS animation when text changes */}
        <div key={phase} className={styles.text}>
          {currentText}
        </div>
        <div className={styles.arrowBounce}>▼</div>
      </div>
    </div>
  );
}
