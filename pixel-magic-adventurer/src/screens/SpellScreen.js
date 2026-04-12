/**
 * SpellScreen.js — まほうのじゅもん画面（音声入力）
 */
import { VoiceInput } from '../logic/voiceInput.js';
import { soundManager } from '../components/SoundManager.js';
import mascotUrl from '../assets/mascot.png';

export function createSpellScreen({ onBack, onGenerate }) {
  const screen = document.createElement('div');
  screen.id = 'screen-spell';
  screen.className = 'screen';
  screen.innerHTML = `
    <div class="screen-header">
      <button class="back-btn" id="spell-back">◀</button>
      <h1>✨ まほうのじゅもん ✨</h1>
    </div>

    <div class="spell-body">
      <div class="spell-mascot-row">
        <img src="${mascotUrl}" class="spell-mascot-img" alt="マスコット" />
        <div class="spell-bubble" id="spell-bubble">
          どんなえをつくりたい？<br>マイクをおしてしゃべってね！
        </div>
      </div>

      <!-- 音声入力エリア -->
      <div class="spell-voice-area">
        <button class="mic-btn" id="spell-mic" aria-label="録音開始">
          <span class="mic-icon">🎤</span>
          <span class="mic-label" id="spell-mic-label">おす！</span>
        </button>
        <div class="mic-rings" id="spell-mic-rings">
          <div class="mic-ring"></div>
          <div class="mic-ring"></div>
          <div class="mic-ring"></div>
        </div>
      </div>

      <!-- 認識テキスト表示 -->
      <div class="spell-text-display" id="spell-text">
        ここにことばがでるよ
      </div>

      <!-- テキスト入力フォールバック -->
      <div class="spell-fallback" id="spell-fallback">
        <div class="spell-fallback-label">キーボードでもかけるよ ⬇</div>
        <input type="text" class="spell-input" id="spell-input" placeholder="例：ドラゴン、ねこ、にじ..." maxlength="40" />
      </div>

      <!-- 送信ボタン -->
      <button class="btn btn-primary spell-send-btn" id="spell-send" disabled>
        🪄 まほうをかける！
      </button>
    </div>
  `;

  const backBtn   = screen.querySelector('#spell-back');
  const micBtn    = screen.querySelector('#spell-mic');
  const micLabel  = screen.querySelector('#spell-mic-label');
  const micRings  = screen.querySelector('#spell-mic-rings');
  const textDisp  = screen.querySelector('#spell-text');
  const sendBtn   = screen.querySelector('#spell-send');
  const input     = screen.querySelector('#spell-input');
  const bubble    = screen.querySelector('#spell-bubble');

  let currentText = '';
  let isRecording = false;

  // Voice input setup
  const voice = new VoiceInput({
    onStart() {
      isRecording = true;
      micBtn.classList.add('recording');
      micRings.classList.add('active');
      micLabel.textContent = 'はなしてね！';
      bubble.innerHTML = 'きいてるよ〜！<br>はっきりはなしてね！';
      soundManager.playRecord();
    },
    onResult(transcript, isFinal) {
      currentText = transcript;
      textDisp.textContent = transcript;
      textDisp.classList.add('has-text');
      if (isFinal && transcript.trim()) {
        sendBtn.disabled = false;
      }
    },
    onEnd() {
      isRecording = false;
      micBtn.classList.remove('recording');
      micRings.classList.remove('active');
      micLabel.textContent = 'おす！';
      if (!currentText.trim()) {
        bubble.innerHTML = 'もうちょっとはっきりはなしてみてね！';
      } else {
        bubble.innerHTML = `「${currentText}」だね！<br>まほうをかけてみよう！`;
      }
    },
    onError(err) {
      isRecording = false;
      micBtn.classList.remove('recording');
      micRings.classList.remove('active');
      micLabel.textContent = 'おす！';
      soundManager.playError();
      if (err === 'not-allowed') {
        bubble.innerHTML = 'マイクがつかえないよ😢<br>したのはこに かいてもいいよ！';
      }
    },
  });

  // Hide mic button if not supported
  if (!voice.isSupported) {
    micBtn.style.display = 'none';
  }

  micBtn.addEventListener('click', () => {
    if (isRecording) {
      voice.stop();
    } else {
      currentText = '';
      textDisp.textContent = 'きいてるよ〜';
      textDisp.classList.remove('has-text');
      sendBtn.disabled = true;
      voice.start();
    }
  });

  input.addEventListener('input', () => {
    currentText = input.value;
    if (currentText.trim()) {
      sendBtn.disabled = false;
      textDisp.textContent = currentText;
      textDisp.classList.add('has-text');
    } else {
      sendBtn.disabled = true;
    }
  });

  sendBtn.addEventListener('click', () => {
    if (currentText.trim()) {
      onGenerate(currentText.trim());
    }
  });

  backBtn.addEventListener('click', onBack);

  screen._refresh = () => {
    currentText = '';
    input.value = '';
    textDisp.textContent = 'ここにことばがでるよ';
    textDisp.classList.remove('has-text');
    sendBtn.disabled = true;
    bubble.innerHTML = 'どんなえをつくりたい？<br>マイクをおしてしゃべってね！';
    if (isRecording) {
      voice.stop();
    }
  };

  return screen;
}

