(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=``+new URL(`mascot-vl8oku8q.png`,import.meta.url).href,t=`pma_gallery`,n=`pma_wip_puzzle`,r=`pma_api_key`;function i(e){let n=a(),r={...e,id:String(Date.now()),createdAt:Date.now()};n.unshift(r),n.length>20&&(n.length=20);try{return localStorage.setItem(t,JSON.stringify(n)),!0}catch(e){for(console.warn(`Gallery save full, trimming older items:`,e);n.length>5;){n.pop();try{return localStorage.setItem(t,JSON.stringify(n)),!0}catch{}}return!1}}function a(){try{let e=localStorage.getItem(t);if(!e)return[];let n=JSON.parse(e);return Array.isArray(n)?n:[]}catch(e){return console.error(`Failed to load gallery:`,e),[]}}function o(e){let n=a().filter(t=>String(t.id)!==String(e));try{localStorage.setItem(t,JSON.stringify(n))}catch(e){console.error(`Failed to save gallery after delete:`,e)}}function s(e){try{localStorage.setItem(n,JSON.stringify(e))}catch(e){console.warn(`WIP save failed:`,e)}}function c(){try{let e=localStorage.getItem(n);return e?JSON.parse(e):null}catch{return null}}function l(){localStorage.removeItem(n)}function u(){return JSON.stringify({version:1,gallery:localStorage.getItem(t)||`[]`,wip:localStorage.getItem(n)||`null`})}function d(e){try{let r=JSON.parse(e);return r&&typeof r==`object`?(typeof r.gallery==`string`&&localStorage.setItem(t,r.gallery),typeof r.wip==`string`&&localStorage.setItem(n,r.wip),!0):!1}catch(e){return console.error(`Import failed:`,e),!1}}function f(e){e&&e.trim()?localStorage.setItem(r,e.trim()):localStorage.removeItem(r)}function p(){return localStorage.getItem(r)||``}var m=`pma_sound_muted`,h=new class{constructor(){this.ctx=null,this.isMuted=localStorage.getItem(m)===`true`,this.enabled=!0,this._listeners=new Set,this._init()}_init(){try{let e=window.AudioContext||window.webkitAudioContext;e&&(this.ctx=new e)}catch(e){console.warn(`Web Audio API not supported`,e)}let e=()=>{this.ctx&&this.ctx.state===`suspended`&&this.ctx.resume(),window.removeEventListener(`pointerdown`,e),window.removeEventListener(`keydown`,e)};window.addEventListener(`pointerdown`,e,{passive:!0}),window.addEventListener(`keydown`,e,{passive:!0})}_resume(){this.ctx&&this.ctx.state===`suspended`&&this.ctx.resume()}toggleMute(){this.isMuted=!this.isMuted;try{localStorage.setItem(m,String(this.isMuted))}catch{}return this._listeners.forEach(e=>e(this.isMuted)),this.isMuted}onMuteChange(e){return this._listeners.add(e),()=>this._listeners.delete(e)}playPop(e=0){if(!this.ctx||!this.enabled||this.isMuted)return;this._resume();let t=[440,494,554,587,659,740,831,880],n=t[e%t.length],r=this.ctx.createOscillator(),i=this.ctx.createGain();r.connect(i),i.connect(this.ctx.destination),r.type=`triangle`;let a=this.ctx.currentTime;r.frequency.setValueAtTime(n,a),r.frequency.exponentialRampToValueAtTime(n*1.4,a+.05),i.gain.setValueAtTime(.28,a),i.gain.exponentialRampToValueAtTime(.001,a+.12),r.start(a),r.stop(a+.12)}playColorComplete(){if(!this.ctx||!this.enabled||this.isMuted)return;this._resume();let e=[523.25,659.25,783.99,1046.5],t=this.ctx.currentTime;e.forEach((e,n)=>{let r=this.ctx.createOscillator(),i=this.ctx.createGain();r.connect(i),i.connect(this.ctx.destination),r.type=`square`;let a=t+n*.09;r.frequency.setValueAtTime(e,a),i.gain.setValueAtTime(.2,a),i.gain.exponentialRampToValueAtTime(.001,a+.18),r.start(a),r.stop(a+.18)})}playComplete(){if(!this.ctx||!this.enabled||this.isMuted)return;this._resume();let e=[523.25,659.25,783.99,659.25,783.99,1046.5,1046.5],t=[0,.12,.24,.4,.52,.64,.82],n=this.ctx.currentTime;e.forEach((e,r)=>{let i=this.ctx.createOscillator(),a=this.ctx.createGain();i.connect(a),a.connect(this.ctx.destination),i.type=`sawtooth`;let o=n+t[r];i.frequency.setValueAtTime(e,o),a.gain.setValueAtTime(.25,o),a.gain.exponentialRampToValueAtTime(.001,o+.22),i.start(o),i.stop(o+.24)})}playRecord(){if(!this.ctx||!this.enabled||this.isMuted)return;this._resume();let e=this.ctx.createOscillator(),t=this.ctx.createGain();e.connect(t),t.connect(this.ctx.destination),e.type=`sine`;let n=this.ctx.currentTime;e.frequency.setValueAtTime(587.33,n),e.frequency.exponentialRampToValueAtTime(880,n+.15),t.gain.setValueAtTime(.2,n),t.gain.exponentialRampToValueAtTime(.001,n+.18),e.start(n),e.stop(n+.18)}playError(){if(!this.ctx||!this.enabled||this.isMuted)return;this._resume();let e=this.ctx.createOscillator(),t=this.ctx.createGain();e.connect(t),t.connect(this.ctx.destination),e.type=`sawtooth`;let n=this.ctx.currentTime;e.frequency.setValueAtTime(220,n),e.frequency.exponentialRampToValueAtTime(140,n+.18),t.gain.setValueAtTime(.2,n),t.gain.exponentialRampToValueAtTime(.001,n+.2),e.start(n),e.stop(n+.2)}};function g({onStart:t,onGallery:n,onResume:r}){let i=document.createElement(`div`);i.id=`screen-home`,i.className=`screen`,i.innerHTML=`
    <div class="home-top-bar">
      <button class="icon-btn" id="home-sound-btn" aria-label="音の切り替え">
        ${h.isMuted?`🔇`:`🔊`}
      </button>
      <div class="home-top-right">
        <button class="icon-btn" id="home-api-setup" title="API設定" aria-label="API設定">
          🔒
        </button>
        <button class="icon-btn" id="home-transfer" title="データ引き継ぎ" aria-label="データ引き継ぎ">
          ⚙️
        </button>
      </div>
    </div>

    <div class="home-content">
      <div class="home-title-wrap">
        <div class="home-title-jp">ピクセル・マジック</div>
        <div class="home-title-en">ADVENTURER</div>
        <div class="home-title-stars">⭐ ✨ ⭐</div>
      </div>

      <div class="mascot-wrap" id="home-mascot">
        <img src="${e}" alt="まほうつかいのマスコット" class="mascot-img" />
        <div class="mascot-bubble">
          まほうのことばで<br>えをつくろう！
        </div>
      </div>

      <div class="home-buttons">
        <button class="btn btn-success home-resume-btn hidden" id="home-resume">
          ▶ つづきから あそぶ！
        </button>
        <button class="btn btn-primary home-start-btn" id="home-start">
          ✨ はじめる ✨
        </button>
        <button class="btn btn-accent home-gallery-btn" id="home-gallery">
          🌟 コレクション
        </button>
      </div>
    </div>

    <!-- API設定モーダル（ソリッド完全不透明） -->
    <div class="modal-backdrop hidden" id="api-modal">
      <div class="modal-card">
        <button class="modal-close-btn" id="api-modal-close">✕</button>
        <h2>🔒 おとなのせってい (API)</h2>
        <p class="modal-desc">Google AI Studio の Gemini APIキーを入力すると、本物のAI画像生成が楽しめます。<br>※未入力でも楽しいプリセットで遊べます！</p>
        <div class="modal-actions">
          <input type="password" id="api-key-input" placeholder="AIzaSy..." class="modal-input" />
          <button class="btn btn-primary" id="api-key-save">
            💾 保存する
          </button>
          <button class="btn btn-danger btn-sm" id="api-key-delete" style="margin-top: 6px;">
            キーを消去（おためし版に戻す）
          </button>
        </div>
      </div>
    </div>

    <!-- データ引き継ぎモーダル（ソリッド完全不透明） -->
    <div class="modal-backdrop hidden" id="transfer-modal">
      <div class="modal-card">
        <button class="modal-close-btn" id="transfer-modal-close">✕</button>
        <h2>⚙️ データのひきつぎ</h2>
        <p class="modal-desc">いままでの作品やプレイデータを<br>別のスマホやパソコンに移動できます。</p>
        <div class="modal-actions">
          <button class="btn btn-primary" id="transfer-export">
            ⬆️ データを保存（ダウンロード）
          </button>
          <div class="modal-divider">または</div>
          <button class="btn btn-success" id="transfer-import">
            ⬇️ ファイルを読み込む
          </button>
          <input type="file" id="transfer-file-input" accept=".json" class="hidden" />
        </div>
      </div>
    </div>
  `;let a=i.querySelector(`#home-sound-btn`);a.addEventListener(`click`,()=>{a.textContent=h.toggleMute()?`🔇`:`🔊`}),h.onMuteChange(e=>{a.textContent=e?`🔇`:`🔊`}),i.querySelector(`#home-start`).addEventListener(`click`,t),i.querySelector(`#home-gallery`).addEventListener(`click`,n),i.querySelector(`#home-resume`).addEventListener(`click`,r);let o=i.querySelector(`#api-modal`),s=i.querySelector(`#api-key-input`);i.querySelector(`#home-api-setup`).addEventListener(`click`,()=>{s.value=p(),o.classList.remove(`hidden`)}),i.querySelector(`#api-modal-close`).addEventListener(`click`,()=>{o.classList.add(`hidden`)}),i.querySelector(`#api-key-save`).addEventListener(`click`,()=>{f(s.value.trim()),alert(`APIキーを保存しました！✨`),o.classList.add(`hidden`)}),i.querySelector(`#api-key-delete`).addEventListener(`click`,()=>{confirm(`APIキーを削除しておためし版に戻しますか？`)&&(f(``),s.value=``,alert(`APIキーを削除しました。`),o.classList.add(`hidden`))});let l=i.querySelector(`#transfer-modal`);i.querySelector(`#home-transfer`).addEventListener(`click`,()=>{l.classList.remove(`hidden`)}),i.querySelector(`#transfer-modal-close`).addEventListener(`click`,()=>{l.classList.add(`hidden`)});let m=i.querySelector(`#transfer-file-input`);return i.querySelector(`#transfer-export`).addEventListener(`click`,()=>{let e=u(),t=new Blob([e],{type:`application/json`}),n=URL.createObjectURL(t),r=document.createElement(`a`);r.href=n,r.download=`pixel_magic_data_${Date.now()}.json`,document.body.appendChild(r),r.click(),document.body.removeChild(r),URL.revokeObjectURL(n)}),i.querySelector(`#transfer-import`).addEventListener(`click`,()=>{confirm(`いまのデータが上書きされます。よろしいですか？`)&&m.click()}),m.addEventListener(`change`,e=>{let t=e.target.files[0];if(!t)return;let n=new FileReader;n.onload=e=>{let t=e.target.result;d(t)?(alert(`データを読み込みました！アプリを再読み込みします。`),window.location.reload()):alert(`エラー：ファイルが正しくありません。`),m.value=``},n.readAsText(t)}),i._refresh=()=>{let e=c(),t=i.querySelector(`#home-resume`);e?t.classList.remove(`hidden`):t.classList.add(`hidden`)},i}var _=`
/* ====== HomeScreen ====== */
#screen-home {
  align-items: center;
  justify-content: space-between;
  background: #1A1A2E;
  position: relative;
  overflow-y: auto;
  padding: 12px 16px 24px;
}

.home-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 440px;
  z-index: 10;
}

.home-top-right {
  display: flex;
  gap: 8px;
}

.home-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;
  max-width: 420px;
  margin: auto 0;
}

.home-title-wrap {
  text-align: center;
}

.home-title-jp {
  font-size: 2.2rem;
  font-weight: 900;
  color: #FFD60A;
  text-shadow: 4px 4px 0 #D94F1A, -2px -2px 0 #0A0E17;
  letter-spacing: 2px;
  line-height: 1.1;
  animation: float 3s ease-in-out infinite;
}

.home-title-en {
  font-size: 1.1rem;
  font-weight: 900;
  color: #FF6B35;
  letter-spacing: 5px;
  text-shadow: 2px 2px 0 #0A0E17;
}

.home-title-stars {
  font-size: 1.4rem;
}

.mascot-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: bounceIn 0.5s ease;
}

.mascot-img {
  width: 130px;
  height: 130px;
  object-fit: contain;
  image-rendering: pixelated;
  animation: float 2.5s ease-in-out infinite;
}

.mascot-bubble {
  background: #FFD60A;
  color: #1A1A2E;
  font-size: 1.05rem;
  font-weight: 900;
  padding: 10px 20px;
  border-radius: 20px;
  border: 4px solid #0A0E17;
  text-align: center;
  line-height: 1.4;
  position: relative;
  margin-top: 6px;
  box-shadow: 0 4px 0 #0A0E17;
}

.home-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  align-items: center;
  margin-top: 6px;
}

.home-start-btn {
  font-size: 1.6rem;
  padding: 18px 48px;
  width: 100%;
  max-width: 320px;
  background: #FF6B35;
}

.home-resume-btn {
  font-size: 1.3rem;
  padding: 16px 36px;
  width: 100%;
  max-width: 320px;
  background: #06D6A0;
}

.home-gallery-btn {
  font-size: 1.25rem;
  padding: 14px 40px;
  width: 100%;
  max-width: 320px;
  background: #FFD60A;
  color: #1A1A2E;
}

/* Modals (ソリッド完全不透明) */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: #0A0E17;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal-card {
  background: #16213E;
  border: 5px solid #FFD60A;
  border-radius: 24px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 10px 0 #0A0E17;
  text-align: center;
  animation: bounceIn 0.3s ease;
}

.modal-card h2 {
  color: #FFD60A;
  font-size: 1.4rem;
  font-weight: 900;
  margin-bottom: 10px;
}

.modal-desc {
  font-size: 0.9rem;
  color: #FFFFFF;
  line-height: 1.5;
  margin-bottom: 18px;
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.modal-input {
  width: 100%;
  padding: 12px 14px;
  font-size: 1rem;
  border-radius: 12px;
  border: 3px solid #06D6A0;
  background: #0F172A;
  color: #FFFFFF;
  outline: none;
  font-family: inherit;
}

.modal-divider {
  font-size: 0.85rem;
  font-weight: 900;
  color: #A0AABA;
  margin: 4px 0;
}

.modal-close-btn {
  position: absolute;
  top: -16px;
  right: -16px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #EF233C;
  color: white;
  border: 3px solid #0A0E17;
  font-size: 1.3rem;
  font-weight: 900;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 0 #0A0E17;
}

.modal-close-btn:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #0A0E17;
}
`,v=class{constructor({onStart:e,onResult:t,onEnd:n,onError:r}){this.onStart=e||(()=>{}),this.onResult=t||(()=>{}),this.onEnd=n||(()=>{}),this.onError=r||(()=>{}),this.recognition=null,this.isSupported=!1,this._setup()}_setup(){let e=window.SpeechRecognition||window.webkitSpeechRecognition;if(!e){console.warn(`Web Speech API not supported.`);return}this.isSupported=!0;let t=new e;t.lang=`ja-JP`,t.continuous=!1,t.interimResults=!0,t.maxAlternatives=1,t.onstart=()=>this.onStart(),t.onresult=e=>{let t=``;for(let n=e.resultIndex;n<e.results.length;n++)t+=e.results[n][0].transcript;let n=e.results[e.results.length-1].isFinal;this.onResult(t,n)},t.onend=()=>this.onEnd(),t.onerror=e=>{console.error(`Speech recognition error:`,e.error),this.onError(e.error)},this.recognition=t}start(){if(!this.isSupported||!this.recognition)return!1;try{return this.recognition.start(),!0}catch{return!1}}stop(){if(this.recognition)try{this.recognition.stop()}catch{}}},y=[{id:`cat`,emoji:`🐱`,name:`ねこ`,color:`#FF9F1C`},{id:`dragon`,emoji:`🐉`,name:`ドラゴン`,color:`#2EC4B6`},{id:`apple`,emoji:`🍎`,name:`りんご`,color:`#E71D36`},{id:`rocket`,emoji:`🚀`,name:`ロケット`,color:`#3A86FF`},{id:`rainbow`,emoji:`🌈`,name:`にじ`,color:`#8338EC`},{id:`star`,emoji:`⭐`,name:`ほし`,color:`#FFD60A`},{id:`cake`,emoji:`🎂`,name:`ケーキ`,color:`#FF6B6B`},{id:`car`,emoji:`🚗`,name:`くるま`,color:`#4CC9F0`}],b={cat:{palette:[`#1A1A2E`,`#000000`,`#FF9F1C`,`#FFE5B4`,`#FF6B8B`,`#FFFFFF`],map:[`0000000000000000`,`0020000000002000`,`0242000000024200`,`0244200000244200`,`0222222222222200`,`2222222222222220`,`2215222222215220`,`2211224422211220`,`2222244442222220`,`2222333333222220`,`0223333333322200`,`0233333333332200`,`0233333333332000`,`0023333333320220`,`0022222222220220`,`0000000000000000`]},apple:{palette:[`#1A1A2E`,`#2EC4B6`,`#8B4513`,`#E71D36`,`#FF6B6B`,`#FFFFFF`],map:[`0000000200000000`,`0000002201110000`,`0000020011111000`,`0000200001110000`,`0033330033330000`,`0344443344443000`,`3455444444444300`,`3455433333444300`,`3444333333344300`,`3443333333344300`,`3443333333344300`,`0343333333343000`,`0343333333343000`,`0034333333430000`,`0003330033300000`,`0000000000000000`]},star:{palette:[`#1A1A2E`,`#FFD60A`,`#FFAA00`,`#000000`,`#FFFFFF`,`#FF4081`],map:[`0000000110000000`,`0000001111000000`,`0000014111000000`,`0000114111100000`,`1111111111111111`,`0111111111111110`,`0011311113111100`,`0001341113411000`,`0011551115511000`,`0111111211111100`,`0111112221111100`,`1111122022111110`,`1111220002211110`,`1112200000221110`,`0122000000022100`,`0000000000000000`]},rocket:{palette:[`#1A1A2E`,`#FFFFFF`,`#EF233C`,`#3A86FF`,`#FFD60A`,`#FF6B35`],map:[`0000000220000000`,`0000002222000000`,`0000011111100000`,`0000111111110000`,`0000113333110000`,`0001133333311000`,`0001133333311000`,`0001113333111000`,`0001111111111000`,`0021111111111200`,`0221111111111220`,`2222111111112222`,`2220022222200222`,`0000045555400000`,`0000004554000000`,`0000000440000000`]},rainbow:{palette:[`#1A1A2E`,`#EF233C`,`#FF9F1C`,`#FFD60A`,`#06D6A0`,`#3A86FF`,`#8338EC`,`#FFFFFF`],map:[`0000111111110000`,`0011222222221100`,`0123333333333210`,`1234444444443210`,`1234555555543210`,`1234566666543210`,`0234560006543200`,`0034560006543000`,`0077700000777000`,`0777770007777700`,`7777777077777770`,`7777777777777777`,`0777777007777770`,`0000000000000000`,`0000000000000000`,`0000000000000000`]},dragon:{palette:[`#1A1A2E`,`#06D6A0`,`#04AC80`,`#FFD60A`,`#FF6B35`,`#000000`],map:[`0000300000003000`,`0000330000033000`,`0001111111111000`,`0011511111511000`,`0111111111111100`,`0111111111111100`,`0011113333111000`,`0001111111110044`,`0001111111100444`,`0011113333110000`,`0111133333311000`,`1111133333311100`,`1101113333110110`,`1001110000110010`,`0001110000111000`,`0000000000000000`]},cake:{palette:[`#1A1A2E`,`#EF233C`,`#FFD60A`,`#FFFFFF`,`#8338EC`,`#FF9F1C`,`#8B4513`],map:[`0000000200000000`,`0000000400000000`,`0000000400000000`,`0001000400010000`,`0011103330111000`,`0333333333333300`,`0333333333333300`,`0555555555555500`,`0555555555555500`,`0666666666666600`,`0333333333333300`,`0555555555555500`,`0555555555555500`,`0333333333333300`,`3333333333333333`,`0000000000000000`]},car:{palette:[`#1A1A2E`,`#3A86FF`,`#4CC9F0`,`#000000`,`#FFD60A`,`#FFFFFF`],map:[`0000000000000000`,`0000000000000000`,`0000000000000000`,`0000011111000000`,`0000122222100000`,`0001222222210000`,`0011222222211000`,`0111111111111110`,`4111111111111114`,`1111111111111111`,`1111111111111111`,`0113331111333110`,`0033533003353300`,`0033533003353300`,`0003330000333000`,`0000000000000000`]}};function x(e){let t=`cat`,n=(e||``).toLowerCase();for(let[e]of Object.entries(b))if(n.includes(e)){t=e;break}n.includes(`ねこ`)||n.includes(`ネコ`)||n.includes(`猫`)?t=`cat`:n.includes(`りんご`)||n.includes(`リンゴ`)||n.includes(`林檎`)||n.includes(`アップル`)?t=`apple`:n.includes(`ほし`)||n.includes(`ホシ`)||n.includes(`星`)||n.includes(`スター`)?t=`star`:n.includes(`ロケット`)?t=`rocket`:n.includes(`にじ`)||n.includes(`虹`)||n.includes(`レインボー`)?t=`rainbow`:n.includes(`ドラゴン`)||n.includes(`りゅう`)||n.includes(`竜`)?t=`dragon`:n.includes(`ケーキ`)?t=`cake`:(n.includes(`くるま`)||n.includes(`車`)||n.includes(`カー`))&&(t=`car`);let r=b[t]||b.cat,i=[];for(let e=0;e<16;e++){let t=[],n=r.map[e]||`0`.repeat(16);for(let e=0;e<16;e++){let r=n[e]||`0`,i=parseInt(r,10);t.push({colorIndex:i,solved:!1})}i.push(t)}return{palette:r.palette,grid:i,gridSize:16,key:t}}function S({onBack:t,onGenerate:n}){let r=document.createElement(`div`);r.id=`screen-spell`,r.className=`screen`,r.innerHTML=`
    <div class="screen-header">
      <button class="back-btn" id="spell-back" aria-label="もどる">◀</button>
      <h1>✨ まほうのじゅもん ✨</h1>
      <button class="icon-btn" id="spell-sound-btn" aria-label="音の切り替え">
        ${h.isMuted?`🔇`:`🔊`}
      </button>
    </div>

    <div class="spell-body">
      <div class="spell-mascot-row">
        <img src="${e}" class="spell-mascot-img" alt="マスコット" />
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
          ${y.map(e=>`
            <button class="spell-preset-chip" data-spell="${e.name}">
              ${e.emoji} ${e.name}
            </button>
          `).join(``)}
        </div>
      </div>

      <!-- テキスト入力フォールバック -->
      <div class="spell-fallback">
        <div class="spell-fallback-label">⌨️ キーボードでもかけるよ ⬇</div>
        <input type="text" class="spell-input" id="spell-input" placeholder="例：ドラゴン、ねこ、にじ..." maxlength="30" />
      </div>
    </div>
  `;let i=r.querySelector(`#spell-back`),a=r.querySelector(`#spell-mic`),o=r.querySelector(`#spell-mic-label`),s=r.querySelector(`#spell-mic-indicator`),c=r.querySelector(`#spell-text`),l=r.querySelector(`#spell-send`),u=r.querySelector(`#spell-input`),d=r.querySelector(`#spell-bubble`),f=r.querySelector(`#spell-sound-btn`);f.addEventListener(`click`,()=>{f.textContent=h.toggleMute()?`🔇`:`🔊`}),h.onMuteChange(e=>{f.textContent=e?`🔇`:`🔊`});let p=``,m=!1;function g(e){p=e.trim(),u.value=p,p?(c.textContent=p,c.classList.add(`has-text`),l.disabled=!1,d.innerHTML=`「${p}」だね！<br>まほうをかけてみよう！✨`):(c.textContent=`ここにじゅもんがでるよ`,c.classList.remove(`has-text`),l.disabled=!0)}r.querySelectorAll(`.spell-preset-chip`).forEach(e=>{e.addEventListener(`click`,()=>{h.playPop(3),g(e.dataset.spell)})});let _=new v({onStart(){m=!0,a.classList.add(`recording`),s.classList.add(`active`),o.textContent=`きいてるよ！`,d.innerHTML=`きいてるよ〜！<br>はっきり おはなししてね！👂`,h.playRecord()},onResult(e,t){p=e,c.textContent=e,c.classList.add(`has-text`),t&&e.trim()&&(l.disabled=!1)},onEnd(){m=!1,a.classList.remove(`recording`),s.classList.remove(`active`),o.textContent=`マイクをおす`,p.trim()?(d.innerHTML=`「${p}」だね！<br>まほうをかけてみよう！✨`,l.disabled=!1):d.innerHTML=`もういちど マイクをおして<br>はなしてみてね！`},onError(e){m=!1,a.classList.remove(`recording`),s.classList.remove(`active`),o.textContent=`マイクをおす`,h.playError(),e===`not-allowed`&&(d.innerHTML=`マイクがつかえないよ😢<br>下のおすすめボタンをおしてね！`)}});return _.isSupported||(a.style.display=`none`,s.style.display=`none`,d.innerHTML=`すきなものをえらぶか、<br>したに書いてみてね！`),a.addEventListener(`click`,()=>{m?_.stop():(p=``,c.textContent=`きいてるよ…👂`,c.classList.remove(`has-text`),l.disabled=!0,_.start())}),u.addEventListener(`input`,()=>{g(u.value)}),l.addEventListener(`click`,()=>{p.trim()&&(h.playPop(1),n(p.trim()))}),i.addEventListener(`click`,t),r._refresh=()=>{p=``,u.value=``,c.textContent=`ここにじゅもんがでるよ`,c.classList.remove(`has-text`),l.disabled=!0,d.innerHTML=`どんなえをつくりたい？<br>マイクをおして おしゃべりしてね！`,m&&_.stop()},r}var C=`
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
`;function w({onBack:e,onComplete:t}){let n=document.createElement(`div`);n.id=`screen-puzzle`,n.className=`screen`,n.innerHTML=`
    <div class="screen-header puzzle-header">
      <button class="back-btn" id="puzzle-back" aria-label="もどる">◀</button>
      <div class="puzzle-title-wrap">
        <h1 id="puzzle-title-text">🎨 ぬりえパズル</h1>
        <div id="puzzle-progress-text" class="puzzle-progress-text">0 / 0</div>
      </div>
      <button class="icon-btn" id="puzzle-sound-btn" aria-label="音の切り替え">
        ${h.isMuted?`🔇`:`🔊`}
      </button>
    </div>

    <div class="puzzle-body">
      <!-- Canvas エリア -->
      <div class="puzzle-canvas-wrap">
        <canvas id="puzzle-canvas" class="puzzle-canvas"></canvas>
        <div class="puzzle-sparks" id="puzzle-sparks"></div>
      </div>

      <!-- 進捗バー（ソリッド） -->
      <div class="puzzle-progress-bar-wrap">
        <div class="puzzle-progress-bar" id="puzzle-progress-bar"></div>
      </div>

      <!-- カラーパレット -->
      <div class="palette-section">
        <div class="palette-label">👇 えらんだいろとおなじ すうじをぬろう！</div>
        <div class="color-palette" id="color-palette"></div>
      </div>
    </div>

    <!-- 全完成モーダル（ソリッド完全不透明） -->
    <div class="complete-modal hidden" id="complete-modal">
      <div class="complete-modal-box">
        <div class="complete-emoji">🎉</div>
        <div class="complete-title">かんせい！！</div>
        <div class="complete-msg">すごい！ぜんぶ ぬれたよ！✨</div>
        <div class="complete-buttons">
          <button class="btn btn-accent" id="puzzle-save">💾 コレクションへ</button>
          <button class="btn btn-primary" id="puzzle-new">✨ また あそぶ</button>
        </div>
      </div>
    </div>
  `;let r=null,a=0,o,c,u=new Set,d=0,f=0,p=``,m=!1,g=null,_=n.querySelector(`#puzzle-sound-btn`);_.addEventListener(`click`,()=>{_.textContent=h.toggleMute()?`🔇`:`🔊`}),h.onMuteChange(e=>{_.textContent=e?`🔇`:`🔊`});function v(e,t){r=JSON.parse(JSON.stringify(e)),p=t||`マイアート`,n.querySelector(`#puzzle-title-text`).textContent=`🎨 ${p}`,a=0,u.clear(),f=0,d=r.grid.length*r.grid[0].length,r.grid.forEach(e=>{e.forEach(e=>{e.solved&&f++})}),r.palette.forEach((e,t)=>{r.grid.flat().filter(e=>e.colorIndex===t&&!e.solved).length===0&&u.add(t)});for(let e=0;e<r.palette.length;e++)if(!u.has(e)){a=e;break}o=n.querySelector(`#puzzle-canvas`),c=o.getContext(`2d`),r.gridSize,o.width=448,o.height=448,n.querySelector(`#complete-modal`).classList.add(`hidden`),y(),b(),T()}function y(){let e=n.querySelector(`#color-palette`);e.innerHTML=``;let{palette:t,grid:i}=r;t.forEach((t,n)=>{let r=0;i.forEach(e=>e.forEach(e=>{e.colorIndex===n&&!e.solved&&r++}));let o=r===0,s=n===a,c=document.createElement(`button`);c.className=`palette-btn ${s?`selected`:``} ${o?`done`:``}`,c.style.background=t,c.innerHTML=`
        <span class="palette-num">${n+1}</span>
        ${o?`<span class="palette-check">✓</span>`:`<span class="palette-badge">${r}</span>`}
      `,c.setAttribute(`aria-label`,`色${n+1} 残り${r}マス`),c.addEventListener(`click`,()=>{o||(a=n,h.playPop(n),y(),b())}),e.appendChild(c)})}function b(){if(!r||!c)return;let{palette:e,grid:t,gridSize:n}=r,i=o.width/n;c.clearRect(0,0,o.width,o.height);for(let r=0;r<n;r++)for(let o=0;o<n;o++){let n=t[r][o],s=o*i,l=r*i;n.solved?(c.fillStyle=e[n.colorIndex],c.fillRect(s,l,i,i)):(n.colorIndex===a?(c.fillStyle=`#0F3460`,c.fillRect(s,l,i,i),c.strokeStyle=`#FFD60A`,c.lineWidth=3,c.strokeRect(s+1.5,l+1.5,i-3,i-3),c.fillStyle=`#FFD60A`):(c.fillStyle=`#16213E`,c.fillRect(s,l,i,i),c.fillStyle=`#A0AABA`),c.font=`900 ${Math.floor(i*.48)}px "M PLUS Rounded 1c", sans-serif`,c.textAlign=`center`,c.textBaseline=`middle`,c.fillText(String(n.colorIndex+1),s+i/2,l+i/2)),c.strokeStyle=`#0A0E17`,c.lineWidth=1,c.strokeRect(s,l,i,i)}}function x(e){if(!r)return null;let t=o.getBoundingClientRect(),n=e.clientX,i=e.clientY;if(n<t.left||n>t.right||i<t.top||i>t.bottom)return null;let a=o.width/t.width,s=o.height/t.height,c=o.width/r.gridSize,l=Math.floor((n-t.left)*a/c),u=Math.floor((i-t.top)*s/c),d=r.gridSize;return l<0||u<0||l>=d||u>=d?null:{cx:l,cy:u}}function S(e,t,n=!1){if(!r)return;let i=r.grid[t][e];if(i.solved)return;if(i.colorIndex!==a){n&&(h.playError(),C());return}i.solved=!0,f++,h.playPop(a),b(),T(),s({title:p,puzzleData:r});let c=o.getBoundingClientRect(),l=r.gridSize;if(w(c.left+(e+.5)*(c.width/l),c.top+(t+.5)*(c.height/l)),r.grid.every(e=>e.every(e=>e.colorIndex!==a||e.solved))&&!u.has(a)){u.add(a),h.playColorComplete();let e=-1;for(let t=0;t<r.palette.length;t++)if(!u.has(t)){e=t;break}e!==-1&&(a=e),y(),b()}f>=d&&setTimeout(()=>E(),300)}function C(){o.classList.remove(`shake-anim`),o.offsetWidth,o.classList.add(`shake-anim`)}function w(e,t){n.querySelector(`#puzzle-sparks`);let r=document.createElement(`div`);r.className=`puzzle-spark-star`,r.textContent=[`⭐`,`✨`,`🌟`][Math.floor(Math.random()*3)],r.style.left=`${e}px`,r.style.top=`${t}px`,document.body.appendChild(r),setTimeout(()=>r.remove(),700)}function T(){let e=d?f/d*100:0;n.querySelector(`#puzzle-progress-bar`).style.width=`${e}%`,n.querySelector(`#puzzle-progress-text`).textContent=`${f} / ${d}`}function E(){l(),h.playComplete(),n.querySelector(`#complete-modal`).classList.remove(`hidden`);for(let e=0;e<10;e++)setTimeout(()=>{w(window.innerWidth*(.2+Math.random()*.6),window.innerHeight*(.2+Math.random()*.6))},e*100)}function D(){let e=document.createElement(`canvas`);e.width=e.height=256;let t=e.getContext(`2d`),n=256/r.gridSize;return r.grid.forEach((e,i)=>{e.forEach((e,a)=>{t.fillStyle=r.palette[e.colorIndex],t.fillRect(a*n,i*n,n,n)})}),e.toDataURL(`image/png`)}let O=!1;function k(){if(O)return;O=!0,o=n.querySelector(`#puzzle-canvas`),o.addEventListener(`pointerdown`,e=>{e.preventDefault(),m=!0;try{o.setPointerCapture(e.pointerId)}catch{}let t=x(e);t&&(g=`${t.cx},${t.cy}`,S(t.cx,t.cy,!0))}),o.addEventListener(`pointermove`,e=>{if(!m)return;e.preventDefault();let t=x(e);if(t){let e=`${t.cx},${t.cy}`;e!==g&&(g=e,S(t.cx,t.cy,!1))}});let a=e=>{m=!1,g=null;try{o.releasePointerCapture(e.pointerId)}catch{}};o.addEventListener(`pointerup`,a),o.addEventListener(`pointercancel`,a),n.querySelector(`#puzzle-back`).addEventListener(`click`,e),n.querySelector(`#puzzle-save`).addEventListener(`click`,()=>{let e=D();i({title:p,dataUrl:e,palette:r.palette,grid:r.grid}),n.querySelector(`#complete-modal`).classList.add(`hidden`),t()}),n.querySelector(`#puzzle-new`).addEventListener(`click`,()=>{n.querySelector(`#complete-modal`).classList.add(`hidden`),e()})}return n._initPuzzle=(e,t)=>{k(),v(e,t)},n}var T=`
/* ====== PuzzleScreen ====== */
#screen-puzzle {
  background: #1A1A2E;
}

.puzzle-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.puzzle-title-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.puzzle-title-wrap h1 {
  font-size: 1.15rem;
  font-weight: 900;
  color: #FFD60A;
  margin: 0;
}

.puzzle-progress-text {
  font-size: 0.85rem;
  font-weight: 900;
  color: #06D6A0;
}

.puzzle-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px 16px;
  gap: 8px;
  overflow: hidden;
  max-width: 480px;
  width: 100%;
  margin: 0 auto;
}

.puzzle-canvas-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  flex: 1;
  min-height: 0;
}

.puzzle-canvas {
  display: block;
  border: 4px solid #0A0E17;
  border-radius: 12px;
  cursor: pointer;
  touch-action: none;
  background: #16213E;
  box-shadow: 0 8px 0 #0A0E17;
  image-rendering: pixelated;
  max-width: 100%;
  max-height: 100%;
  aspect-ratio: 1;
}

.puzzle-canvas.shake-anim {
  animation: shake 0.3s ease;
}

.puzzle-sparks {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.puzzle-spark-star {
  position: fixed;
  font-size: 1.6rem;
  pointer-events: none;
  z-index: 5000;
  animation: starFloat 0.7s ease forwards;
}

/* Progress bar (完全ソリッド) */
.puzzle-progress-bar-wrap {
  width: 100%;
  height: 12px;
  background: #16213E;
  border-radius: 6px;
  overflow: hidden;
  border: 2px solid #0A0E17;
  flex-shrink: 0;
  box-shadow: 0 2px 0 #0A0E17;
}

.puzzle-progress-bar {
  height: 100%;
  background: #06D6A0;
  border-radius: 4px;
  transition: width 0.2s ease;
  width: 0%;
}

/* Palette */
.palette-section {
  width: 100%;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.palette-label {
  font-size: 0.85rem;
  font-weight: 900;
  color: #FFD60A;
  text-align: center;
  margin-bottom: 6px;
}

.color-palette {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  width: 100%;
}

.palette-btn {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  border: 3px solid #0A0E17;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 0 #0A0E17;
  transition: transform 0.1s ease;
}

.palette-btn:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #0A0E17;
}

.palette-btn.selected {
  border: 4px solid #FFFFFF;
  transform: scale(1.15) translateY(-3px);
  box-shadow: 0 8px 0 #0A0E17;
  z-index: 2;
}

.palette-btn.done {
  filter: brightness(0.45);
  cursor: default;
}

.palette-num {
  font-size: 0.95rem;
  font-weight: 900;
  color: #FFFFFF;
  text-shadow: 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000;
}

.palette-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #EF233C;
  color: #FFFFFF;
  font-size: 0.7rem;
  font-weight: 900;
  padding: 1px 5px;
  border-radius: 8px;
  border: 1px solid #0A0E17;
}

.palette-check {
  font-size: 1.4rem;
  color: #06D6A0;
  text-shadow: 1px 1px 0 #000, -1px -1px 0 #000;
}

/* Complete modal (ソリッド完全不透明) */
.complete-modal {
  position: fixed;
  inset: 0;
  background: #0A0E17;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 16px;
}

.complete-modal-box {
  background: #16213E;
  border: 6px solid #FFD60A;
  border-radius: 28px;
  padding: 28px 20px;
  text-align: center;
  max-width: 340px;
  width: 100%;
  box-shadow: 0 10px 0 #0A0E17;
  animation: fanfareJump 0.4s ease;
}

.complete-emoji {
  font-size: 3.8rem;
  animation: float 2s ease-in-out infinite;
}

.complete-title {
  font-size: 2.2rem;
  font-weight: 900;
  color: #FFD60A;
  text-shadow: 3px 3px 0 #D94F1A, -2px -2px 0 #0A0E17;
  margin: 6px 0;
}

.complete-msg {
  font-size: 1.1rem;
  font-weight: 900;
  color: #FFFFFF;
  margin-bottom: 20px;
}

.complete-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
`;function E({onBack:e,onNewArt:t,onReplay:n}){let r=document.createElement(`div`);r.id=`screen-gallery`,r.className=`screen`,r.innerHTML=`
    <div class="screen-header">
      <button class="back-btn" id="gallery-back" aria-label="もどる">◀</button>
      <h1>🌟 ひかるコレクション</h1>
      <button class="icon-btn" id="gallery-sound-btn" aria-label="音の切り替え">
        ${h.isMuted?`🔇`:`🔊`}
      </button>
    </div>

    <!-- 広告スロット（上）Google AdSense 常設 -->
    <div class="ad-slot ad-slot-top" id="ad-top">
      <span class="ad-label">こうこく</span>
      <div class="ad-placeholder">
        <span>🎮 たのしいゲームがいっぱい！</span>
      </div>
    </div>

    <div class="gallery-body" id="gallery-body">
      <!-- ギャラリーグリッド or Empty State -->
    </div>

    <!-- アフィリエイトバナー（実製品Divoom連携） -->
    <div class="affiliate-banner" id="affiliate-banner">
      <div class="affiliate-left">
        <div class="affiliate-title">📺 つくった絵をおへやにかざろう！</div>
        <div class="affiliate-desc">Divoomのピクセルクロックで光らせよう！</div>
      </div>
      <a href="https://www.amazon.co.jp/s?k=Divoom+pixel+clock" target="_blank" rel="noopener" class="btn btn-accent affiliate-btn">
        📦 みてみる
      </a>
    </div>

    <!-- 広告スロット（下）Google AdSense 常設 -->
    <div class="ad-slot ad-slot-bottom" id="ad-bottom">
      <span class="ad-label">こうこく</span>
      <div class="ad-placeholder">
        <span>🌟 ピクセルマジックアドベンチャー</span>
      </div>
    </div>

    <!-- 親向けパネル（知育オウンドメディア送客） -->
    <div class="parent-panel" id="parent-panel">
      <div class="parent-panel-title">📚 ほごしゃのかたへ</div>
      <a href="https://plyo.blog" target="_blank" rel="noopener" class="parent-link">
        ✏️ 子供の創造性を伸ばす声かけ術（plyo.blogで読む）
      </a>
    </div>

    <!-- モーダル（拡大・あそびなおす・ダウンロード）ソリッド完全不透明 -->
    <div class="modal-backdrop hidden" id="gallery-modal">
      <div class="modal-card">
        <button class="modal-close-btn" id="gallery-modal-close">✕</button>
        <img src="" id="gallery-modal-img" class="gallery-modal-img" alt="作品の拡大" />
        <h2 id="gallery-modal-title" class="gallery-modal-title"></h2>

        <div class="modal-actions">
          <button class="btn btn-success" id="gallery-modal-download">
            📥 画像をほぞんする
          </button>
          <button class="btn btn-primary" id="gallery-modal-replay">
            ▶ もう１回あそびなおす！
          </button>
        </div>
      </div>
    </div>
  `;let i=r.querySelector(`#gallery-sound-btn`);i.addEventListener(`click`,()=>{i.textContent=h.toggleMute()?`🔇`:`🔊`}),h.onMuteChange(e=>{i.textContent=e?`🔇`:`🔊`}),r.querySelector(`#gallery-back`).addEventListener(`click`,e),r.querySelector(`#gallery-modal-close`).addEventListener(`click`,()=>{r.querySelector(`#gallery-modal`).classList.add(`hidden`)});function s(){let e=r.querySelector(`#gallery-body`),i=a();if(i.length===0){e.innerHTML=`
        <div class="gallery-empty">
          <div class="gallery-empty-emoji">🎨</div>
          <div class="gallery-empty-text">まだ さくひんが ないよ！<br>まほうをかけて えをつくろう！</div>
          <button class="btn btn-primary" id="gallery-new">✨ はじめる</button>
        </div>
      `,e.querySelector(`#gallery-new`).addEventListener(`click`,t);return}e.innerHTML=`<div class="gallery-grid" id="gallery-grid"></div>`;let c=e.querySelector(`#gallery-grid`);i.forEach(e=>{let t=document.createElement(`div`);t.className=`gallery-card`,t.innerHTML=`
        <div class="gallery-img-wrap">
          <img src="${e.dataUrl}" class="gallery-img" alt="${e.title}" />
          <div class="gallery-card-badge">▶</div>
        </div>
        <div class="gallery-card-title">${e.title}</div>
        <button class="gallery-delete-btn" aria-label="削除">✕</button>
      `,t.addEventListener(`click`,()=>{h.playPop(2);let t=r.querySelector(`#gallery-modal`);t.querySelector(`#gallery-modal-img`).src=e.dataUrl,t.querySelector(`#gallery-modal-title`).textContent=e.title;let i=t.querySelector(`#gallery-modal-replay`),a=i.cloneNode(!0);i.replaceWith(a),a.addEventListener(`click`,()=>{t.classList.add(`hidden`),n&&n(e)});let o=t.querySelector(`#gallery-modal-download`),s=o.cloneNode(!0);o.replaceWith(s),s.addEventListener(`click`,()=>{let t=document.createElement(`a`);t.href=e.dataUrl,t.download=`${e.title||`pixelmagic`}.png`,document.body.appendChild(t),t.click(),document.body.removeChild(t)}),t.classList.remove(`hidden`)}),t.querySelector(`.gallery-delete-btn`).addEventListener(`click`,t=>{t.stopPropagation(),confirm(`このえを けしますか？`)&&(o(e.id),s())}),c.appendChild(t)})}return r._refresh=s,r}var D=`
/* ====== GalleryScreen ====== */
#screen-gallery {
  background: #1A1A2E;
  overflow-y: auto;
}

/* Ad slots (ソリッド色) */
.ad-slot {
  background: #0E1424;
  border-top: 3px solid #0A0E17;
  border-bottom: 3px solid #0A0E17;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 54px;
  flex-shrink: 0;
  position: relative;
  padding: 6px;
}

.ad-label {
  font-size: 0.65rem;
  font-weight: 900;
  color: #A0AABA;
  position: absolute;
  top: 3px;
  right: 8px;
}

.ad-placeholder {
  color: #FFD60A;
  font-size: 0.85rem;
  font-weight: 900;
}

/* Gallery body */
.gallery-body {
  flex: 1;
  padding: 14px;
  max-width: 480px;
  width: 100%;
  margin: 0 auto;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

/* Gallery card (Divoomピクセルモニターのようなソリッド発光アニメーション) */
.gallery-card {
  position: relative;
  background: #16213E;
  border-radius: 18px;
  overflow: hidden;
  border: 4px solid #FFD60A;
  box-shadow: 0 6px 0 #0A0E17;
  cursor: pointer;
  transition: transform 0.12s ease;
  animation: pixelBorderGlow 2.5s infinite;
}

@keyframes pixelBorderGlow {
  0%, 100% { border-color: #FFD60A; }
  33%       { border-color: #FF6B35; }
  66%       { border-color: #06D6A0; }
}

.gallery-card:active {
  transform: translateY(3px);
  box-shadow: 0 3px 0 #0A0E17;
}

.gallery-card:nth-child(2n) { animation-delay: 0.4s; }
.gallery-card:nth-child(3n) { animation-delay: 0.8s; }

.gallery-img-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  background: #0A0E17;
}

.gallery-img {
  width: 100%;
  height: 100%;
  display: block;
  image-rendering: pixelated;
  object-fit: cover;
}

.gallery-card-badge {
  position: absolute;
  bottom: 6px;
  right: 6px;
  background: #3A86FF;
  color: #FFFFFF;
  border: 2px solid #0A0E17;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  font-size: 0.85rem;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 0 #0A0E17;
}

.gallery-card-title {
  background: #0F3460;
  color: #FFD60A;
  font-size: 0.9rem;
  font-weight: 900;
  padding: 8px 10px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-top: 3px solid #0A0E17;
}

.gallery-delete-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  background: #EF233C;
  color: #FFFFFF;
  border: 2px solid #0A0E17;
  border-radius: 50%;
  width: 26px;
  height: 26px;
  font-size: 0.75rem;
  font-weight: 900;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 0 #0A0E17;
  z-index: 5;
}

/* Empty State */
.gallery-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 40px 16px;
  text-align: center;
}

.gallery-empty-emoji {
  font-size: 4rem;
  animation: float 2.5s ease-in-out infinite;
}

.gallery-empty-text {
  font-size: 1.15rem;
  font-weight: 900;
  color: #A0AABA;
  line-height: 1.6;
}

/* Affiliate Banner */
.affiliate-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: #16213E;
  border-top: 4px solid #7B2FBE;
  border-bottom: 4px solid #7B2FBE;
  flex-shrink: 0;
  max-width: 480px;
  width: 100%;
  margin: 0 auto;
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
  font-weight: 900;
  color: #A0AABA;
}

.affiliate-btn {
  flex-shrink: 0;
  font-size: 0.95rem;
  padding: 10px 18px;
  text-decoration: none;
}

/* Parent Panel */
.parent-panel {
  padding: 14px 16px;
  background: #0E1424;
  border-top: 3px solid #0A0E17;
  flex-shrink: 0;
  max-width: 480px;
  width: 100%;
  margin: 0 auto;
}

.parent-panel-title {
  font-size: 0.85rem;
  font-weight: 900;
  color: #FFD60A;
  margin-bottom: 6px;
}

.parent-link {
  display: block;
  color: #4CC9F0;
  font-size: 0.9rem;
  font-weight: 900;
  text-decoration: none;
  padding: 10px 14px;
  background: #16213E;
  border-radius: 12px;
  border: 3px solid #4CC9F0;
  box-shadow: 0 4px 0 #0A0E17;
}

.parent-link:hover {
  background: #0F3460;
}

.gallery-modal-img {
  width: 220px;
  height: 220px;
  object-fit: cover;
  image-rendering: pixelated;
  border-radius: 16px;
  border: 4px solid #0A0E17;
  margin-bottom: 12px;
}

.gallery-modal-title {
  color: #FFD60A;
  font-size: 1.5rem;
  font-weight: 900;
  margin-bottom: 16px;
}
`;function O(){return p()||``}async function k(e){let t=O();if(!t)return M(e);let n=`あなたは子供向けアプリのAIアシスタントです。
ユーザーの入力テキストを確認して、子供向けに安全かどうか判定し、画像生成プロンプトを作成してください。
以下の形式の有効なJSONのみを出力してください（Markdownコードブロックは不要、余計な説明文は一切含めないでください）：
{
  "safe": trueまたはfalse,
  "prompt": "英語のプロンプト",
  "message": "日本語のメッセージ"
}

プロンプトのルール:
- 「a very simple 2D flat vector icon of a [subject], thick black outlines, bold solid colors, isolated on pure white background, no shading, no details, child friendly, cute, minimalist」を必ず基本構成にしてください。
- 16x16のドット絵に変換するため、写真や複雑な絵、グラデーションは絶対にNGです。
- 危険な言葉や不適切な言葉が含まれる場合は safe: false にしてください。

入力テキスト:「${e}」`;try{let r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${t}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({contents:[{parts:[{text:n}]}],generationConfig:{response_mime_type:`application/json`,temperature:.4}})});if(!r.ok)return console.warn(`Gemini API returned ${r.status}, falling back to mock.`),M(e);let i=((await r.json())?.candidates?.[0]?.content?.parts?.[0]?.text||``).replace(/```json/g,``).replace(/```/g,``).trim();return JSON.parse(i)}catch(t){return console.error(`Gemini API error, using mock:`,t),M(e)}}async function A(e){let t=O();if(!t)return N(e);try{let n=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${t}`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({instances:[{prompt:`${e}, extremely simple flat 2D icon, pure white background, bold outlines, solid bright colors, no gradients, minimal vector style`}],parameters:{sampleCount:1,aspectRatio:`1:1`}})});if(!n.ok)return console.warn(`Imagen API error ${n.status}, using mock`),N(e);let r=(await n.json())?.predictions?.[0]?.bytesBase64Encoded;return r?`data:image/png;base64,${r}`:N(e)}catch(t){return console.error(`Image API error, using mock:`,t),N(e)}}var j=[`死`,`殺`,`血`,`こわい`,`ばか`,`アホ`,`うんこ`,`うんち`,`戦争`,`銃`,`ナイフ`];function M(e){for(let t of j)if(e.includes(t))return{safe:!1,prompt:``,message:`そのことばは まほうにつかえないよ！
たのしいことばにしてみてね！`};return{safe:!0,prompt:e,message:`「${e}」のまほうをかけるよ！\nちょっとまっててね！✨`}}async function N(e){let t=x(e),n=document.createElement(`canvas`);n.width=128,n.height=128;let r=n.getContext(`2d`),i=128/t.gridSize;for(let e=0;e<t.gridSize;e++)for(let n=0;n<t.gridSize;n++){let a=t.grid[e][n];r.fillStyle=t.palette[a.colorIndex]||`#1A1A2E`,r.fillRect(n*i,e*i,i,i)}return n.toDataURL(`image/png`)}var P=16;async function F(e,t=8,n=P){let r=await I(e),i=document.createElement(`canvas`);i.width=n,i.height=n;let a=i.getContext(`2d`);a.drawImage(r,0,0,n,n);let o=a.getImageData(0,0,n,n).data,s=[];for(let e=0;e<o.length;e+=4)o[e+3]<50?s.push([26,26,46]):s.push([o[e],o[e+1],o[e+2]]);let c=ee(s,t),l=[];for(let e=0;e<n;e++){let t=[];for(let r=0;r<n;r++){let i=s[e*n+r],a=L(i,c);t.push({colorIndex:a,solved:!1})}l.push(t)}return{palette:c.map(([e,t,n])=>R(e,t,n)),grid:l,gridSize:n}}function I(e){return new Promise((t,n)=>{let r=new Image;e.startsWith(`data:`)||(r.crossOrigin=`anonymous`),r.onload=()=>t(r),r.onerror=t=>n(Error(`Failed to load image: `+e)),r.src=e})}function ee(e,t,n=20){if(e.length===0)return[[0,0,0]];let r=Math.min(t,e.length),i=[],a=Math.floor(e.length/r);for(let t=0;t<r;t++)i.push([...e[t*a]]);let o=Array(e.length).fill(0);for(let t=0;t<n;t++){let t=!1;for(let n=0;n<e.length;n++){let r=L(e[n],i);r!==o[n]&&(o[n]=r,t=!0)}if(!t)break;let n=Array.from({length:r},()=>[0,0,0]),a=Array(r).fill(0);for(let t=0;t<e.length;t++){let r=o[t];n[r][0]+=e[t][0],n[r][1]+=e[t][1],n[r][2]+=e[t][2],a[r]++}for(let e=0;e<r;e++)a[e]>0&&(i[e]=[Math.round(n[e][0]/a[e]),Math.round(n[e][1]/a[e]),Math.round(n[e][2]/a[e])])}return i}function L(e,t){let n=1/0,r=0;for(let i=0;i<t.length;i++){let a=e[0]-t[i][0],o=e[1]-t[i][1],s=e[2]-t[i][2],c=a*a+o*o+s*s;c<n&&(n=c,r=i)}return r}function R(e,t,n){return`#`+[e,t,n].map(e=>e.toString(16).padStart(2,`0`)).join(``).toUpperCase()}function z(e=`ねこ`){return x(e)}var B=document.createElement(`style`);B.textContent=[_,C,T,D].join(`
`),document.head.appendChild(B);function V(){try{let e=c();e&&e.puzzleData?(X(`puzzle`),q._initPuzzle(e.puzzleData,e.title||`つづき`)):$(`つづきのデータがありませんでした！`)}catch(e){console.error(e),$(`復元エラーが発生しました`)}}var H=document.getElementById(`app`),U=document.createElement(`div`);U.className=`loading-overlay hidden`,U.innerHTML=`
  <div class="loading-spinner"></div>
  <div class="loading-text" id="loading-msg">よみこみちゅう…</div>
`,document.body.appendChild(U);var W=document.createElement(`div`);W.className=`toast hidden`,document.body.appendChild(W);var G=g({onStart:()=>X(`spell`),onGallery:()=>X(`gallery`),onResume:V}),K=S({onBack:()=>X(`home`),onGenerate:te}),q=w({onBack:()=>X(`home`),onComplete:()=>X(`gallery`)}),J=E({onBack:()=>X(`home`),onNewArt:()=>X(`spell`),onReplay:ne});H.appendChild(G),H.appendChild(K),H.appendChild(q),H.appendChild(J);var Y={home:G,spell:K,puzzle:q,gallery:J};function X(e){Object.values(Y).forEach(e=>e.classList.remove(`active`)),Y[e]&&Y[e].classList.add(`active`);let t=document.getElementById(`global-ad-container`);t&&(e===`puzzle`?t.style.display=`none`:t.style.display=`block`),e===`gallery`?J._refresh():e===`home`&&G._refresh?G._refresh():e===`spell`&&K._refresh&&K._refresh()}X(`home`);async function te(e){re(`「${e}」のえを つくっているよ！\nまほうをかけているよ…✨`);try{let{safe:t,prompt:n,message:r}=await k(e);if(!t){Q(),$(r||`そのことばは つかえないよ！`);return}Z(`えをかいてるよ✏️
もうすこし まってね！`);let i=await A(n);Z(`パズルをつくっているよ🧩`);let a;try{a=await F(i,8,16)}catch(t){console.warn(`pixelateImage fallback to preset:`,t),a=z(e)}Q(),X(`puzzle`),q._initPuzzle(a,e)}catch(t){console.error(`Generation error:`,t),Q();let n=z(e);X(`puzzle`),q._initPuzzle(n,e),$(`AIがおやすみ中💤
おためしパズルで あそぼう！`)}}function ne(e){let t=e.grid.map(e=>e.map(e=>({...e,solved:!1}))),n={palette:e.palette,grid:t,gridSize:t.length};X(`puzzle`),q._initPuzzle(n,e.title)}function re(e){U.querySelector(`#loading-msg`).innerHTML=e.replace(/\n/g,`<br>`),U.classList.remove(`hidden`)}function Z(e){U.querySelector(`#loading-msg`).innerHTML=e.replace(/\n/g,`<br>`)}function Q(){U.classList.add(`hidden`)}function $(e){W.textContent=e,W.classList.remove(`hidden`),setTimeout(()=>W.classList.add(`hidden`),3e3)}