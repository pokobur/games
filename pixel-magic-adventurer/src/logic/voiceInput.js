/**
 * voiceInput.js
 * Web Speech API ラッパー。非対応ブラウザでは無効化。
 */

export class VoiceInput {
  constructor({ onStart, onResult, onEnd, onError }) {
    this.onStart = onStart || (() => {});
    this.onResult = onResult || (() => {});
    this.onEnd = onEnd || (() => {});
    this.onError = onError || (() => {});
    this.recognition = null;
    this.isSupported = false;
    this._setup();
  }

  _setup() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      console.warn('Web Speech API not supported.');
      return;
    }
    this.isSupported = true;
    const rec = new SR();
    rec.lang = 'ja-JP';
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => this.onStart();

    rec.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      const isFinal = event.results[event.results.length - 1].isFinal;
      this.onResult(transcript, isFinal);
    };

    rec.onend = () => this.onEnd();

    rec.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.onError(event.error);
    };

    this.recognition = rec;
  }

  start() {
    if (!this.isSupported || !this.recognition) return false;
    try {
      this.recognition.start();
      return true;
    } catch (e) {
      return false;
    }
  }

  stop() {
    if (!this.recognition) return;
    try {
      this.recognition.stop();
    } catch (e) {}
  }
}
