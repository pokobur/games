// =============================================================================
// sfx.ts — Sound effects using Web Audio API (no external audio files)
// =============================================================================

let audioCtx: AudioContext | null = null;

// ---------------------------------------------------------------------------
// Initialisation
// ---------------------------------------------------------------------------

/**
 * Create the AudioContext on first user interaction.
 * Must be called from a user-gesture handler (click / tap) on iOS / Safari.
 */
export function initAudio(): void {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  // Resume in case the browser suspended the context
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

/** Ensure we have a live AudioContext (lazy-init). */
function ctx(): AudioContext {
  if (!audioCtx) initAudio();
  return audioCtx!;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** MIDI note → frequency */
function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/** Shorthand note frequencies */
const NOTE = {
  C4: midiToFreq(60),
  D4: midiToFreq(62),
  E4: midiToFreq(64),
  F4: midiToFreq(65),
  G4: midiToFreq(67),
  A4: midiToFreq(69),
  B4: midiToFreq(71),
  C5: midiToFreq(72),
  D5: midiToFreq(74),
  E5: midiToFreq(76),
  G5: midiToFreq(79),
} as const;

/**
 * Play a single tone with ADSR-like envelope.
 */
function playTone(
  freq: number,
  options: {
    waveform?: OscillatorType;
    attack?: number;
    decay?: number;
    sustain?: number;
    sustainLevel?: number;
    release?: number;
    volume?: number;
    startOffset?: number;
    detune?: number;
  } = {},
): void {
  const ac = ctx();
  const now = ac.currentTime + (options.startOffset ?? 0);
  const attack = options.attack ?? 0.01;
  const decay = options.decay ?? 0.1;
  const sustain = options.sustain ?? 0.05;
  const sustainLevel = options.sustainLevel ?? 0.6;
  const release = options.release ?? 0.15;
  const volume = options.volume ?? 0.25;

  const osc = ac.createOscillator();
  const gain = ac.createGain();

  osc.type = options.waveform ?? 'sine';
  osc.frequency.setValueAtTime(freq, now);
  if (options.detune) osc.detune.setValueAtTime(options.detune, now);

  // ADSR envelope
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + attack);
  gain.gain.linearRampToValueAtTime(volume * sustainLevel, now + attack + decay);
  gain.gain.setValueAtTime(volume * sustainLevel, now + attack + decay + sustain);
  gain.gain.linearRampToValueAtTime(0, now + attack + decay + sustain + release);

  osc.connect(gain);
  gain.connect(ac.destination);

  osc.start(now);
  osc.stop(now + attack + decay + sustain + release + 0.01);
}

/**
 * Generate a short noise burst (for percussive sounds).
 */
function playNoiseBurst(
  options: {
    duration?: number;
    volume?: number;
    filterFreq?: number;
    filterType?: BiquadFilterType;
    startOffset?: number;
  } = {},
): void {
  const ac = ctx();
  const now = ac.currentTime + (options.startOffset ?? 0);
  const duration = options.duration ?? 0.08;
  const volume = options.volume ?? 0.15;
  const filterFreq = options.filterFreq ?? 4000;
  const filterType = options.filterType ?? 'lowpass';

  // Create noise buffer
  const bufferSize = Math.ceil(ac.sampleRate * duration);
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = ac.createBufferSource();
  source.buffer = buffer;

  const filter = ac.createBiquadFilter();
  filter.type = filterType;
  filter.frequency.setValueAtTime(filterFreq, now);

  const gain = ac.createGain();
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ac.destination);

  source.start(now);
  source.stop(now + duration + 0.01);
}

// ---------------------------------------------------------------------------
// Public sound effects
// ---------------------------------------------------------------------------

/**
 * 🎉 Celebratory fanfare — ascending notes C-E-G-C with harmonics.
 */
export function playCheer(): void {
  const notes = [NOTE.C4, NOTE.E4, NOTE.G4, NOTE.C5];
  const spacing = 0.12;

  notes.forEach((freq, i) => {
    // Fundamental
    playTone(freq, {
      waveform: 'triangle',
      attack: 0.02,
      decay: 0.08,
      sustain: 0.15,
      sustainLevel: 0.5,
      release: 0.3,
      volume: 0.25,
      startOffset: i * spacing,
    });
    // Harmonic (octave up, quieter)
    playTone(freq * 2, {
      waveform: 'sine',
      attack: 0.02,
      decay: 0.06,
      sustain: 0.1,
      sustainLevel: 0.3,
      release: 0.2,
      volume: 0.08,
      startOffset: i * spacing,
    });
  });

  // Final chord – hold the last note longer
  playTone(NOTE.C5, {
    waveform: 'triangle',
    attack: 0.01,
    decay: 0.1,
    sustain: 0.4,
    sustainLevel: 0.4,
    release: 0.5,
    volume: 0.2,
    startOffset: notes.length * spacing,
  });
}

/**
 * ✋ Quick slap + warm tone — high-five sound.
 */
