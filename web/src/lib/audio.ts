let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

export function unlockAudio(): void {
  const ctx = getCtx();
  if (ctx.state === "suspended") {
    ctx.resume();
  }
}

export function isAudioUnlocked(): boolean {
  return audioCtx !== null && audioCtx.state === "running";
}

/**
 * Play audio from a local file in /public/sounds/.
 * Falls back to generated sound if file not found.
 * Requires unlockAudio() to have been called first via user interaction.
 */
async function playFile(path: string, volume = 0.6): Promise<boolean> {
  try {
    const audio = new Audio(path);
    audio.volume = volume;
    await audio.play();
    return true;
  } catch {
    return false;
  }
}

/**
 * Plays donation sound.
 * Uses /public/sounds/donation.mp3 if available, else generates a tone.
 */
export async function playDonationSound(): Promise<void> {
  const played = await playFile("/sounds/donation.mp3", 1);
  if (!played) {
    playDonationTone();
  }
}

/**
 * Plays transition whoosh sound.
 * Uses /public/sounds/transition.mp3 if available, else generates a tone.
 */
export async function playTransitionSound(): Promise<void> {
  const played = await playFile("/sounds/transition.mp3", 0.5);
  if (!played) {
    playTransitionTone();
  }
}

// --- Fallback generated sounds via Web Audio API ---

function playDonationTone(): void {
  const ctx = getCtx();
  if (ctx.state !== "running") return;

  const now = ctx.currentTime;
  const notes = [880, 1100, 1320];

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + i * 0.15);

    gain.gain.setValueAtTime(0, now + i * 0.15);
    gain.gain.linearRampToValueAtTime(0.4, now + i * 0.15 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.4);

    osc.start(now + i * 0.15);
    osc.stop(now + i * 0.15 + 0.4);
  });
}

function playTransitionTone(): void {
  const ctx = getCtx();
  if (ctx.state !== "running") return;

  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type = "sine";
  osc.frequency.setValueAtTime(200, now);
  osc.frequency.exponentialRampToValueAtTime(800, now + 0.3);

  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

  osc.start(now);
  osc.stop(now + 0.5);
}
