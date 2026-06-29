// =============================================================================
// ambient.ts — Ambient sound generator for cooldown mode (Web Audio API)
// =============================================================================

export type AmbientType = 'rain' | 'wave' | 'heartbeat';

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let currentType: AmbientType | null = null;
let playing = false;

/** Handles for stopping the current ambient loop */
let activeNodes: AudioNode[] = [];
let activeTimers: number[] = [];
let activeSourceNodes: AudioBufferSourceNode[] = [];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function getMasterGain(): GainNode {
  if (!masterGain) {
    const ac = getCtx();
    masterGain = ac.createGain();
    masterGain.gain.setValueAtTime(0.5, ac.currentTime);
    masterGain.connect(ac.destination);
  }
  return masterGain;
}

/**
 * Generate a white-noise AudioBuffer (2 seconds, mono).
 */
function createNoiseBuffer(): AudioBuffer {
  const ac = getCtx();
  const length = ac.sampleRate * 2;
  const buffer = ac.createBuffer(1, length, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

/** Track a node for later cleanup. */
function track<T extends AudioNode>(node: T): T {
  activeNodes.push(node);
  return node;
}

/** Track a buffer source for later cleanup. */
function trackSource(src: AudioBufferSourceNode): AudioBufferSourceNode {
  activeSourceNodes.push(src);
  return src;
}

/** Track a timer for later cleanup. */
function trackTimer(id: number): number {
  activeTimers.push(id);
  return id;
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

function cleanupNodes(): void {
  // Stop all sources
  activeSourceNodes.forEach((src) => {
    try { src.stop(); } catch { /* already stopped */ }
    try { src.disconnect(); } catch { /* ok */ }
  });
  activeSourceNodes = [];

  // Disconnect all nodes
  activeNodes.forEach((node) => {
    try { node.disconnect(); } catch { /* ok */ }
  });
  activeNodes = [];

  // Clear timers
  activeTimers.forEach((id) => clearTimeout(id));
  activeTimers = [];
}

// ---------------------------------------------------------------------------
// Rain 🌧️
// ---------------------------------------------------------------------------

function startRain(): void {
  const ac = getCtx();
  const dest = getMasterGain();
  const noiseBuffer = createNoiseBuffer();

  // -- Continuous rain noise --
  const rainSource = ac.createBufferSource();
  rainSource.buffer = noiseBuffer;
  rainSource.loop = true;
  trackSource(rainSource);

  const bandpass = ac.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.setValueAtTime(3000, ac.currentTime);
  bandpass.Q.setValueAtTime(0.8, ac.currentTime);
  track(bandpass);

  const rainGain = ac.createGain();
  rainGain.gain.setValueAtTime(0.25, ac.currentTime);
  track(rainGain);

  rainSource.connect(bandpass);
  bandpass.connect(rainGain);
  rainGain.connect(dest);
  rainSource.start();

  // -- Volume modulation for natural feel --
  function modulateVolume(): void {
    if (!playing) return;
    const now = ac.currentTime;
    const target = 0.15 + Math.random() * 0.15;
    rainGain.gain.linearRampToValueAtTime(target, now + 1.0);
    trackTimer(window.setTimeout(modulateVolume, 800 + Math.random() * 1200));
  }
  modulateVolume();

  // -- Occasional drip sounds --
  function drip(): void {
    if (!playing) return;

    const now = ac.currentTime;
    const dripBuf = ac.createBuffer(1, Math.ceil(ac.sampleRate * 0.04), ac.sampleRate);
    const dripData = dripBuf.getChannelData(0);
    for (let i = 0; i < dripData.length; i++) {
      dripData[i] = Math.random() * 2 - 1;
    }

    const dripSrc = ac.createBufferSource();
    dripSrc.buffer = dripBuf;

    const dripFilter = ac.createBiquadFilter();
    dripFilter.type = 'bandpass';
    dripFilter.frequency.setValueAtTime(2000 + Math.random() * 3000, now);
    dripFilter.Q.setValueAtTime(5, now);

    const dripGain = ac.createGain();
    dripGain.gain.setValueAtTime(0.08 + Math.random() * 0.07, now);
    dripGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    dripSrc.connect(dripFilter);
    dripFilter.connect(dripGain);
    dripGain.connect(dest);
    dripSrc.start(now);
    dripSrc.stop(now + 0.05);

    const nextDrip = 300 + Math.random() * 700;
    trackTimer(window.setTimeout(drip, nextDrip));
  }
  drip();
}

// ---------------------------------------------------------------------------
// Wave 🌊
// ---------------------------------------------------------------------------

function startWave(): void {
  const ac = getCtx();
  const dest = getMasterGain();
  const noiseBuffer = createNoiseBuffer();

  // -- Noise source --
  const waveSource = ac.createBufferSource();
  waveSource.buffer = noiseBuffer;
  waveSource.loop = true;
  trackSource(waveSource);

  // -- Lowpass filter for ocean sound --
  const lowpass = ac.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.setValueAtTime(800, ac.currentTime);
  lowpass.Q.setValueAtTime(1, ac.currentTime);
  track(lowpass);

  // -- LFO modulating filter frequency (wave sweep) --
  const lfo = ac.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.setValueAtTime(0.1, ac.currentTime);
  track(lfo);

  const lfoGainFilter = ac.createGain();
  lfoGainFilter.gain.setValueAtTime(450, ac.currentTime); // sweeps ±450 Hz
  track(lfoGainFilter);

  // Set centre of sweep to 750Hz → range is ~300–1200Hz
  lowpass.frequency.setValueAtTime(750, ac.currentTime);
  lfo.connect(lfoGainFilter);
  lfoGainFilter.connect(lowpass.frequency);

  // -- Volume modulated by same LFO for rise/fall --
  const waveGain = ac.createGain();
  waveGain.gain.setValueAtTime(0.2, ac.currentTime);
  track(waveGain);

  const lfoGainVol = ac.createGain();
  lfoGainVol.gain.setValueAtTime(0.1, ac.currentTime); // ±0.1 volume
  track(lfoGainVol);

  lfo.connect(lfoGainVol);
  lfoGainVol.connect(waveGain.gain);

  waveSource.connect(lowpass);
  lowpass.connect(waveGain);
  waveGain.connect(dest);

  lfo.start();
  waveSource.start();
}

// ---------------------------------------------------------------------------
// Heartbeat 💗
// ---------------------------------------------------------------------------

function startHeartbeat(): void {
  const ac = getCtx();
  const dest = getMasterGain();

  // Timing: ~70 BPM → ~857ms per beat
  // "lub-dub" = two quick pulses then silence
  const beatInterval = 857; // ms
  const lubDuration = 0.08;
  const dubDuration = 0.06;
  const dubDelay = 0.18; // gap between lub and dub (seconds)

  // -- Background warmth: very quiet filtered noise --
  const noiseBuffer = createNoiseBuffer();
  const warmSrc = ac.createBufferSource();
  warmSrc.buffer = noiseBuffer;
  warmSrc.loop = true;
  trackSource(warmSrc);

  const warmFilter = ac.createBiquadFilter();
  warmFilter.type = 'lowpass';
  warmFilter.frequency.setValueAtTime(200, ac.currentTime);
  track(warmFilter);

  const warmGain = ac.createGain();
  warmGain.gain.setValueAtTime(0.03, ac.currentTime);
  track(warmGain);

  warmSrc.connect(warmFilter);
  warmFilter.connect(warmGain);
  warmGain.connect(dest);
  warmSrc.start();

  // -- Heartbeat pulses --
  function pulse(): void {
    if (!playing) return;

    const now = ac.currentTime;

    // "Lub" — deeper
    const lubOsc = ac.createOscillator();
    lubOsc.type = 'sine';
    lubOsc.frequency.setValueAtTime(60, now);
    lubOsc.frequency.exponentialRampToValueAtTime(40, now + lubDuration);

    const lubGain = ac.createGain();
    lubGain.gain.setValueAtTime(0, now);
    lubGain.gain.linearRampToValueAtTime(0.3, now + 0.01);
    lubGain.gain.exponentialRampToValueAtTime(0.001, now + lubDuration);

    lubOsc.connect(lubGain);
    lubGain.connect(dest);
    lubOsc.start(now);
    lubOsc.stop(now + lubDuration + 0.01);

    // "Dub" — slightly higher, softer
    const dubOsc = ac.createOscillator();
    dubOsc.type = 'sine';
    dubOsc.frequency.setValueAtTime(75, now + dubDelay);
    dubOsc.frequency.exponentialRampToValueAtTime(50, now + dubDelay + dubDuration);

    const dubGain = ac.createGain();
    dubGain.gain.setValueAtTime(0, now + dubDelay);
    dubGain.gain.linearRampToValueAtTime(0.2, now + dubDelay + 0.01);
    dubGain.gain.exponentialRampToValueAtTime(0.001, now + dubDelay + dubDuration);

    dubOsc.connect(dubGain);
    dubGain.connect(dest);
    dubOsc.start(now + dubDelay);
    dubOsc.stop(now + dubDelay + dubDuration + 0.01);

    trackTimer(window.setTimeout(pulse, beatInterval));
  }
  pulse();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Start an ambient sound. Stops any currently playing ambient first.
 */
export function startAmbient(type: AmbientType): void {
  if (playing) {
    stopAmbient();
  }

  currentType = type;
  playing = true;

  switch (type) {
    case 'rain':
      startRain();
      break;
    case 'wave':
      startWave();
      break;
    case 'heartbeat':
      startHeartbeat();
      break;
  }
}

/**
 * Stop the current ambient sound.
 */
export function stopAmbient(): void {
  playing = false;
  currentType = null;
  cleanupNodes();
}

/**
 * Set the master volume for ambient sounds (0.0 – 1.0).
 */
export function setVolume(value: number): void {
  const clamped = Math.max(0, Math.min(1, value));
  const gain = getMasterGain();
  const ac = getCtx();
  gain.gain.linearRampToValueAtTime(clamped, ac.currentTime + 0.05);
}

/**
 * Get the currently playing ambient type, or null if nothing is playing.
 */
export function getCurrentType(): AmbientType | null {
  return currentType;
}

/**
 * Check whether ambient sound is currently playing.
 */
export function isPlaying(): boolean {
  return playing;
}
