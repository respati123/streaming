import { useRef, useState, useEffect } from "react";
import { ChatList } from "../components/ChatList";
import { TransitionOverlay, useTransition } from "../components/TransitionOverlay";
import { DonationAlert } from "../components/DonationAlert";
import { AiDialogueBox } from "../components/AiDialogueBox";
import { useChat } from "../hooks/useChat";
import { unlockAudio } from "../lib/audio";
import styles from "./Overlay.module.css";

export function Overlay() {
  const { phase, setPhase, startCover, startReveal } = useTransition();
  const safetyTimeoutRef = useRef<Timer | null>(null);
  const [donation, setDonation] = useState<{
    id: number;
    donatorName: string;
    amount: number;
    message: string;
    createdAt: string;
    audioBase64: string | null;
    audioDurationMs: number | null;
  } | null>(null);

  const [aiReply, setAiReply] = useState<{
    id: number;
    donatorName: string;
    message: string;
    audioBase64: string | null;
    audioDurationMs: number | null;
    userMessage?: string;
    originalDonatorName?: string;
  } | null>(null);

  const { messages } = useChat({
    maxMessages: 25,
    onTransition: (type) => {
      console.log("[transition] signal received:", type);
      if (type === 'start') {
        startCover();
        if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
        safetyTimeoutRef.current = setTimeout(() => {
          console.log("[transition] safety timeout triggered");
          startReveal();
        }, 5000);
      }
      if (type === 'end') {
        console.log("[transition] reveal signal received from OBS");
        if (safetyTimeoutRef.current) clearTimeout(safetyTimeoutRef.current);
        startReveal();
      }
    },
    onDonation: (data) => {
      console.log("[donation/ai] received:", data);
      if (data.isAiReply) {
        setAiReply(data);
      } else {
        setDonation(data);
      }
    }
  });

  useEffect(() => {
    // Attempt to automatically unlock audio on mount (works in OBS)
    unlockAudio();

    // Fallback: if testing in regular browser (Chrome/Safari), 
    // it requires at least one click anywhere on the page to allow audio playback.
    const handleFirstInteraction = () => {
      unlockAudio();
      window.removeEventListener('click', handleFirstInteraction);
      console.log("[audio] Audio unlocked via invisible click");
    };
    window.addEventListener('click', handleFirstInteraction);

    return () => window.removeEventListener('click', handleFirstInteraction);
  }, []);

  return (
    <div className={styles.overlay}>
      {/* All-in-One Container for Chat */}
      <div className={styles.chatContainer}>
        <ChatList messages={messages} />
      </div>

      {/* Test Button (Hidden in production OBS) */}
      <button
        onClick={startCover}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 10000,
          background: 'rgba(202, 138, 4, 0.8)',
          border: 'none',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Cover Screen
      </button>

      <button
        onClick={startReveal}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 150,
          zIndex: 10000,
          background: 'rgba(255, 255, 255, 0.2)',
          border: 'none',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Reveal Screen
      </button>

      <TransitionOverlay phase={phase} onPhaseComplete={setPhase} />

      <DonationAlert donation={donation} />
      <AiDialogueBox dialogue={aiReply} />
    </div>
  );
}
