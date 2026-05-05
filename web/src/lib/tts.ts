/**
 * Text-to-Speech utility using browser's built-in Web Speech API.
 * Free, no API key needed, works in Chrome and OBS Browser Source.
 */

let voices: SpeechSynthesisVoice[] = [];
let voicesLoaded = false;

// Pre-load voices — browsers sometimes load async
function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const available = speechSynthesis.getVoices();
    if (available.length > 0) {
      voices = available;
      voicesLoaded = true;
      resolve(voices);
      return;
    }
    // Voices not ready yet, wait for event
    speechSynthesis.onvoiceschanged = () => {
      voices = speechSynthesis.getVoices();
      voicesLoaded = true;
      resolve(voices);
    };
  });
}

/**
 * Pick the best Indonesian voice available.
 * Falls back to English if no Indonesian voice found.
 */
function pickVoice(): SpeechSynthesisVoice | null {
  // Try Indonesian first
  const idVoice = voices.find(
    (v) => v.lang.startsWith("id") || v.lang.startsWith("in")
  );
  if (idVoice) return idVoice;

  // Fallback to any English voice
  return voices.find((v) => v.lang.startsWith("en")) ?? voices[0] ?? null;
}

interface SpeakOptions {
  rate?: number;   // 0.1 – 10, default 1
  pitch?: number;  // 0 – 2, default 1
  volume?: number; // 0 – 1, default 1
}

/**
 * Speak a text using Web Speech API.
 * Returns estimated duration in ms, or null if speech synthesis unavailable.
 */
export async function speakText(
  text: string,
  options: SpeakOptions = {}
): Promise<number | null> {
  if (!("speechSynthesis" in window)) {
    console.warn("[tts] Web Speech API not supported");
    return null;
  }

  if (!voicesLoaded) {
    await loadVoices();
  }

  // Cancel any currently speaking
  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "id-ID";
  utterance.rate = options.rate ?? 1.05;
  utterance.pitch = options.pitch ?? 1.0;
  utterance.volume = options.volume ?? 0.9;

  const voice = pickVoice();
  if (voice) utterance.voice = voice;

  console.log(`[tts] speaking with voice: ${voice?.name ?? "default"} (${voice?.lang})`);

  return new Promise((resolve) => {
    let startTime = 0;

    utterance.onstart = () => {
      startTime = Date.now();
    };

    utterance.onend = () => {
      const duration = Date.now() - startTime;
      console.log(`[tts] finished in ${duration}ms`);
      resolve(duration);
    };

    utterance.onerror = (e) => {
      console.warn("[tts] speech error:", e.error);
      resolve(null);
    };

    speechSynthesis.speak(utterance);
  });
}

/**
 * Build and speak the donation announcement script.
 * Returns actual spoken duration in ms.
 */
export async function speakDonation(
  donatorName: string,
  amount: number,
  message: string
): Promise<number | null> {
  const formatted = new Intl.NumberFormat("id-ID").format(amount);
  const script = buildDonationScript(donatorName, formatted, message);
  return speakText(script);
}

function buildDonationScript(name: string, amount: string, message: string): string {
  if (message && message.trim()) {
    return `${name} berdonasi Rp ${amount}! ${name} berpesan: ${message}`;
  }
  return `${name} berdonasi Rp ${amount}. Terima kasih ${name}!`;
}

/** List available voices for debugging */
export async function listVoices(): Promise<{ name: string; lang: string }[]> {
  if (!voicesLoaded) await loadVoices();
  return voices.map((v) => ({ name: v.name, lang: v.lang }));
}