export function playHighFive(): void {
  // Slap – noise burst
  playNoiseBurst({
    duration: 0.06,
    volume: 0.3,
    filterFreq: 5000,
    filterType: 'bandpass',
  });

  // Warm body tone
  playTone(NOTE.G4, {
    waveform: 'sine',
    attack: 0.005,
    decay: 0.05,
    sustain: 0.08,
    sustainLevel: 0.4,
    release: 0.25,
    volume: 0.2,
    startOffset: 0.03,
  });

  // Subtle overtone
  playTone(NOTE.D5, {
    waveform: 'sine',
    attack: 0.01,
    decay: 0.04,
    sustain: 0.05,
    sustainLevel: 0.2,
    release: 0.15,
    volume: 0.08,
    startOffset: 0.04,
  });
}

/**
 * 🔔 Single short beep — countdown tick.
 */
export function playCountdownBeep(): void {
  playTone(NOTE.A4, {
    waveform: 'square',
    attack: 0.005,
    decay: 0.04,
    sustain: 0.02,
    sustainLevel: 0.3,
    release: 0.08,
    volume: 0.15,
  });
}

/**
 * 🎶 Pleasant 3-note ascending chime.
 */
export function playCompletionChime(): void {
  const notes = [NOTE.E4, NOTE.G4, NOTE.C5];
  const spacing = 0.18;

  notes.forEach((freq, i) => {
    playTone(freq, {
      waveform: 'triangle',
      attack: 0.01,
      decay: 0.12,
      sustain: 0.2,
      sustainLevel: 0.5,
      release: 0.4,
      volume: 0.22,
      startOffset: i * spacing,
    });
    // Shimmer layer
    playTone(freq * 3, {
      waveform: 'sine',
      attack: 0.01,
      decay: 0.08,
      sustain: 0.05,
      sustainLevel: 0.15,
      release: 0.2,
      volume: 0.04,
      startOffset: i * spacing,
    });
  });
}

/**
 * 💥 Impactful thud + reverb — stamp slam.
 */
export function playStampSlam(): void {
  const ac = ctx();
  const now = ac.currentTime;

  // Deep thud – low sine with pitch drop
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, now);
  osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
  gain.gain.setValueAtTime(0.4, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.4);

  // Impact noise
  playNoiseBurst({
    duration: 0.1,
    volume: 0.25,
    filterFreq: 2000,
    filterType: 'lowpass',
  });

  // Reverb tail – quiet filtered noise decay
  playNoiseBurst({
    duration: 0.5,
    volume: 0.06,
    filterFreq: 1200,
    filterType: 'lowpass',
    startOffset: 0.05,
  });
}

/**
 * ✨ Sparkly ascending notes sequence — confetti burst.
 */
export function playConfetti(): void {
  const notes = [NOTE.C5, NOTE.D5, NOTE.E5, NOTE.G5, NOTE.C5 * 2];
  const spacing = 0.07;

  notes.forEach((freq, i) => {
    playTone(freq, {
      waveform: 'sine',
      attack: 0.005,
      decay: 0.04,
      sustain: 0.03,
      sustainLevel: 0.3,
      release: 0.15,
      volume: 0.15,
      startOffset: i * spacing,
    });
    // Sparkle – detuned harmonic
    playTone(freq * 2, {
      waveform: 'sine',
      attack: 0.005,
      decay: 0.03,
      sustain: 0.02,
      sustainLevel: 0.15,
      release: 0.12,
      volume: 0.05,
      startOffset: i * spacing + 0.01,
      detune: 15,
    });
  });
}

/**
 * 🔔 Soft, gentle single bell — calm chime for cooldown.
 */
export function playCalmChime(): void {
  const freq = NOTE.E4;

  // Fundamental
  playTone(freq, {
    waveform: 'sine',
    attack: 0.02,
    decay: 0.2,
    sustain: 0.3,
    sustainLevel: 0.35,
    release: 0.8,
    volume: 0.15,
  });

  // Soft 2nd partial
  playTone(freq * 2.0, {
    waveform: 'sine',
    attack: 0.02,
    decay: 0.15,
    sustain: 0.15,
    sustainLevel: 0.2,
    release: 0.5,
    volume: 0.06,
  });

  // Very quiet 3rd partial for bell colour
  playTone(freq * 3.0, {
    waveform: 'sine',
    attack: 0.02,
    decay: 0.1,
    sustain: 0.05,
    sustainLevel: 0.1,
    release: 0.3,
    volume: 0.025,
  });
}

/**
 * 🕐 Subtle tick sound.
 */
export function playTickTock(): void {
  const ac = ctx();
  const now = ac.currentTime;

  // Very short click using a high-pass filtered oscillator
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  const filter = ac.createBiquadFilter();

  osc.type = 'square';
  osc.frequency.setValueAtTime(800, now);
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(600, now);

  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ac.destination);

  osc.start(now);
  osc.stop(now + 0.04);
}
