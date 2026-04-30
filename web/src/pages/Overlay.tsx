import { useRef } from "react";
import { ChatList } from "../components/ChatList";
import { TransitionOverlay, useTransition } from "../components/TransitionOverlay";
import { useChat } from "../hooks/useChat";
import styles from "./Overlay.module.css";

export function Overlay() {
  const { phase, setPhase, startCover, startReveal } = useTransition();
  const safetyTimeoutRef = useRef<Timer | null>(null);

  const { messages } = useChat({ 
    maxMessages: 25,
    onTransition: (type) => {
      console.log("[transition] signal received:", type);
      if (type === 'start') {
        startCover();
        // Safety timeout: auto-reveal after 5s if OBS doesn't respond
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
    }
  });

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
    </div>
  );
}
