// =============================================================================
// speech.ts — Web Speech API wrapper for character narration
// =============================================================================

/** Theme identifier type (mirrors ../data/models.ts) */
export type ThemeId = 'space' | 'cleanup' | 'zoo';

/** A single speech line with optional prosody overrides */
export interface SpeechLine {
  text: string;
  pitch?: number;  // 0–2, default 1.2
  rate?: number;   // 0.1–10, default 1.0
}

// ---------------------------------------------------------------------------
// Speech data per theme and trigger point
// ---------------------------------------------------------------------------

const speechData: Record<ThemeId, Record<string, SpeechLine>> = {
  space: {
    start:    { text: '3、2、1…発射！うちゅうミッション、スタート！', pitch: 1.3, rate: 1.1 },
    half:     { text: '折り返し地点通過！その調子だ、パイロット！', pitch: 1.2 },
    threeMin: { text: 'まもなく大気圏突入！ラストスパートだ！', pitch: 1.3, rate: 1.1 },
    complete: { text: '着陸成功！ミッションクリア！すごいぞ！', pitch: 1.4, rate: 1.0 },
    timeUp:   { text: 'ミッション終了！よくがんばったね！', pitch: 1.1, rate: 0.9 },
  },
  cleanup: {
    start:    { text: 'おかたづけ、スタート！きれいにしよう！', pitch: 1.4, rate: 1.0 },
    half:     { text: '半分できたよ！すごい、きれいになってきた！', pitch: 1.3 },
    threeMin: { text: 'あとすこし！ラストスパートだよ！', pitch: 1.3, rate: 1.1 },
    complete: { text: 'ピッカピカ！おかたづけかんりょう！', pitch: 1.5, rate: 1.0 },
    timeUp:   { text: 'おしまい！がんばっておかたづけしたね！', pitch: 1.2, rate: 0.9 },
  },
  zoo: {
    start:    { text: 'どうぶつえん探検、しゅっぱーつ！', pitch: 1.4, rate: 1.0 },
    half:     { text: '折り返し！どうぶつたちが待ってるよ！', pitch: 1.3 },
    threeMin: { text: 'もうすぐゴール！あとすこしだ！', pitch: 1.3, rate: 1.1 },
    complete: { text: 'やったー！どうぶつたちが大集合！すごい！', pitch: 1.5, rate: 1.0 },
    timeUp:   { text: '探検おわり！たくさんがんばったね！', pitch: 1.2, rate: 0.9 },
  },
};

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

let currentUtterance: SpeechSynthesisUtterance | null = null;
let speechQueue: Array<{ text: string; pitch: number; rate: number }> = [];
let isProcessingQueue = false;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Check whether the Web Speech API is available in this browser. */
export function isSpeechAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Try to find a Japanese voice.
 * Falls back to the first available voice if no ja-JP voice is found.
 */
function pickJapaneseVoice(): SpeechSynthesisVoice | null {
  const synth = window.speechSynthesis;
  const voices = synth.getVoices();

  // Prefer ja-JP voices
  const jaVoice = voices.find((v) => v.lang === 'ja-JP')
    ?? voices.find((v) => v.lang.startsWith('ja'));

  return jaVoice ?? null;
}

/**
 * Wait for the voice list to be populated.
 * Some browsers load voices asynchronously.
 */
function ensureVoicesReady(): Promise<void> {
  return new Promise<void>((resolve) => {
    const synth = window.speechSynthesis;
    const voices = synth.getVoices();
    if (voices.length > 0) {
      resolve();
      return;
    }
    // Wait for the voiceschanged event (fires once voices are loaded)
    const onVoicesChanged = () => {
      synth.removeEventListener('voiceschanged', onVoicesChanged);
      resolve();
    };
    synth.addEventListener('voiceschanged', onVoicesChanged);
    // Safety timeout – resolve even if event never fires
    setTimeout(() => {
      synth.removeEventListener('voiceschanged', onVoicesChanged);
      resolve();
    }, 2000);
  });
}

// ---------------------------------------------------------------------------
// Queue processor
// ---------------------------------------------------------------------------

async function processQueue(): Promise<void> {
  if (isProcessingQueue) return;
  isProcessingQueue = true;

  while (speechQueue.length > 0) {
    const item = speechQueue.shift()!;
    await playUtterance(item.text, item.pitch, item.rate);
  }

  isProcessingQueue = false;
}

function playUtterance(text: string, pitch: number, rate: number): Promise<void> {
  return new Promise<void>(async (resolve) => {
    if (!isSpeechAvailable()) {
      resolve();
      return;
    }

    const synth = window.speechSynthesis;
    await ensureVoicesReady();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.pitch = Math.max(0, Math.min(2, pitch));
    utterance.rate = Math.max(0.1, Math.min(10, rate));
    utterance.volume = 1.0;

    const voice = pickJapaneseVoice();
    if (voice) {
      utterance.voice = voice;
    }

    currentUtterance = utterance;

    utterance.onend = () => {
      currentUtterance = null;
      resolve();
    };
    utterance.onerror = () => {
      currentUtterance = null;
      resolve();
    };

    // Chrome workaround: cancel stale queue before speaking
    synth.cancel();
    synth.speak(utterance);
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Speak a theme-specific line for the given trigger point.
 * Enqueues if a line is already being spoken.
 */
export async function speak(themeId: ThemeId, trigger: string): Promise<void> {
  if (!isSpeechAvailable()) return;

  const themeLines = speechData[themeId];
  if (!themeLines) return;

  const line = themeLines[trigger];
  if (!line) return;

  const pitch = line.pitch ?? 1.2;
  const rate = line.rate ?? 1.0;

  speechQueue.push({ text: line.text, pitch, rate });
  await processQueue();
}

/**
 * Speak arbitrary text with optional prosody overrides.
 */
export async function speakText(
  text: string,
  options?: { pitch?: number; rate?: number },
): Promise<void> {
  if (!isSpeechAvailable()) return;

  const pitch = options?.pitch ?? 1.2;
  const rate = options?.rate ?? 1.0;

  speechQueue.push({ text, pitch, rate });
  await processQueue();
}

/**
 * Immediately stop any current speech and clear the queue.
 */
export function stopSpeaking(): void {
  if (!isSpeechAvailable()) return;

  speechQueue = [];
  isProcessingQueue = false;
  currentUtterance = null;
  window.speechSynthesis.cancel();
}
