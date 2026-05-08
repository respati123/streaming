import { useEffect, useRef } from 'react';
import { SpriteEngine } from '../lib/SpriteEngine';
import type { EngineConfig } from '../lib/SpriteEngine';

interface CanvasArenaProps {
  triggerAttack?: number;
  bounds?: EngineConfig;
  spawnCount?: number;
  zIndex?: number;
  characterId?: string;
}

export function CanvasArena({ triggerAttack, bounds, spawnCount = 1, zIndex = -1, characterId = "char_1" }: CanvasArenaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SpriteEngine | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new SpriteEngine(canvasRef.current, bounds);
    engineRef.current = engine;

    const basePath = `/images/characters/${characterId}`;
    const prefix = `${characterId}_`;

    engine.loadAssets(basePath, prefix).then(() => {
      engine.spawnInitial(spawnCount);
      engine.start();
    }).catch(err => {
      console.error("[CanvasArena] Failed to load assets:", err);
    });

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [characterId]);

  useEffect(() => {
    if (triggerAttack && engineRef.current) {
      engineRef.current.triggerGlobalAttack();
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
        pointerEvents: 'none',
        zIndex: zIndex,
        imageRendering: 'pixelated',
      }}
    />
  );
}