export const spellScreenCSS = `
/* ====== SpellScreen ====== */
#screen-spell {
  background: #1A1A2E;
}

.spell-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  gap: 16px;
  overflow-y: auto;
}

.spell-mascot-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  max-width: 400px;
}

.spell-mascot-img {
  width: 80px;
  height: 80px;
  object-fit: contain;
  image-rendering: pixelated;
  animation: float 3s ease-in-out infinite;
  flex-shrink: 0;
}

.spell-bubble {
  flex: 1;
  background: #FFD60A;
  color: #1A1A2E;
  font-size: 0.95rem;
  font-weight: 900;
  padding: 12px 14px;
  border-radius: 16px;
  border: 3px solid #D94F1A;
  line-height: 1.5;
  position: relative;
}

.spell-bubble::before {
  content: '';
  position: absolute;
  left: -14px;
  top: 50%;
  transform: translateY(-50%);
  border: 7px solid transparent;
  border-right-color: #D94F1A;
}

.spell-bubble::after {
  content: '';
  position: absolute;
  left: -10px;
  top: 50%;
  transform: translateY(-50%);
  border: 6px solid transparent;
  border-right-color: #FFD60A;
}

/* Mic Button */
.spell-voice-area {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 160px;
  height: 160px;
}

.mic-btn {
  position: relative;
  z-index: 2;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: #3A86FF;
  border: none;
  box-shadow: 0 8px 0 #1A3D8F;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  transition: transform 0.15s ease;
}

.mic-btn:active {
  transform: scale(0.94) translateY(4px);
  box-shadow: 0 4px 0 #1A3D8F;
}

.mic-btn.recording {
  background: #EF233C;
  box-shadow: 0 8px 0 #8B0018;
  animation: fanfareJump 0.5s ease infinite;
}

.mic-icon {
  font-size: 2.4rem;
  line-height: 1;
}

.mic-label {
  font-size: 0.85rem;
  font-weight: 900;
  color: #FFFFFF;
}

/* Rings */
.mic-rings {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.mic-ring {
  position: absolute;
  width: 120px;
  height: 120px;
  border: 4px solid #EF233C;
  border-radius: 50%;
  display: none;
}

.mic-rings.active .mic-ring {
  display: block;
}

.mic-rings.active .mic-ring:nth-child(1) {
  animation: pulseRing 1.2s ease-out infinite;
}
.mic-rings.active .mic-ring:nth-child(2) {
  animation: pulseRing 1.2s ease-out 0.4s infinite;
}
.mic-rings.active .mic-ring:nth-child(3) {
  animation: pulseRing 1.2s ease-out 0.8s infinite;
}

/* Text display */
.spell-text-display {
  background: #16213E;
  border: 3px solid #0F3460;
  border-radius: 16px;
  padding: 14px 20px;
  font-size: 1.3rem;
  font-weight: 900;
  color: #A0AABA;
  text-align: center;
  min-width: 260px;
  max-width: 380px;
  width: 100%;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spell-text-display.has-text {
  color: #FFD60A;
  border-color: #FFD60A;
  font-size: 1.5rem;
}

/* Fallback input */
.spell-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 100%;
  max-width: 380px;
}

.spell-fallback-label {
  font-size: 0.9rem;
  font-weight: 700;
  color: #A0AABA;
}

.spell-input {
  width: 100%;
  padding: 14px 16px;
  font-size: 1.1rem;
  font-family: var(--font-main);
  font-weight: 700;
  border: 3px solid #0F3460;
  border-radius: 14px;
  background: #16213E;
  color: #FFFFFF;
  outline: none;
}

.spell-input:focus {
  border-color: #FFD60A;
}

.spell-send-btn {
  width: 100%;
  max-width: 320px;
  font-size: 1.3rem;
  padding: 18px;
  background: #06D6A0;
  color: #1A1A2E;
  box-shadow: 0 8px 0 #04825F;
}

.spell-send-btn:disabled {
  background: #1E2A45;
  color: #A0AABA;
  box-shadow: 0 4px 0 #111827;
  cursor: not-allowed;
}

.spell-send-btn:disabled:active {
  transform: none;
  box-shadow: 0 4px 0 #111827;
}
`;
