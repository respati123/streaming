import { useEffect, useRef } from 'react';
import { SpriteEngine } from '../lib/SpriteEngine';
import type { EngineConfig } from '../lib/SpriteEngine';
import type { ChatMessage } from '../lib/types';

export interface Chatter {
  name: string;
  badge: string;
  color: string;
}

interface CanvasArenaProps {
  bounds?: EngineConfig;
  zIndex?: number;
  characterId?: string;
  chatters?: Chatter[];
  latestMessage?: ChatMessage;
}

export function CanvasArena({ bounds, zIndex = -1, characterId = "char_1", chatters, latestMessage }: CanvasArenaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SpriteEngine | null>(null);
  const readyRef = useRef(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    readyRef.current = false;

    const engine = new SpriteEngine(canvasRef.current, bounds);
    engineRef.current = engine;

    engine.loadAssets(`/images/characters/${characterId}`, `${characterId}_`).then(() => {
      readyRef.current = true;

      if (chatters && chatters.length > 0) {
        chatters.forEach(c => engine.spawnForUser(c.name, c.badge, c.color));
      }

      engine.start();
    });

    return () => {
      engine.destroy();
      engineRef.current = null;
      readyRef.current = false;
    };
  }, [characterId]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !readyRef.current || !chatters) return;

    const currentUsers = new Set(engine.getEntities().map(e => e.username).filter(Boolean) as string[]);
    const chatterNames = new Set(chatters.map(c => c.name));

    currentUsers.forEach(name => {
      if (!chatterNames.has(name)) engine.removeUser(name);
    });

    chatters.forEach(c => {
      if (!currentUsers.has(c.name)) engine.spawnForUser(c.name, c.badge, c.color);
    });
  }, [chatters]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine || !readyRef.current || !latestMessage?.isNew) return;
    engine.showChat(latestMessage.user.name, latestMessage.content);
  }, [latestMessage]);

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
        zIndex,
        imageRendering: 'pixelated',
      }}
    />
  );
}
