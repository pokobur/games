// =============================================================================
// recorder.ts — Parent voice recording using MediaRecorder API
// =============================================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RecordingState = 'idle' | 'recording' | 'unavailable';

export interface RecorderCallbacks {
  /** Called every ~250ms while recording with elapsed seconds. */
  onProgress?: (seconds: number) => void;
  /** Called when recording auto-stops at the max duration. */
  onAutoStop?: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_RECORDING_SECONDS = 10;
const PROGRESS_INTERVAL_MS = 250;

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

let mediaRecorder: MediaRecorder | null = null;
let recordedChunks: Blob[] = [];
let recordingState: RecordingState = 'idle';
let recordingStartTime = 0;
let progressTimer: number | null = null;
let autoStopTimer: number | null = null;
let callbacks: RecorderCallbacks = {};

// Playback state
let playbackAudio: HTMLAudioElement | null = null;
let playbackObjectUrl: string | null = null;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Determine the best supported MIME type for recording.
 */
function pickMimeType(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
  ];
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }
  // Fallback: let the browser decide
  return '';
}

function clearTimers(): void {
  if (progressTimer !== null) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
  if (autoStopTimer !== null) {
    clearTimeout(autoStopTimer);
    autoStopTimer = null;
  }
}

// ---------------------------------------------------------------------------
// Public API — Recording
// ---------------------------------------------------------------------------

/**
 * Check whether MediaRecorder is available in this browser.
 */
export function isRecordingSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    'mediaDevices' in navigator &&
    typeof navigator.mediaDevices.getUserMedia === 'function' &&
    typeof MediaRecorder !== 'undefined'
  );
}

/**
 * Request microphone access and start recording.
 *
 * @throws Error if MediaRecorder is not supported or mic access is denied.
 */
export async function startRecording(cbs?: RecorderCallbacks): Promise<void> {
  if (!isRecordingSupported()) {
    recordingState = 'unavailable';
    throw new Error('MediaRecorder is not supported in this browser.');
  }

  // If already recording, stop first
  if (recordingState === 'recording' && mediaRecorder) {
    mediaRecorder.stop();
    clearTimers();
  }

  callbacks = cbs ?? {};
  recordedChunks = [];

  // Request mic access
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  const mimeType = pickMimeType();
  const options: MediaRecorderOptions = mimeType ? { mimeType } : {};

  mediaRecorder = new MediaRecorder(stream, options);

  mediaRecorder.ondataavailable = (e: BlobEvent) => {
    if (e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };

  mediaRecorder.onstop = () => {
    // Stop all tracks to release the microphone
    stream.getTracks().forEach((t) => t.stop());
    clearTimers();
    recordingState = 'idle';
  };

  mediaRecorder.onerror = () => {
    stream.getTracks().forEach((t) => t.stop());
    clearTimers();
    recordingState = 'idle';
  };

  // Start recording
  mediaRecorder.start(PROGRESS_INTERVAL_MS); // timeslice → ondataavailable fires periodically
  recordingState = 'recording';
  recordingStartTime = Date.now();

  // Progress callback
  if (callbacks.onProgress) {
    progressTimer = window.setInterval(() => {
      const elapsed = (Date.now() - recordingStartTime) / 1000;
      callbacks.onProgress?.(Math.min(elapsed, MAX_RECORDING_SECONDS));
    }, PROGRESS_INTERVAL_MS);
  }

  // Auto-stop after MAX_RECORDING_SECONDS
  autoStopTimer = window.setTimeout(() => {
    if (recordingState === 'recording' && mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      callbacks.onAutoStop?.();
    }
  }, MAX_RECORDING_SECONDS * 1000);
}

/**
 * Stop recording and return the captured audio as a Blob.
 *
 * @returns The audio blob (webm/ogg/mp4 depending on browser).
 */
export function stopRecording(): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    if (!mediaRecorder || recordingState !== 'recording') {
      reject(new Error('No recording in progress.'));
      return;
    }

    const recorder = mediaRecorder;

    // Override onstop to resolve once data is ready
    const originalOnStop = recorder.onstop;
    recorder.onstop = (event: Event) => {
      if (typeof originalOnStop === 'function') {
        originalOnStop.call(recorder, event);
      }

      const mimeType = recorder.mimeType || 'audio/webm';
      const blob = new Blob(recordedChunks, { type: mimeType });
      recordedChunks = [];
      resolve(blob);
    };

    recorder.stop();
  });
}

/**
 * Get the current recording state.
 */
export function getRecordingState(): RecordingState {
  if (!isRecordingSupported()) return 'unavailable';
  return recordingState;
}

/**
 * Get elapsed recording time in seconds since recording started.
 */
export function getElapsedTime(): number {
  if (recordingState !== 'recording') return 0;
  return (Date.now() - recordingStartTime) / 1000;
}

// ---------------------------------------------------------------------------
// Public API — Playback
// ---------------------------------------------------------------------------

/**
 * Play an audio blob through an HTMLAudioElement.
 */
export function playRecordingBlob(blob: Blob): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    stopPlayback();

    playbackObjectUrl = URL.createObjectURL(blob);
    playbackAudio = new Audio(playbackObjectUrl);

    playbackAudio.onended = () => {
      cleanupPlayback();
      resolve();
    };

    playbackAudio.onerror = () => {
      cleanupPlayback();
      reject(new Error('Playback failed.'));
    };

    playbackAudio.play().catch((err) => {
      cleanupPlayback();
      reject(err);
    });
  });
}

/**
 * Stop any current blob playback.
 */
export function stopPlayback(): void {
  if (playbackAudio) {
    playbackAudio.pause();
    playbackAudio.currentTime = 0;
  }
  cleanupPlayback();
}

/**
 * Check whether a recording blob is currently being played back.
 */
export function isPlayingBack(): boolean {
  return playbackAudio !== null && !playbackAudio.paused && !playbackAudio.ended;
}

// ---------------------------------------------------------------------------
// Internal cleanup
// ---------------------------------------------------------------------------

function cleanupPlayback(): void {
  if (playbackObjectUrl) {
    URL.revokeObjectURL(playbackObjectUrl);
    playbackObjectUrl = null;
  }
  playbackAudio = null;
}
