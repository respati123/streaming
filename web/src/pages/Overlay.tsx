import { useRef, useState, useEffect } from "react";
import { ChatList } from "../components/ChatList";
import { TransitionOverlay, useTransition } from "../components/TransitionOverlay";
import { DonationAlert } from "../components/DonationAlert";
import { AiDialogueBox } from "../components/AiDialogueBox";
import { WebcamFrame } from "../components/WebcamFrame";
import { CanvasArena } from "../components/CanvasArena";
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

  const [lastDonationId, setLastDonationId] = useState<number>(0);

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
        setLastDonationId(data.id);
      }
    }
  });

  useEffect(() => {
    unlockAudio();

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
      <div className={styles.chatContainer}>
        <ChatList messages={messages} />
      </div>

      <WebcamFrame />

      <TransitionOverlay phase={phase} onPhaseComplete={setPhase} />

      <DonationAlert donation={donation} />
      <AiDialogueBox dialogue={aiReply} />
      
      {/* 2D Canvas Engine for 100+ Characters */}
      <CanvasArena triggerAttack={lastDonationId} />
    </div>
  );
}
