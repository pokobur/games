/**
 * SpellScreen.js — まほうのじゅもん画面（音声入力 + クイック選択）
 */
import { VoiceInput } from '../logic/voiceInput.js';
import { soundManager } from '../components/SoundManager.js';
import { PRESET_SPELLS } from '../logic/presets.js';
import mascotUrl from '../assets/mascot.png';

export function createSpellScreen({ onBack, onGenerate }) {
  const screen = document.createElement('div');
  screen.id = 'screen-spell';
  screen.className = 'screen';
  screen.innerHTML = `
    <div class="screen-header">
      <button class="back-btn" id="spell-back" aria-label="もどる">◀</button>
      <h1>✨ まほうのじゅもん ✨</h1>
      <button class="icon-btn" id="spell-sound-btn" aria-label="音の切り替え">
        ${soundManager.isMuted ? '🔇' : '🔊'}
      </button>
    </div>

    <div class="spell-body">
      <div class="spell-mascot-row">
        <img src="${mascotUrl}" class="spell-mascot-img" alt="マスコット" />
        <div class="spell-bubble" id="spell-bubble">
          どんなえをつくりたい？<br>マイクをおして おしゃべりしてね！
        </div>
      </div>

      <!-- 音声入力エリア -->
      <div class="spell-voice-area">
        <button class="mic-btn" id="spell-mic" aria-label="録音ボタン">
          <span class="mic-icon">🎤</span>
          <span class="mic-label" id="spell-mic-label">マイクをおす</span>
        </button>
        <div class="mic-indicator-solid" id="spell-mic-indicator">
          🔴 おはなし中...
        </div>
      </div>

      <!-- 認識テキスト表示 -->
      <div class="spell-text-display" id="spell-text">
        ここにじゅもんがでるよ
      </div>

      <!-- 送信ボタン -->
      <button class="btn btn-primary spell-send-btn" id="spell-send" disabled>
        🪄 まほうをかける！
      </button>

      <!-- おすすめのまほう（ワンタップですぐ遊べる！） -->
      <div class="spell-preset-section">
        <div class="spell-preset-label">🌟 タップしてえらんでもいいよ！</div>
        <div class="spell-preset-grid">
          ${PRESET_SPELLS.map(p => `
            <button class="spell-preset-chip" data-spell="${p.name}">
              ${p.emoji} ${p.name}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- テキスト入力フォールバック -->
      <div class="spell-fallback">
        <div class="spell-fallback-label">⌨️ キーボードでもかけるよ ⬇</div>
        <input type="text" class="spell-input" id="spell-input" placeholder="例：ドラゴン、ねこ、にじ..." maxlength="30" />
      </div>
    </div>
  `;

  const backBtn      = screen.querySelector('#spell-back');
  const micBtn       = screen.querySelector('#spell-mic');
  const micLabel     = screen.querySelector('#spell-mic-label');
  const micIndicator = screen.querySelector('#spell-mic-indicator');
  const textDisp     = screen.querySelector('#spell-text');
  const sendBtn      = screen.querySelector('#spell-send');
  const input        = screen.querySelector('#spell-input');
  const bubble       = screen.querySelector('#spell-bubble');
  const soundBtn     = screen.querySelector('#spell-sound-btn');

  // 音量ボタン
  soundBtn.addEventListener('click', () => {
    const muted = soundManager.toggleMute();
    soundBtn.textContent = muted ? '🔇' : '🔊';
  });
  soundManager.onMuteChange((muted) => {
    soundBtn.textContent = muted ? '🔇' : '🔊';
  });

  let currentText = '';
  let isRecording = false;

  function setSpellText(text) {
    currentText = text.trim();
    input.value = currentText;
    if (currentText) {
      textDisp.textContent = currentText;
      textDisp.classList.add('has-text');
      sendBtn.disabled = false;
      bubble.innerHTML = `「${currentText}」だね！<br>まほうをかけてみよう！✨`;
    } else {
      textDisp.textContent = 'ここにじゅもんがでるよ';
      textDisp.classList.remove('has-text');
      sendBtn.disabled = true;
    }
  }

  // おすすめプリセットのクリック
  screen.querySelectorAll('.spell-preset-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      soundManager.playPop(3);
      setSpellText(btn.dataset.spell);
    });
  });

  // 音声認識
  const voice = new VoiceInput({
    onStart() {
      isRecording = true;
      micBtn.classList.add('recording');
      micIndicator.classList.add('active');
      micLabel.textContent = 'きいてるよ！';
      bubble.innerHTML = 'きいてるよ〜！<br>はっきり おはなししてね！👂';
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
      micIndicator.classList.remove('active');
      micLabel.textContent = 'マイクをおす';
      if (!currentText.trim()) {
        bubble.innerHTML = 'もういちど マイクをおして<br>はなしてみてね！';
      } else {
        bubble.innerHTML = `「${currentText}」だね！<br>まほうをかけてみよう！✨`;
        sendBtn.disabled = false;
      }
    },
    onError(err) {
      isRecording = false;
      micBtn.classList.remove('recording');
      micIndicator.classList.remove('active');
      micLabel.textContent = 'マイクをおす';
      soundManager.playError();
      if (err === 'not-allowed') {
        bubble.innerHTML = 'マイクがつかえないよ😢<br>下のおすすめボタンをおしてね！';
      }
    },
  });

  if (!voice.isSupported) {
    micBtn.style.display = 'none';
    micIndicator.style.display = 'none';
    bubble.innerHTML = 'すきなものをえらぶか、<br>したに書いてみてね！';
  }

  micBtn.addEventListener('click', () => {
    if (isRecording) {
      voice.stop();
    } else {
      currentText = '';
      textDisp.textContent = 'きいてるよ…👂';
      textDisp.classList.remove('has-text');
      sendBtn.disabled = true;
      voice.start();
    }
  });

  input.addEventListener('input', () => {
    setSpellText(input.value);
  });

  sendBtn.addEventListener('click', () => {
    if (currentText.trim()) {
      soundManager.playPop(1);
      onGenerate(currentText.trim());
    }
  });

  backBtn.addEventListener('click', onBack);

  screen._refresh = () => {
    currentText = '';
    input.value = '';
    textDisp.textContent = 'ここにじゅもんがでるよ';
    textDisp.classList.remove('has-text');
    sendBtn.disabled = true;
    bubble.innerHTML = 'どんなえをつくりたい？<br>マイクをおして おしゃべりしてね！';
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
  padding: 12px 16px 20px;
  gap: 12px;
  overflow-y: auto;
  max-width: 480px;
  width: 100%;
  margin: 0 auto;
}

.spell-mascot-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.spell-mascot-img {
  width: 75px;
  height: 75px;
  object-fit: contain;
  image-rendering: pixelated;
  animation: float 2.5s ease-in-out infinite;
  flex-shrink: 0;
}

.spell-bubble {
  flex: 1;
  background: #FFD60A;
  color: #1A1A2E;
  font-size: 0.95rem;
  font-weight: 900;
  padding: 10px 14px;
  border-radius: 16px;
  border: 3px solid #0A0E17;
  line-height: 1.4;
  position: relative;
  box-shadow: 0 4px 0 #0A0E17;
}

.spell-bubble::before {
  content: '';
  position: absolute;
  left: -12px;
  top: 50%;
  transform: translateY(-50%);
  border: 6px solid transparent;
  border-right-color: #0A0E17;
}

/* Mic Area */
.spell-voice-area {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin: 4px 0;
}

.mic-btn {
  position: relative;
  z-index: 2;
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: #3A86FF;
  border: 4px solid #0A0E17;
  box-shadow: 0 8px 0 #0A0E17;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  transition: transform 0.12s ease;
}

.mic-btn:active {
  transform: translateY(4px);
  box-shadow: 0 4px 0 #0A0E17;
}

.mic-btn.recording {
  background: #EF233C;
  animation: fanfareJump 0.4s ease infinite;
}

.mic-icon {
  font-size: 2.2rem;
  line-height: 1;
}

.mic-label {
  font-size: 0.85rem;
  font-weight: 900;
  color: #FFFFFF;
}

.mic-indicator-solid {
  display: none;
  background: #EF233C;
  color: #FFFFFF;
  font-size: 0.85rem;
  font-weight: 900;
  padding: 4px 14px;
  border-radius: 12px;
  border: 2px solid #0A0E17;
}

.mic-indicator-solid.active {
  display: block;
}

/* Text Display */
.spell-text-display {
  background: #16213E;
  border: 3px solid #0F3460;
  border-radius: 16px;
  padding: 12px 18px;
  font-size: 1.25rem;
  font-weight: 900;
  color: #A0AABA;
  text-align: center;
  width: 100%;
  min-height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 0 #0A0E17;
}

.spell-text-display.has-text {
  color: #FFD60A;
  border-color: #FFD60A;
  font-size: 1.45rem;
  background: #0F172A;
}

.spell-send-btn {
  width: 100%;
  max-width: 340px;
  font-size: 1.35rem;
  padding: 16px;
  background: #06D6A0;
  color: #1A1A2E;
  border: 3px solid #0A0E17;
}

.spell-send-btn:disabled {
  background: #1E2A45;
  color: #A0AABA;
  box-shadow: 0 4px 0 #0A0E17;
  cursor: not-allowed;
}

/* Preset Chips */
.spell-preset-section {
  width: 100%;
  margin-top: 4px;
}

.spell-preset-label {
  font-size: 0.85rem;
  font-weight: 900;
  color: #FFD60A;
  text-align: center;
  margin-bottom: 6px;
}

.spell-preset-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.spell-preset-chip {
  background: #16213E;
  color: #FFFFFF;
  border: 2px solid #3A86FF;
  border-radius: var(--radius-full);
  padding: 7px 14px;
  font-size: 0.95rem;
  font-weight: 900;
  font-family: inherit;
  cursor: pointer;
  box-shadow: 0 3px 0 #0A0E17;
  transition: transform 0.1s ease;
}

.spell-preset-chip:active {
  transform: translateY(2px);
  box-shadow: 0 1px 0 #0A0E17;
}

.spell-preset-chip:hover {
  background: #3A86FF;
  color: #FFFFFF;
}

/* Fallback Keyboard */
.spell-fallback {
  width: 100%;
  margin-top: 4px;
}

.spell-fallback-label {
  font-size: 0.8rem;
  font-weight: 900;
  color: #A0AABA;
  margin-bottom: 4px;
  text-align: center;
}

.spell-input {
  width: 100%;
  padding: 10px 14px;
  font-size: 1rem;
  font-family: inherit;
  font-weight: 900;
  border: 3px solid #0F3460;
  border-radius: 12px;
  background: #16213E;
  color: #FFFFFF;
  outline: none;
}

.spell-input:focus {
  border-color: #FFD60A;
}
`;
