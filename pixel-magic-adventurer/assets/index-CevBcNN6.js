var e=Object.defineProperty,t=(t,n)=>{let r={};for(var i in t)e(r,i,{get:t[i],enumerable:!0});return n||e(r,Symbol.toStringTag,{value:`Module`}),r};(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var n=``+new URL(`mascot-vl8oku8q.png`,import.meta.url).href,r=`modulepreload`,i=function(e,t){return new URL(e,t).href},a={},o=function(e,t,n){let o=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),s=document.querySelector(`meta[property=csp-nonce]`),c=s?.nonce||s?.getAttribute(`nonce`);function l(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}o=l(t.map(t=>{if(t=i(t,n),t in a)return;a[t]=!0;let o=t.endsWith(`.css`),s=o?`[rel="stylesheet"]`:``;if(n)for(let n=e.length-1;n>=0;n--){let r=e[n];if(r.href===t&&(!o||r.rel===`stylesheet`))return}else if(document.querySelector(`link[href="${t}"]${s}`))return;let l=document.createElement(`link`);if(l.rel=o?`stylesheet`:r,o||(l.as=`script`),l.crossOrigin=``,l.href=t,c&&l.setAttribute(`nonce`,c),document.head.appendChild(l),o)return new Promise((e,n)=>{l.addEventListener(`load`,e),l.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function s(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return o.then(t=>{for(let e of t||[])e.status===`rejected`&&s(e.reason);return e().catch(s)})};function s({onStart:e,onGallery:t,onResume:r}){let i=document.createElement(`div`);i.id=`screen-home`,i.className=`screen`,i.innerHTML=`
    <div class="home-bg">
      <!-- Stars background -->
      ${Array.from({length:20},(e,t)=>`
        <div class="home-star" style="
          left:${Math.random()*100}%;
          top:${Math.random()*100}%;
          animation-delay:${(Math.random()*3).toFixed(1)}s;
          width:${6+Math.random()*8}px;
          height:${6+Math.random()*8}px;
        "></div>
      `).join(``)}
    </div>

    <div class="home-content">
      <div class="home-title-wrap">
        <div class="home-title-jp">ピクセル・マジック</div>
        <div class="home-title-en">ADVENTURER</div>
        <div class="home-title-stars">⭐ ✨ ⭐</div>
      </div>

      <div class="mascot-wrap" id="home-mascot">
        <img src="${n}" alt="まほうつかいのマスコット" class="mascot-img" />
        <div class="mascot-bubble">
          まほうのことばで<br>えをつくろう！
        </div>
      </div>

      <div class="home-buttons">
        <button class="btn btn-success home-resume-btn hidden" id="home-resume" style="font-size: 1.4rem; padding: 16px 40px; width: 100%; max-width: 320px; background: #06D6A0; box-shadow: 0 6px 0 #048C68;">
          ▶ つづきから
        </button>
        <button class="btn btn-primary home-start-btn" id="home-start">
          ✨ はじめる ✨
        </button>
        <button class="btn btn-accent home-gallery-btn" id="home-gallery">
          🌟 コレクション
        </button>
        <button class="home-transfer-btn" id="home-transfer">
          ⚙️ データのひきつぎ
        </button>
        <button class="home-transfer-btn" id="home-api-setup" style="margin-top: 4px;">
          🔒 API設定
        </button>
      </div>
    </div>

    <!-- API設定モーダル -->
    <div class="transfer-modal hidden" id="api-modal">
      <div class="transfer-modal-content">
        <button class="transfer-modal-close" id="api-modal-close">✕</button>
        <h2>🔒 API設定</h2>
        <p class="transfer-desc">AIを使うためのAPIキー（Gemini）を入力してください。<br>※この端末内にのみ安全に保存されます。</p>
        <div class="transfer-actions">
          <input type="password" id="api-key-input" placeholder="Google AI Studio API Key" style="width: 100%; padding: 12px; font-size: 1rem; border-radius: 8px; border: 2px solid #06D6A0; background: #1A1A2E; color: #FFF; margin-bottom: 8px;" />
          <button class="btn btn-primary transfer-export-btn" id="api-key-save">
            💾 保存して使えるようにする
          </button>
          <button class="home-transfer-btn" id="api-key-delete" style="color: #EF233C; margin-top: 4px;">
            キーを削除する（おためし版に戻す）
          </button>
        </div>
      </div>
    </div>

    <!-- データ引き継ぎモーダル -->
    <div class="transfer-modal hidden" id="transfer-modal">
      <div class="transfer-modal-content">
        <button class="transfer-modal-close" id="transfer-modal-close">✕</button>
        <h2>データのひきつぎ</h2>
        <p class="transfer-desc">いままでの作品や途中データを<br>別のパソコンやスマホにうつすことができます。</p>
        <div class="transfer-actions">
          <button class="btn btn-primary transfer-export-btn" id="transfer-export">
            ⬆️ データをつくる (保存)
          </button>
          <div class="transfer-divider">または</div>
          <button class="btn btn-success transfer-import-btn" id="transfer-import">
            ⬇️ データをよみこむ
          </button>
          <input type="file" id="transfer-file-input" accept=".json" class="hidden" />
        </div>
      </div>
    </div>
  `,i.querySelector(`#home-start`).addEventListener(`click`,e),i.querySelector(`#home-gallery`).addEventListener(`click`,t),i.querySelector(`#home-resume`).addEventListener(`click`,r),i.querySelector(`#home-api-setup`).addEventListener(`click`,async()=>{let{loadApiKey:e}=await o(async()=>{let{loadApiKey:e}=await Promise.resolve().then(()=>p);return{loadApiKey:e}},void 0,import.meta.url);i.querySelector(`#api-key-input`).value=e(),i.querySelector(`#api-modal`).classList.remove(`hidden`)}),i.querySelector(`#api-modal-close`).addEventListener(`click`,()=>{i.querySelector(`#api-modal`).classList.add(`hidden`)}),i.querySelector(`#api-key-save`).addEventListener(`click`,async()=>{let{saveApiKey:e}=await o(async()=>{let{saveApiKey:e}=await Promise.resolve().then(()=>p);return{saveApiKey:e}},void 0,import.meta.url);e(i.querySelector(`#api-key-input`).value.trim()),alert(`APIキーを保存しました！
これで本物のAI絵しりとりや生成機能が使えます。`),i.querySelector(`#api-modal`).classList.add(`hidden`)}),i.querySelector(`#api-key-delete`).addEventListener(`click`,async()=>{let{saveApiKey:e}=await o(async()=>{let{saveApiKey:e}=await Promise.resolve().then(()=>p);return{saveApiKey:e}},void 0,import.meta.url);confirm(`保存してあるAPIキーを削除しますか？`)&&(e(``),i.querySelector(`#api-key-input`).value=``,alert(`APIキーを削除しました。おためし版（モック）に戻ります。`),i.querySelector(`#api-modal`).classList.add(`hidden`))}),i.querySelector(`#home-transfer`).addEventListener(`click`,()=>{i.querySelector(`#transfer-modal`).classList.remove(`hidden`)}),i.querySelector(`#transfer-modal-close`).addEventListener(`click`,()=>{i.querySelector(`#transfer-modal`).classList.add(`hidden`)});let a=i.querySelector(`#transfer-file-input`);return i.querySelector(`#transfer-export`).addEventListener(`click`,async()=>{let{exportData:e}=await o(async()=>{let{exportData:e}=await Promise.resolve().then(()=>p);return{exportData:e}},void 0,import.meta.url),t=e(),n=new Blob([t],{type:`application/json`}),r=URL.createObjectURL(n),i=document.createElement(`a`);i.href=r,i.download=`pixel_magic_data_${new Date().getTime()}.json`,document.body.appendChild(i),i.click(),document.body.removeChild(i),URL.revokeObjectURL(r)}),i.querySelector(`#transfer-import`).addEventListener(`click`,()=>{confirm(`【注意】いまのデータが消えて、このファイルデータで上書きされます。よろしいですか？`)&&a.click()}),a.addEventListener(`change`,async e=>{let t=e.target.files[0];if(!t)return;let n=new FileReader;n.onload=async e=>{let t=e.target.result,{importData:n}=await o(async()=>{let{importData:e}=await Promise.resolve().then(()=>p);return{importData:e}},void 0,import.meta.url);n(t)?(alert(`データのよみこみに成功しました！
画面を再読み込みします。`),window.location.reload()):alert(`エラー：ファイルのデータが正しくありません。`),a.value=``},n.readAsText(t)}),i._refresh=()=>{o(async()=>{let{loadWipPuzzle:e}=await Promise.resolve().then(()=>p);return{loadWipPuzzle:e}},void 0,import.meta.url).then(({loadWipPuzzle:e})=>{let t=e(),n=i.querySelector(`#home-resume`);t?n.classList.remove(`hidden`):n.classList.add(`hidden`)})},i}var c=`
/* ====== HomeScreen ====== */
#screen-home {
  align-items: center;
  justify-content: center;
  background: #1A1A2E;
  position: relative;
  overflow: hidden;
}

.home-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.home-star {
  position: absolute;
  background: #FFD60A;
  border-radius: 50%;
  animation: glowPulse 2s ease-in-out infinite;
}

.home-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 20px;
  width: 100%;
  max-width: 420px;
}

.home-title-wrap {
  text-align: center;
}

.home-title-jp {
  font-size: 2rem;
  font-weight: 900;
  color: #FFD60A;
  text-shadow: 3px 3px 0 #D94F1A, 0 0 20px #FFD60A;
  letter-spacing: 2px;
  animation: float 3s ease-in-out infinite;
}

.home-title-en {
  font-size: 1.2rem;
  font-weight: 900;
  color: #FF6B35;
  letter-spacing: 6px;
}

.home-title-stars {
  font-size: 1.5rem;
  animation: float 2s ease-in-out infinite reverse;
}

.mascot-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: bounceIn 0.6s ease;
}

.mascot-img {
  width: 140px;
  height: 140px;
  object-fit: contain;
  animation: float 3s ease-in-out infinite;
  image-rendering: pixelated;
}

.mascot-bubble {
  background: #FFD60A;
  color: #1A1A2E;
  font-size: 1rem;
  font-weight: 900;
  padding: 10px 18px;
  border-radius: 20px;
  border: 3px solid #D94F1A;
  text-align: center;
  line-height: 1.5;
  position: relative;
  margin-top: 8px;
}

.mascot-bubble::before {
  content: '';
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  border: 7px solid transparent;
  border-bottom-color: #D94F1A;
}

.mascot-bubble::after {
  content: '';
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-bottom-color: #FFD60A;
}

.home-buttons {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  align-items: center;
}

.home-start-btn {
  font-size: 1.6rem;
  padding: 20px 60px;
  width: 100%;
  max-width: 320px;
  background: #FF6B35;
  animation: float 2s ease-in-out infinite;
  box-shadow: 0 8px 0 #8B3A1A;
}

.home-gallery-btn {
  font-size: 1.2rem;
  padding: 14px 40px;
  background: #FFD60A;
  color: #1A1A2E;
  box-shadow: 0 6px 0 #8B7000;
}

.home-transfer-btn {
  background: none;
  border: none;
  color: #A0AABA;
  font-size: 0.95rem;
  font-weight: bold;
  margin-top: 10px;
  cursor: pointer;
  text-decoration: underline;
  font-family: var(--font-main);
}
.home-transfer-btn:hover {
  color: #FFFFFF;
}

/* Transfer Modal */
.transfer-modal {
  position: fixed;
  inset: 0;
  background: rgba(15, 52, 96, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}
.transfer-modal-content {
  background: #16213E;
  border: 4px solid #06D6A0;
  border-radius: 20px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.8);
  animation: bounceIn 0.3s ease;
  text-align: center;
}
.transfer-modal-content h2 {
  color: #06D6A0;
  font-size: 1.5rem;
  margin-bottom: 12px;
}
.transfer-desc {
  font-size: 0.9rem;
  color: #FFFFFF;
  line-height: 1.5;
  margin-bottom: 24px;
}
.transfer-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}
.transfer-divider {
  font-size: 0.8rem;
  color: #A0AABA;
  margin: 6px 0;
  position: relative;
}
.transfer-divider::before, 
.transfer-divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 35%;
  height: 2px;
  background: #0F3460;
}
.transfer-divider::before { left: 0; }
.transfer-divider::after { right: 0; }

.transfer-export-btn,
.transfer-import-btn {
  width: 100%;
  font-size: 1.1rem;
  padding: 14px;
}
.transfer-modal-close {
  position: absolute;
  top: -15px;
  right: -15px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #EF233C;
  color: white;
  border: 3px solid #16213E;
  font-size: 1.4rem;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 0 #8B0018;
}
.transfer-modal-close:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #8B0018;
}
`,l=class{constructor({onStart:e,onResult:t,onEnd:n,onError:r}){this.onStart=e||(()=>{}),this.onResult=t||(()=>{}),this.onEnd=n||(()=>{}),this.onError=r||(()=>{}),this.recognition=null,this.isSupported=!1,this._setup()}_setup(){let e=window.SpeechRecognition||window.webkitSpeechRecognition;if(!e){console.warn(`Web Speech API not supported.`);return}this.isSupported=!0;let t=new e;t.lang=`ja-JP`,t.continuous=!1,t.interimResults=!0,t.maxAlternatives=1,t.onstart=()=>this.onStart(),t.onresult=e=>{let t=``;for(let n=e.resultIndex;n<e.results.length;n++)t+=e.results[n][0].transcript;let n=e.results[e.results.length-1].isFinal;this.onResult(t,n)},t.onend=()=>this.onEnd(),t.onerror=e=>{console.error(`Speech recognition error:`,e.error),this.onError(e.error)},this.recognition=t}start(){if(!this.isSupported||!this.recognition)return!1;try{return this.recognition.start(),!0}catch{return!1}}stop(){if(this.recognition)try{this.recognition.stop()}catch{}}},u=new class{constructor(){this.ctx=null,this.enabled=!0,this._init()}_init(){try{let e=window.AudioContext||window.webkitAudioContext;e&&(this.ctx=new e)}catch{console.warn(`Web Audio API not supported`)}}_resume(){this.ctx&&this.ctx.state===`suspended`&&this.ctx.resume()}playPop(e=0){if(!this.ctx||!this.enabled)return;this._resume();let t=[392,440,494,523,587,659,698,784],n=t[e%t.length],r=this.ctx.createOscillator(),i=this.ctx.createGain();r.connect(i),i.connect(this.ctx.destination),r.type=`sine`,r.frequency.setValueAtTime(n,this.ctx.currentTime),r.frequency.exponentialRampToValueAtTime(n*1.5,this.ctx.currentTime+.08),i.gain.setValueAtTime(.35,this.ctx.currentTime),i.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+.15),r.start(this.ctx.currentTime),r.stop(this.ctx.currentTime+.15)}playColorComplete(){!this.ctx||!this.enabled||(this._resume(),[523,659,784,1047].forEach((e,t)=>{let n=this.ctx.createOscillator(),r=this.ctx.createGain();n.connect(r),r.connect(this.ctx.destination),n.type=`square`;let i=this.ctx.currentTime+t*.12;n.frequency.setValueAtTime(e,i),r.gain.setValueAtTime(.25,i),r.gain.exponentialRampToValueAtTime(.001,i+.2),n.start(i),n.stop(i+.22)}))}playComplete(){if(!this.ctx||!this.enabled)return;this._resume();let e=[523,659,784,659,784,1047,1047],t=[0,.13,.26,.45,.58,.71,.9];e.forEach((e,n)=>{let r=this.ctx.createOscillator(),i=this.ctx.createGain();r.connect(i),i.connect(this.ctx.destination),r.type=`sawtooth`;let a=this.ctx.currentTime+t[n];r.frequency.setValueAtTime(e,a),i.gain.setValueAtTime(.3,a),i.gain.exponentialRampToValueAtTime(.001,a+.25),r.start(a),r.stop(a+.28)})}playRecord(){if(!this.ctx||!this.enabled)return;this._resume();let e=this.ctx.createOscillator(),t=this.ctx.createGain();e.connect(t),t.connect(this.ctx.destination),e.type=`sine`,e.frequency.setValueAtTime(880,this.ctx.currentTime),t.gain.setValueAtTime(.2,this.ctx.currentTime),t.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+.2),e.start(this.ctx.currentTime),e.stop(this.ctx.currentTime+.2)}playError(){if(!this.ctx||!this.enabled)return;this._resume();let e=this.ctx.createOscillator(),t=this.ctx.createGain();e.connect(t),t.connect(this.ctx.destination),e.type=`sawtooth`,e.frequency.setValueAtTime(200,this.ctx.currentTime),e.frequency.exponentialRampToValueAtTime(100,this.ctx.currentTime+.3),t.gain.setValueAtTime(.25,this.ctx.currentTime),t.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+.3),e.start(this.ctx.currentTime),e.stop(this.ctx.currentTime+.31)}};function d({onBack:e,onGenerate:t}){let r=document.createElement(`div`);r.id=`screen-spell`,r.className=`screen`,r.innerHTML=`
    <div class="screen-header">
      <button class="back-btn" id="spell-back">◀</button>
      <h1>✨ まほうのじゅもん ✨</h1>
    </div>

    <div class="spell-body">
      <div class="spell-mascot-row">
        <img src="${n}" class="spell-mascot-img" alt="マスコット" />
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
  `;let i=r.querySelector(`#spell-back`),a=r.querySelector(`#spell-mic`),o=r.querySelector(`#spell-mic-label`),s=r.querySelector(`#spell-mic-rings`),c=r.querySelector(`#spell-text`),d=r.querySelector(`#spell-send`),f=r.querySelector(`#spell-input`),p=r.querySelector(`#spell-bubble`),m=``,h=!1,g=new l({onStart(){h=!0,a.classList.add(`recording`),s.classList.add(`active`),o.textContent=`はなしてね！`,p.innerHTML=`きいてるよ〜！<br>はっきりはなしてね！`,u.playRecord()},onResult(e,t){m=e,c.textContent=e,c.classList.add(`has-text`),t&&e.trim()&&(d.disabled=!1)},onEnd(){h=!1,a.classList.remove(`recording`),s.classList.remove(`active`),o.textContent=`おす！`,m.trim()?p.innerHTML=`「${m}」だね！<br>まほうをかけてみよう！`:p.innerHTML=`もうちょっとはっきりはなしてみてね！`},onError(e){h=!1,a.classList.remove(`recording`),s.classList.remove(`active`),o.textContent=`おす！`,u.playError(),e===`not-allowed`&&(p.innerHTML=`マイクがつかえないよ😢<br>したのはこに かいてもいいよ！`)}});return g.isSupported||(a.style.display=`none`),a.addEventListener(`click`,()=>{h?g.stop():(m=``,c.textContent=`きいてるよ〜`,c.classList.remove(`has-text`),d.disabled=!0,g.start())}),f.addEventListener(`input`,()=>{m=f.value,m.trim()?(d.disabled=!1,c.textContent=m,c.classList.add(`has-text`)):d.disabled=!0}),d.addEventListener(`click`,()=>{m.trim()&&t(m.trim())}),i.addEventListener(`click`,e),r._refresh=()=>{m=``,f.value=``,c.textContent=`ここにことばがでるよ`,c.classList.remove(`has-text`),d.disabled=!0,p.innerHTML=`どんなえをつくりたい？<br>マイクをおしてしゃべってね！`,h&&g.stop()},r}var f=`
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
`,p=t({clearWipPuzzle:()=>x,deleteFromGallery:()=>_,exportData:()=>S,importData:()=>C,loadApiKey:()=>E,loadGallery:()=>g,loadWipPuzzle:()=>b,saveApiKey:()=>T,saveToGallery:()=>h,saveWipPuzzle:()=>y}),m=`pma_gallery`;function h(e){let t=g();t.unshift({...e,id:Date.now().toString(),createdAt:Date.now()}),t.length>20&&(t.length=20);try{return localStorage.setItem(m,JSON.stringify(t)),!0}catch(e){return console.error(`Gallery save failed (storage full?):`,e),!1}}function g(){try{let e=localStorage.getItem(m);return e?JSON.parse(e):[]}catch{return[]}}function _(e){let t=g().filter(t=>t.id!==e);localStorage.setItem(m,JSON.stringify(t))}var v=`pma_wip_puzzle`;function y(e){try{localStorage.setItem(v,JSON.stringify(e))}catch(e){console.error(`WIP save failed:`,e)}}function b(){try{let e=localStorage.getItem(v);return e?JSON.parse(e):null}catch{return null}}function x(){localStorage.removeItem(v)}function S(){return JSON.stringify({gallery:localStorage.getItem(m)||`[]`,wip:localStorage.getItem(v)||`null`})}function C(e){try{let t=JSON.parse(e);return t&&typeof t==`object`?(t.gallery!==void 0&&localStorage.setItem(m,t.gallery),t.wip!==void 0&&localStorage.setItem(v,t.wip),!0):!1}catch(e){return console.error(`Import failed:`,e),!1}}var w=`pma_api_key`;function T(e){e?localStorage.setItem(w,e):localStorage.removeItem(w)}function E(){return localStorage.getItem(w)||``}var D=14;function O({onBack:e,onComplete:t}){let n=document.createElement(`div`);n.id=`screen-puzzle`,n.className=`screen`,n.innerHTML=`
    <div class="screen-header puzzle-header">
      <button class="back-btn" id="puzzle-back">◀</button>
      <h1>🎨 ぬりえパズル</h1>
      <div id="puzzle-progress-text" class="puzzle-progress-text"></div>
    </div>

    <div class="puzzle-body">
      <!-- Canvas エリア -->
      <div class="puzzle-canvas-wrap">
        <canvas id="puzzle-canvas" class="puzzle-canvas"></canvas>
        <!-- 完成エフェクト -->
        <div class="puzzle-sparks" id="puzzle-sparks"></div>
      </div>

      <!-- 進捗バー -->
      <div class="puzzle-progress-bar-wrap">
        <div class="puzzle-progress-bar" id="puzzle-progress-bar"></div>
      </div>

      <!-- カラーパレット -->
      <div class="palette-section">
        <div class="palette-label">👇 いろをえらぼう</div>
        <div class="color-palette" id="color-palette"></div>
      </div>
    </div>

    <!-- 全完成モーダル -->
    <div class="complete-modal hidden" id="complete-modal">
      <div class="complete-modal-box">
        <div class="complete-emoji">🎉</div>
        <div class="complete-title">できた！！</div>
        <div class="complete-msg">すごい！かんぺきだよ！</div>
        <div class="complete-buttons">
          <button class="btn btn-accent" id="puzzle-save">💾 ほぞんする</button>
          <button class="btn btn-primary" id="puzzle-new">✨ また あそぶ</button>
        </div>
      </div>
    </div>
  `;let r=null,i=0,a,o,s=new Set,c=0,l=0,d=``;function f(e,t){r=JSON.parse(JSON.stringify(e)),d=t||`マイアート`,i=0,s.clear(),l=0,c=e.grid.length*e.grid[0].length,r.grid.forEach(e=>e.forEach(e=>{e.solved&&l++})),r.palette.forEach((e,t)=>{let n=r.grid.flat().filter(e=>e.colorIndex===t&&!e.solved).length;r.grid.flat().filter(e=>e.colorIndex===t).length>0&&n===0&&s.add(t)}),a=n.querySelector(`#puzzle-canvas`),o=a.getContext(`2d`);let u=e.gridSize;a.width=u*D,a.height=u*D,n.querySelector(`#complete-modal`).classList.add(`hidden`),p(),m(),b()}function p(){let e=n.querySelector(`#color-palette`);e.innerHTML=``;let{palette:t,grid:a}=r;t.forEach((t,n)=>{let r=0;a.forEach(e=>e.forEach(e=>{e.colorIndex===n&&!e.solved&&r++}));let o=document.createElement(`button`);o.className=`palette-btn`+(n===i?` selected`:``)+(r===0?` done`:``),o.style.background=t,o.innerHTML=`<span class="palette-num">${n+1}</span>${r===0?`<span class="palette-check">✓</span>`:``}`,o.setAttribute(`aria-label`,`色${n+1}`),o.addEventListener(`click`,()=>{r!==0&&(i=n,p(),m())}),e.appendChild(o)})}function m(){if(!r||!o)return;let{palette:e,grid:t,gridSize:n}=r;o.clearRect(0,0,a.width,a.height);for(let r=0;r<n;r++)for(let a=0;a<n;a++){let n=t[r][a],s=a*D,c=r*D;n.solved?(o.fillStyle=e[n.colorIndex],o.fillRect(s,c,D,D)):(o.fillStyle=n.colorIndex===i?`#1E3A5F`:`#16213E`,o.fillRect(s,c,D,D),o.fillStyle=n.colorIndex===i?`#FFD60A`:`#A0AABA`,o.font=`bold ${D*.55}px sans-serif`,o.textAlign=`center`,o.textBaseline=`middle`,o.fillText(String(n.colorIndex+1),s+D/2,c+D/2)),o.strokeStyle=`#0F1A2E`,o.lineWidth=.5,o.strokeRect(s,c,D,D)}}function g(e){if(!r)return;let t=a.getBoundingClientRect(),n=a.width/t.width,o=a.height/t.height,f=e.touches?e.touches[0].clientX:e.clientX,h=e.touches?e.touches[0].clientY:e.clientY,g=Math.floor((f-t.left)*n/D),x=Math.floor((h-t.top)*o/D),C=r.gridSize;if(g<0||x<0||g>=C||x>=C)return;let w=r.grid[x][g];if(!w.solved){if(w.colorIndex!==i){u.playError(),_(g,x);return}if(w.solved=!0,l++,u.playPop(i),m(),b(),y({title:d,puzzleData:r}),v(a.getBoundingClientRect().left+(g+.5)*(a.getBoundingClientRect().width/C),a.getBoundingClientRect().top+(x+.5)*(a.getBoundingClientRect().height/C)),r.grid.every(e=>e.every(e=>e.colorIndex!==i||e.solved))&&!s.has(i)){s.add(i),u.playColorComplete(),p();for(let e=0;e<r.palette.length;e++)if(!s.has(e)){i=e;break}m()}l>=c&&setTimeout(()=>S(),400)}}function _(e,t){a.style.animation=`shake 0.3s ease`,setTimeout(()=>{a.style.animation=``},300)}function v(e,t){n.querySelector(`#puzzle-sparks`);for(let n=0;n<4;n++){let r=document.createElement(`div`);r.className=`puzzle-spark-star`,r.textContent=[`⭐`,`✨`,`💫`,`🌟`][n%4];let i=n/4*Math.PI*2;r.style.cssText=`
        left: ${e}px;
        top: ${t}px;
        position: fixed;
        font-size: 1.2rem;
        pointer-events: none;
        z-index: 50;
        animation: starFloat 0.8s ease forwards;
        transform: rotate(${(i*180/Math.PI).toFixed(0)}deg);
      `,document.body.appendChild(r),setTimeout(()=>r.remove(),900)}}function b(){let e=c?l/c*100:0;n.querySelector(`#puzzle-progress-bar`).style.width=e+`%`,n.querySelector(`#puzzle-progress-text`).textContent=`${l} / ${c}`}function S(){x(),u.playComplete(),n.querySelector(`#complete-modal`).classList.remove(`hidden`);for(let e=0;e<12;e++)setTimeout(()=>{v(window.innerWidth*(.2+Math.random()*.6),window.innerHeight*(.2+Math.random()*.6))},e*120)}function C(){let e=document.createElement(`canvas`);e.width=e.height=256;let t=e.getContext(`2d`),n=256/r.gridSize;return r.grid.forEach((e,i)=>{e.forEach((e,a)=>{t.fillStyle=r.palette[e.colorIndex],t.fillRect(a*n,i*n,n,n)})}),e.toDataURL(`image/png`)}let w=!1;function T(){w||(w=!0,a=n.querySelector(`#puzzle-canvas`),a.addEventListener(`click`,g),a.addEventListener(`touchend`,e=>{e.preventDefault(),g(e)},{passive:!1}),n.querySelector(`#puzzle-back`).addEventListener(`click`,e),n.querySelector(`#puzzle-save`).addEventListener(`click`,()=>{let e=C();h({title:d,dataUrl:e,palette:r.palette,grid:r.grid}),n.querySelector(`#complete-modal`).classList.add(`hidden`),t()}),n.querySelector(`#puzzle-new`).addEventListener(`click`,()=>{n.querySelector(`#complete-modal`).classList.add(`hidden`),e()}))}return n._initPuzzle=(e,t)=>{T(),f(e,t)},n}var k=`
/* ====== PuzzleScreen ====== */
#screen-puzzle {
  background: #1A1A2E;
}

.puzzle-header {
  justify-content: space-between;
}

.puzzle-progress-text {
  font-size: 0.85rem;
  font-weight: 900;
  color: #A0AABA;
  min-width: 60px;
  text-align: right;
}

.puzzle-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  gap: 12px;
  overflow: hidden;
}

.puzzle-canvas-wrap {
  position: relative;
  flex-shrink: 0;
}

.puzzle-canvas {
  display: block;
  border: 3px solid #0F3460;
  border-radius: 8px;
  cursor: crosshair;
  touch-action: none;
  /* Scale to fit screen width */
  max-width: min(100vw - 32px, 448px);
  max-height: calc(100vh - 280px);
  width: auto;
  height: auto;
  image-rendering: pixelated;
}

.puzzle-sparks {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* Progress bar */
.puzzle-progress-bar-wrap {
  width: 100%;
  max-width: 448px;
  height: 10px;
  background: #16213E;
  border-radius: 5px;
  overflow: hidden;
  border: 2px solid #0F3460;
  flex-shrink: 0;
}

.puzzle-progress-bar {
  height: 100%;
  background: #06D6A0;
  border-radius: 5px;
  transition: width 0.3s ease;
  width: 0%;
}

/* Palette */
.palette-section {
  width: 100%;
  max-width: 448px;
  flex-shrink: 0;
}

.palette-label {
  font-size: 0.85rem;
  font-weight: 900;
  color: #A0AABA;
  text-align: center;
  margin-bottom: 6px;
}

.color-palette {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
}

.palette-btn {
  position: relative;
  width: 46px;
  height: 46px;
  border-radius: 10px;
  border: 3px solid transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 0 rgba(0,0,0,0.3);
  transition: transform 0.12s ease;
}

.palette-btn:active {
  transform: scale(0.9) translateY(3px);
  box-shadow: 0 1px 0 rgba(0,0,0,0.3);
}

.palette-btn.selected {
  border-color: #FFFFFF;
  transform: scale(1.15);
  box-shadow: 0 0 12px 4px rgba(255,255,255,0.5);
}

.palette-btn.done {
  filter: brightness(0.6);
  cursor: default;
}

.palette-num {
  font-size: 0.8rem;
  font-weight: 900;
  color: #FFFFFF;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
  position: absolute;
  bottom: 3px;
  right: 4px;
}

.palette-check {
  font-size: 1.2rem;
  color: #FFFFFF;
  text-shadow: 0 0 4px rgba(0,0,0,0.8);
}

/* Complete modal */
.complete-modal {
  position: fixed;
  inset: 0;
  background: #0A0A1A;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 90;
  animation: bounceIn 0.4s ease;
}

.complete-modal.hidden {
  display: none;
}

.complete-modal-box {
  background: #16213E;
  border: 4px solid #FFD60A;
  border-radius: 28px;
  padding: 32px 24px;
  text-align: center;
  max-width: 320px;
  width: 90%;
  box-shadow: 0 0 40px 10px #FFD60A;
  animation: fanfareJump 0.5s ease;
}

.complete-emoji {
  font-size: 4rem;
  animation: float 1s ease-in-out infinite;
}

.complete-title {
  font-size: 2.4rem;
  font-weight: 900;
  color: #FFD60A;
  text-shadow: 3px 3px 0 #D94F1A;
  margin: 8px 0 4px;
}

.complete-msg {
  font-size: 1.1rem;
  font-weight: 700;
  color: #A0AABA;
  margin-bottom: 20px;
}

.complete-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}
`;function ee({onBack:e,onNewArt:t,onReplay:n}){let r=document.createElement(`div`);r.id=`screen-gallery`,r.className=`screen`,r.innerHTML=`
    <div class="screen-header">
      <button class="back-btn" id="gallery-back">◀</button>
      <h1>🌟 ひかるコレクション</h1>
    </div>

    <!-- 広告スロット（上） -->
    <div class="ad-slot ad-slot-top" id="ad-top">
      <span class="ad-label">広告</span>
      <!-- Google AdSense コードをここに挿入 -->
    </div>

    <div class="gallery-body" id="gallery-body">
      <!-- ギャラリーグリッド or Empty State -->
    </div>

    <!-- アフィリエイトバナー -->
    <div class="affiliate-banner" id="affiliate-banner">
      <div class="affiliate-left">
        <div class="affiliate-title">🎮 作った絵を飾ろう！</div>
        <div class="affiliate-desc">Divoomでピクセルアートを表示！</div>
      </div>
      <a href="https://www.amazon.co.jp/s?k=Divoom+pixel+clock" target="_blank" rel="noopener" class="btn btn-accent affiliate-btn">
        📦 みてみる
      </a>
    </div>

    <!-- 広告スロット（下） -->
    <div class="ad-slot ad-slot-bottom" id="ad-bottom">
      <span class="ad-label">広告</span>
      <!-- Google AdSense コードをここに挿入 -->
    </div>

    <!-- 親向けパネル -->
    <div class="parent-panel" id="parent-panel">
      <div class="parent-panel-title">📚 保護者の方へ</div>
      <a href="https://plyo.blog" target="_blank" rel="noopener" class="parent-link">
        ✏️ 子供の創造性を伸ばす声かけ術（記事を読む）
      </a>
    </div>

    <!-- モーダル（拡大・あそびなおす・ダウンロード） -->
    <div class="gallery-modal hidden" id="gallery-modal">
      <div class="gallery-modal-content">
        <button class="gallery-modal-close" id="gallery-modal-close">✕</button>
        <img src="" id="gallery-modal-img" class="gallery-modal-img" />
        <h2 id="gallery-modal-title" class="gallery-modal-title"></h2>
        
        <div class="gallery-modal-actions">
          <button class="btn btn-success gallery-modal-download" id="gallery-modal-download">
            📥 しゃしんをほぞんする
          </button>
          <button class="btn btn-primary gallery-modal-replay" id="gallery-modal-replay">
            ▶ もう１かい・あそびなおす
          </button>
        </div>
      </div>
    </div>
  `,r.querySelector(`#gallery-back`).addEventListener(`click`,e),r.querySelector(`#gallery-modal-close`).addEventListener(`click`,()=>{r.querySelector(`#gallery-modal`).classList.add(`hidden`)});function i(){let e=r.querySelector(`#gallery-body`),a=g();if(a.length===0){e.innerHTML=`
        <div class="gallery-empty">
          <div class="gallery-empty-emoji">🎨</div>
          <div class="gallery-empty-text">まだなにもないよ！<br>まほうをかけてえをつくろう！</div>
          <button class="btn btn-primary" id="gallery-new">✨ はじめる</button>
        </div>
      `,e.querySelector(`#gallery-new`).addEventListener(`click`,t);return}e.innerHTML=`<div class="gallery-grid" id="gallery-grid"></div>`;let o=e.querySelector(`#gallery-grid`);a.forEach(e=>{let t=document.createElement(`div`);t.className=`gallery-card`,t.innerHTML=`
        <div class="gallery-img-wrap">
          <img src="${e.dataUrl}" class="gallery-img" alt="${e.title}" />
        </div>
        <div class="gallery-card-title">${e.title}</div>
        <button class="gallery-delete-btn" aria-label="削除">✕</button>
      `,t.addEventListener(`click`,()=>{let t=r.querySelector(`#gallery-modal`);t.querySelector(`#gallery-modal-img`).src=e.dataUrl,t.querySelector(`#gallery-modal-title`).textContent=e.title;let i=t.querySelector(`#gallery-modal-replay`),a=i.cloneNode(!0);i.replaceWith(a),a.addEventListener(`click`,()=>{t.classList.add(`hidden`),n&&n(e)});let o=t.querySelector(`#gallery-modal-download`),s=o.cloneNode(!0);o.replaceWith(s),s.addEventListener(`click`,()=>{let t=document.createElement(`a`);t.href=e.dataUrl,t.download=`${e.title||`pixelmagic`}.png`,document.body.appendChild(t),t.click(),document.body.removeChild(t)}),t.classList.remove(`hidden`)}),t.querySelector(`.gallery-delete-btn`).addEventListener(`click`,t=>{t.stopPropagation(),confirm(`このえをけしますか？`)&&(_(e.id),i())}),o.appendChild(t)})}return r._refresh=i,r}var te=`
/* ====== GalleryScreen ====== */
#screen-gallery {
  background: #1A1A2E;
}

/* Ad slots */
.ad-slot {
  background: #16213E;
  border: 2px solid #0F3460;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60px;
  flex-shrink: 0;
  position: relative;
}

.ad-label {
  font-size: 0.7rem;
  color: #A0AABA;
  position: absolute;
  top: 4px;
  right: 8px;
}

/* Gallery body */
.gallery-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 12px;
}

/* Gallery card */
.gallery-card {
  position: relative;
  background: #16213E;
  border-radius: 16px;
  overflow: hidden;
  border: 3px solid #FFD60A;
  animation: glowPulse 3s ease-in-out infinite;
  box-shadow: 0 0 12px 4px #FFD60A;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.gallery-card:hover {
  transform: scale(1.04);
}

/* Stagger animation delays */
.gallery-card:nth-child(2n)   { animation-delay: 0.5s; }
.gallery-card:nth-child(3n)   { animation-delay: 1s; }
.gallery-card:nth-child(4n)   { animation-delay: 1.5s; }
.gallery-card:nth-child(5n)   { animation-delay: 2s; }

.gallery-img {
  width: 100%;
  aspect-ratio: 1;
  display: block;
  image-rendering: pixelated;
}

.gallery-img-wrap {
  position: relative;
  overflow: hidden;
}

.gallery-card-title {
  background: #0F3460;
  color: #FFD60A;
  font-size: 0.8rem;
  font-weight: 900;
  padding: 6px 8px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gallery-delete-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  background: #EF233C;
  color: #FFFFFF;
  border: none;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  font-size: 0.65rem;
  font-weight: 900;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.4);
}

/* Empty state */
.gallery-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 40px 20px;
  text-align: center;
}

.gallery-empty-emoji {
  font-size: 4rem;
  animation: float 3s ease-in-out infinite;
}

.gallery-empty-text {
  font-size: 1.1rem;
  font-weight: 900;
  color: #A0AABA;
  line-height: 1.6;
}

/* Affiliate banner */
.affiliate-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: #16213E;
  border-top: 3px solid #7B2FBE;
  border-bottom: 3px solid #7B2FBE;
  flex-shrink: 0;
}

.affiliate-left {
  flex: 1;
}

.affiliate-title {
  font-size: 0.95rem;
  font-weight: 900;
  color: #FFD60A;
}

.affiliate-desc {
  font-size: 0.8rem;
  font-weight: 700;
  color: #A0AABA;
}

.affiliate-btn {
  flex-shrink: 0;
  font-size: 0.9rem;
  padding: 10px 16px;
  background: #FFD60A;
  color: #1A1A2E;
  text-decoration: none;
  box-shadow: 0 4px 0 #8B7000;
}

/* Parent panel */
.parent-panel {
  padding: 12px 16px;
  background: #16213E;
  border-top: 2px solid #0F3460;
  flex-shrink: 0;
}

.parent-panel-title {
  font-size: 0.85rem;
  font-weight: 900;
  color: #A0AABA;
  margin-bottom: 6px;
}

.parent-link {
  display: block;
  color: #4CC9F0;
  font-size: 0.9rem;
  font-weight: 700;
  text-decoration: none;
  padding: 8px 12px;
  background: #0F3460;
  border-radius: 10px;
  border: 2px solid #4CC9F0;
}

.parent-link:hover {
  background: #1E4A80;
}

/* Modal */
.gallery-modal {
  position: fixed;
  inset: 0;
  background: rgba(15, 52, 96, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}
.gallery-modal-content {
  background: #16213E;
  border: 4px solid #FFD60A;
  border-radius: 20px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  width: 100%;
  max-width: 360px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.8);
  animation: bounceIn 0.3s ease;
}
.gallery-modal-close {
  position: absolute;
  top: -15px;
  right: -15px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #EF233C;
  color: white;
  border: 3px solid #16213E;
  font-size: 1.4rem;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 0 #8B0018;
}
.gallery-modal-close:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #8B0018;
}
.gallery-modal-img {
  width: 100%;
  aspect-ratio: 1;
  image-rendering: auto;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
}
.gallery-modal-title {
  color: #FFD60A;
  font-size: 1.6rem;
  margin-bottom: 24px;
  text-align: center;
}
.gallery-modal-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}
.gallery-modal-download,
.gallery-modal-replay {
  width: 100%;
  padding: 16px;
  font-size: 1.2rem;
}
.gallery-modal-replay {
  background: #3A86FF;
  box-shadow: 0 6px 0 #1A3D8F;
}
.gallery-modal-replay:active {
  box-shadow: 0 2px 0 #1A3D8F;
}

`;function A(){return E()||``}async function ne(e){let t=A();if(!t)return j(e);let n=`あなたは子供向けアプリのAIアシスタントです。
ユーザーの入力テキストを確認して以下のJSONを返してください：
- safe: boolean（子供向けに適切かどうか）
- prompt: string（英語の画像生成プロンプト。「a very simple 2D flat vector icon of a [subject], thick black outlines, bold solid colors, isolated on pure white background, no shading, no details, child friendly, kawaii」を必ずベースにしてください。ドット絵(16x16)に変換するため、写真や複雑な絵は絶対にNGです）
- message: string（日本語でユーザーへのメッセージ）

入力:「${e}」`;try{let e=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${t}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{parts:[{text:n}]}],generationConfig:{response_mime_type:`application/json`,temperature:.7}})});if(!e.ok)throw Error(`Gemini API error: ${e.status}`);let r=(await e.json()).candidates[0].content.parts[0].text;return JSON.parse(r)}catch(t){return console.error(`Gemini API error:`,t),j(e)}}async function re(e){let t=A();if(!t)return M(e);try{let n=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${t}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({instances:[{prompt:e+`, isolated on a pure white background, extremely simple flat shape, thick outlines, plain solid colors, no gradients, minimal details`}],parameters:{sampleCount:1,aspectRatio:`1:1`}})});if(!n.ok)throw Error(`Imagen API error: ${n.status}`);return`data:image/png;base64,${(await n.json()).predictions[0].bytesBase64Encoded}`}catch(t){return console.error(`Image API error:`,t),M(e)}}var ie={ドラゴン:`dragon`,ねこ:`cat`,いぬ:`dog`,りんご:`apple`,たいよう:`sun`,ほし:`star`,きょうりゅう:`dinosaur`,うさぎ:`rabbit`,くも:`cloud`,はな:`flower`,さかな:`fish`,ふね:`boat`,ロケット:`rocket`,ケーキ:`cake`,にじ:`rainbow`};function j(e){for(let t of[`こわい`,`ちち`,`おかあさん`,`死`,`殺`])if(e.includes(t))return{safe:!1,prompt:``,message:`そのことばはつかえないよ！ほかのことばをためしてね！`};let t=``;for(let[n,r]of Object.entries(ie))if(e.includes(n)){t=r;break}return t||=e||`magical creature`,{safe:!0,prompt:`a very simple 2D flat vector icon of a cute ${t}, thick black outlines, bold solid colors, isolated on pure white background, no shading, no details, child friendly, kawaii`,message:`「${e}」のえをつくるよ！まってね！`}}async function M(e){let t=document.createElement(`canvas`);t.width=256,t.height=256;let n=t.getContext(`2d`),r=[`#FF6B35`,`#FFD60A`,`#06D6A0`,`#4CC9F0`,`#7B2FBE`,`#EF233C`],i=t.width/16,a=t.height/16,o=0;for(let t of e)o=(o*31+t.charCodeAt(0))%1e3;function s(e){return o=(o*1664525+1013904223)%2147483647,Math.abs(o%e)}n.fillStyle=`#1A1A2E`,n.fillRect(0,0,t.width,t.height);for(let e=0;e<16;e++)for(let t=0;t<16;t++)s(3)!==0&&(n.fillStyle=r[s(r.length)],n.fillRect(t*i,e*a,i-1,a-1));return n.fillStyle=`#FFFFFF`,n.font=`bold 20px sans-serif`,n.textAlign=`center`,n.textBaseline=`middle`,n.fillText(`🎨`,t.width/2,t.height/2),t.toDataURL(`image/png`)}var N=16;async function P(e,t=12){let n=await F(e),r=document.createElement(`canvas`);r.width=N,r.height=N;let i=r.getContext(`2d`);i.drawImage(n,0,0,N,N);let a=i.getImageData(0,0,N,N).data,o=[];for(let e=0;e<a.length;e+=4)o.push([a[e],a[e+1],a[e+2]]);let s=I(o,t),c=[];for(let e=0;e<N;e++){let t=[];for(let n=0;n<N;n++){let r=o[e*N+n],i=L(r,s);t.push({colorIndex:i,solved:!1})}c.push(t)}return{palette:s.map(([e,t,n])=>R(e,t,n)),grid:c,gridSize:N}}function F(e){return new Promise((t,n)=>{let r=new Image;e.startsWith(`data:`)||(r.crossOrigin=`anonymous`),r.onload=()=>t(r),r.onerror=n,r.src=e})}function I(e,t,n=20){let r=[],i=Math.floor(e.length/t);for(let n=0;n<t;n++)r.push([...e[n*i]]);let a=Array(e.length).fill(0);for(let i=0;i<n;i++){let n=!1;for(let t=0;t<e.length;t++){let i=L(e[t],r);i!==a[t]&&(a[t]=i,n=!0)}if(!n)break;let i=Array.from({length:t},()=>[0,0,0]),o=Array(t).fill(0);for(let t=0;t<e.length;t++){let n=a[t];i[n][0]+=e[t][0],i[n][1]+=e[t][1],i[n][2]+=e[t][2],o[n]++}for(let e=0;e<t;e++)o[e]>0&&(r[e]=[Math.round(i[e][0]/o[e]),Math.round(i[e][1]/o[e]),Math.round(i[e][2]/o[e])])}return r}function L(e,t){let n=1/0,r=0;for(let i=0;i<t.length;i++){let a=e[0]-t[i][0],o=e[1]-t[i][1],s=e[2]-t[i][2],c=a*a+o*o+s*s;c<n&&(n=c,r=i)}return r}function R(e,t,n){return`#`+[e,t,n].map(e=>e.toString(16).padStart(2,`0`)).join(``)}function z(){let e=[`#FF6B35`,`#FFD60A`,`#06D6A0`,`#4CC9F0`,`#7B2FBE`,`#EF233C`,`#3A86FF`,`#FB5607`,`#8338EC`,`#FFBE0B`,`#06C67A`,`#F72585`],t=[];for(let e=0;e<N;e++){let n=[];for(let t=0;t<N;t++){let r=[{cx:4,cy:4,r:3,ci:0},{cx:12,cy:4,r:3,ci:1},{cx:8,cy:10,r:4,ci:2},{cx:4,cy:12,r:2,ci:3},{cx:12,cy:12,r:2,ci:4}],i=5;for(let{cx:n,cy:a,r:o,ci:s}of r)if((t-n)**2+(e-a)**2<=o**2){i=s;break}n.push({colorIndex:i,solved:!1})}t.push(n)}return{palette:e,grid:t,gridSize:N}}var B=document.createElement(`style`);B.textContent=[c,f,k,te].join(`
`),document.head.appendChild(B);function V(){try{let e=b();e?(X(`puzzle`),q._initPuzzle(e.puzzleData,e.title)):alert(`No WIP data found!`)}catch(e){console.error(e),alert(`Error resuming: `+e.message)}}var H=document.getElementById(`app`),U=document.createElement(`div`);U.className=`loading-overlay hidden`,U.innerHTML=`
  <div class="loading-spinner"></div>
  <div class="loading-text" id="loading-msg">よみこみちゅう…</div>
`,document.body.appendChild(U);var W=document.createElement(`div`);W.className=`toast hidden`,document.body.appendChild(W);var G=s({onStart:()=>X(`spell`),onGallery:()=>X(`gallery`),onResume:V}),K=d({onBack:()=>X(`home`),onGenerate:ae}),q=O({onBack:()=>X(`home`),onComplete:()=>X(`gallery`)}),J=ee({onBack:()=>X(`home`),onNewArt:()=>X(`spell`),onReplay:oe});H.appendChild(G),H.appendChild(K),H.appendChild(q),H.appendChild(J);var Y={home:G,spell:K,puzzle:q,gallery:J};function X(e){Object.values(Y).forEach(e=>e.classList.remove(`active`)),Y[e].classList.add(`active`),e===`gallery`?J._refresh():e===`home`&&G._refresh?G._refresh():e===`spell`&&K._refresh&&K._refresh()}X(`home`);async function ae(e){se(`「${e}」のえをつくってるよ！\nまほうをかけてるかんじ✨`);try{let{safe:t,prompt:n,message:r}=await ne(e);if(!t){Q(),$(r||`そのことばはつかえないよ！`);return}Z(`えをかいてるよ✏️
もうすこしまってね！`);let i=await re(n);Z(`パズルをつくってるよ🧩`);let a;try{a=await P(i,12)}catch(e){console.warn(`pixelateImage failed, using mock:`,e),a=z()}Q(),X(`puzzle`),q._initPuzzle(a,e)}catch(t){console.error(`Generation error:`,t),Q();let n=z();X(`puzzle`),q._initPuzzle(n,e),$(`AIがつかれてるみたい😅 かんたんなえで あそぼう！`)}}function oe(e){let t=e.grid.map(e=>e.map(e=>({...e,solved:!1}))),n={palette:e.palette,grid:t,gridSize:t.length};X(`puzzle`),q._initPuzzle(n,e.title)}function se(e){U.querySelector(`#loading-msg`).innerHTML=e.replace(/\n/g,`<br>`),U.classList.remove(`hidden`)}function Z(e){U.querySelector(`#loading-msg`).innerHTML=e.replace(/\n/g,`<br>`)}function Q(){U.classList.add(`hidden`)}function $(e){W.textContent=e,W.classList.remove(`hidden`),setTimeout(()=>W.classList.add(`hidden`),3e3)}