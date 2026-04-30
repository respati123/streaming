import { useState, useEffect } from 'react';
import styles from './TransitionOverlay.module.css';

interface Props {
  phase?: 'idle' | 'covering' | 'covered' | 'revealing';
  onPhaseComplete?: (phase: string) => void;
}

export function TransitionOverlay({ phase = 'idle', onPhaseComplete }: Props) {
  // We use the phase prop directly to determine classes
  useEffect(() => {
    if (phase === 'covering') {
      const timer = setTimeout(() => onPhaseComplete?.('covered'), 500);
      return () => clearTimeout(timer);
    }
    if (phase === 'revealing') {
      const timer = setTimeout(() => onPhaseComplete?.('idle'), 500);
      return () => clearTimeout(timer);
    }
  }, [phase, onPhaseComplete]);

  const stateClass = styles[phase] || '';

  return (
    <div className={`${styles.overlay} ${stateClass}`}>
      <div className={`${styles.panel} ${styles.panel1}`} />
      <div className={`${styles.panel} ${styles.panel2}`} />
      <div className={`${styles.panel} ${styles.panel3}`}>
        <div className={styles.logo}>LIVE</div>
      </div>
    </div>
  );
}

// Custom hook to trigger transition from anywhere
export function useTransition() {
  const [phase, setPhase] = useState<'idle' | 'covering' | 'covered' | 'revealing'>('idle');
  
  const startCover = () => setPhase('covering');
  const startReveal = () => setPhase('revealing');
  const reset = () => setPhase('idle');
  
  return { phase, setPhase, startCover, startReveal, reset };
}
