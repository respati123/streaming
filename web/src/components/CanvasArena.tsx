import React, { useEffect, useRef } from 'react';
import { SpriteEngine, EngineConfig } from '../lib/SpriteEngine';

interface CanvasArenaProps {
  triggerAttack?: number;
  bounds?: EngineConfig;
  spawnCount?: number;
}

export function CanvasArena({ triggerAttack, bounds, spawnCount = 1 }: CanvasArenaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SpriteEngine | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new SpriteEngine(canvasRef.current, bounds);
    engineRef.current = engine;

    // Load assets and start
    engine.loadAssets().then(() => {
      engine.spawnInitial(spawnCount);
      engine.start();
    }).catch(err => {
      console.error("[CanvasArena] Failed to load assets:", err);
    });

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Handle attack triggers
  useEffect(() => {
    if (triggerAttack && engineRef.current) {
      engineRef.current.triggerGlobalAttack();
      // Optional: spawn a new character on every donation!
      // engineRef.current.spawn(); 
    }
  }, [triggerAttack]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none', // Let clicks pass through
        zIndex: -1 // Put it behind all other UI elements
      }}
    />
  );
}
