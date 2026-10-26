(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))o(r);new MutationObserver(r=>{for(const n of r)if(n.type==="childList")for(const a of n.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&o(a)}).observe(document,{childList:!0,subtree:!0});function i(r){const n={};return r.integrity&&(n.integrity=r.integrity),r.referrerPolicy&&(n.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?n.credentials="include":r.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function o(r){if(r.ep)return;r.ep=!0;const n=i(r);fetch(r.href,n)}})();const nt=new Map;let ne=null;function W(e,t){nt.set(e,t)}function G(e,t){const i=t?"?"+Object.entries(t).map(([o,r])=>`${o}=${encodeURIComponent(r)}`).join("&"):"";window.location.hash=`/${e}${i}`}function Y(){if(!ne&&(ne=document.getElementById("app"),!ne))throw new Error("App container not found");return ne}function St(){const e=window.location.hash.slice(1)||"/home",[t,i]=e.split("?"),o=t.replace("/","")||"home",r={};return i&&i.split("&").forEach(n=>{const[a,s]=n.split("=");a&&(r[a]=decodeURIComponent(s||""))}),{route:o,params:r}}function Fe(){const{route:e,params:t}=St(),i=nt.get(e);if(i){const r=Y().querySelector(".screen");r?(r.classList.add("screen-exit"),setTimeout(()=>{i(t)},200)):i(t)}else G("home")}function $t(){window.addEventListener("hashchange",Fe),Fe()}function ie(e){const{showBack:t=!1,showCooldown:i=!0,title:o="ビジュアルタイマー"}=e??{};return`
    <header class="header" role="banner">
      ${t?`<button class="header__back" data-action="back" aria-label="もどる">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15,18 9,12 15,6"/>
        </svg>
      </button>`:'<div class="header__spacer"></div>'}
      <h1 class="header__title">${o}</h1>
      ${i?`<button class="header__cooldown" data-action="cooldown" aria-label="おちつく">
        <span class="header__cooldown-text">おちつく</span>
        <svg viewBox="0 0 32 32" width="24" height="24">
          <!-- Bubble icon -->
          <circle cx="16" cy="14" r="10" fill="none" stroke="#7dd3fc" stroke-width="2" opacity="0.8"/>
          <circle cx="16" cy="14" r="10" fill="#e0f2fe" opacity="0.3"/>
          <ellipse cx="13" cy="11" rx="3" ry="2" fill="#fff" opacity="0.6" transform="rotate(-20, 13, 11)"/>
          <!-- Small bubbles -->
          <circle cx="24" cy="22" r="3.5" fill="none" stroke="#7dd3fc" stroke-width="1.5" opacity="0.6"/>
          <circle cx="24" cy="22" r="3.5" fill="#e0f2fe" opacity="0.2"/>
          <circle cx="28" cy="28" r="2" fill="none" stroke="#7dd3fc" stroke-width="1" opacity="0.4"/>
        </svg>
      </button>`:'<div class="header__spacer"></div>'}
    </header>
    <style>
      .header {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 100;
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 56px;
        padding: 0 12px;
        padding-top: env(safe-area-inset-top, 0px);
        background: rgba(255, 255, 255, 0.72);
        backdrop-filter: blur(16px) saturate(180%);
        -webkit-backdrop-filter: blur(16px) saturate(180%);
        border-bottom: 1px solid rgba(255, 255, 255, 0.3);
        box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06);
        font-family: 'M PLUS Rounded 1c', sans-serif;
        box-sizing: border-box;
      }

      .header__back {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border: none;
        background: rgba(0, 0, 0, 0.04);
        border-radius: 12px;
        color: #6b7280;
        cursor: pointer;
        transition: all 0.2s ease;
        -webkit-tap-highlight-color: transparent;
        flex-shrink: 0;
      }

      .header__back:hover {
        background: rgba(0, 0, 0, 0.08);
        color: #374151;
      }

      .header__back:active {
        transform: scale(0.92);
        background: rgba(0, 0, 0, 0.12);
      }

      .header__title {
        flex: 1;
        text-align: center;
        font-size: 1.1rem;
        font-weight: 700;
        color: #374151;
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        padding: 0 8px;
      }

      .header__cooldown {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 0 8px 0 12px;
        height: 38px;
        border: none;
        background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
        border-radius: 19px;
        cursor: pointer;
        transition: all 0.3s ease;
        -webkit-tap-highlight-color: transparent;
        flex-shrink: 0;
        position: relative;
        box-shadow: 0 2px 8px rgba(125, 211, 252, 0.3);
      }

      .header__cooldown-text {
        font-size: 0.75rem;
        font-weight: 800;
        color: #0369a1;
        font-family: 'M PLUS Rounded 1c', sans-serif;
      }

      .header__cooldown:hover {
        transform: scale(1.05);
        box-shadow: 0 3px 12px rgba(125, 211, 252, 0.4);
      }

      .header__cooldown:active {
        transform: scale(0.95);
      }

      /* Pulse animation to draw attention */
      .header__cooldown::after {
        content: '';
        position: absolute;
        inset: -3px;
        border-radius: 22px;
        border: 2px solid rgba(125, 211, 252, 0.5);
        animation: cooldownPulse 2.5s ease-in-out infinite;
      }

      @keyframes cooldownPulse {
        0%, 100% {
          transform: scale(1);
          opacity: 0.6;
        }
        50% {
          transform: scale(1.15);
          opacity: 0;
        }
      }

      .header__spacer {
        width: 40px;
        height: 40px;
        flex-shrink: 0;
      }

      /* Account for header fixed height in page content */
      .header + * {
        padding-top: calc(56px + env(safe-area-inset-top, 0px));
      }
    </style>
  `}function oe(e){const t=e.querySelector('[data-action="back"]');t&&t.addEventListener("click",o=>{o.preventDefault(),window.history.length>1?window.history.back():window.location.hash="#/home"});const i=e.querySelector('[data-action="cooldown"]');i&&i.addEventListener("click",o=>{o.preventDefault(),window.location.hash="#/cooldown"})}function at(e,t){const{id:i,name:o,emoji:r,description:n,colors:a}=e,s=e.renderIllustration(.5);return`
    <button class="theme-card ${t?"theme-card--selected":""}" data-theme="${i}" aria-pressed="${t}" aria-label="${o}テーマ">
      <div class="theme-card__preview" style="background: linear-gradient(135deg, ${a.bg} 0%, ${a.primary}22 100%);">
        <div class="theme-card__illustration">
          ${s}
        </div>
      </div>
      <div class="theme-card__info">
        <span class="theme-card__name">
          <span class="theme-card__emoji">${r}</span>
          ${o}
        </span>
        <span class="theme-card__desc">${n}</span>
      </div>
      ${t?'<div class="theme-card__check">✓</div>':""}
    </button>
    <style>
      .theme-card {
        display: flex;
        flex-direction: column;
        width: 280px;
        height: 200px;
        border-radius: 24px;
        overflow: hidden;
        border: 3px solid transparent;
        background: #fff;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        font-family: 'M PLUS Rounded 1c', sans-serif;
        position: relative;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        -webkit-tap-highlight-color: transparent;
        padding: 0;
        text-align: left;
      }

      .theme-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      }

      .theme-card:active {
        transform: translateY(-2px) scale(0.98);
      }

      .theme-card--selected {
        border-color: var(--theme-primary, #6c3ce0);
        transform: scale(1.02);
        box-shadow: 0 8px 28px rgba(108, 60, 224, 0.2);
      }

      .theme-card--selected:hover {
        transform: scale(1.02) translateY(-2px);
      }

      .theme-card__preview {
        flex: 1;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 0;
        padding: 8px;
      }

      .theme-card__illustration {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }

      .theme-card__illustration svg {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      .theme-card__info {
        padding: 10px 16px 14px;
        display: flex;
        flex-direction: column;
        gap: 2px;
        background: #fff;
      }

      .theme-card__name {
        font-size: 1.1rem;
        font-weight: 700;
        color: #374151;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .theme-card__emoji {
        font-size: 1.3rem;
        line-height: 1;
      }

      .theme-card__desc {
        font-size: 0.8rem;
        color: #9ca3af;
        font-weight: 400;
      }

      .theme-card__check {
        position: absolute;
        top: 10px;
        right: 10px;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: var(--theme-primary, #6c3ce0);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 700;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        animation: checkPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      @keyframes checkPop {
        0% {
          transform: scale(0);
          opacity: 0;
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }

      /* Responsive adjustments */
      @media (max-width: 360px) {
        .theme-card {
          width: 100%;
          max-width: 280px;
          height: 180px;
        }
      }
    </style>
  `}const Tt={id:"space",name:"うちゅうひこう",emoji:"🚀",description:"ロケットにのって ちきゅうをめざそう！",colors:{primary:"#0f0a2e",secondary:"#6c3ce0",bg:"#0f0a2e",accent:"#ff6b35"},speechTriggerKey:"space",renderIllustration(e){const t=Math.max(0,Math.min(1,e)),i=60+t*250,o=150-Math.sin(t*Math.PI)*30,r=15+t*40,n=.3+t*.7;let a="";[[20,30],[80,60],[150,20],[210,70],[260,25],[320,50],[370,30],[45,90],[130,80],[290,85],[55,130],[170,110],[240,130],[350,120],[100,140],[30,180],[190,175],[310,170],[380,180],[70,210],[160,220],[250,200],[340,215],[120,250],[280,250],[50,270],[200,280],[360,260],[90,160],[330,100]].forEach(([x,z],v)=>{const b=v%3===0?2.5:1.5,y=v*.3%3;a+=`<circle cx="${x}" cy="${z}" r="${b}" fill="#fff" opacity="0.8">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" begin="${y}s" repeatCount="indefinite"/>
      </circle>`});const l=t<.4?1:Math.max(0,1-(t-.4)*5),p=t<.6?1:Math.max(0,1-(t-.6)*5),h=`
      <g opacity="${l}" transform="translate(180, 80)">
        <circle cx="0" cy="0" r="14" fill="#e8a87c"/>
        <ellipse cx="0" cy="0" rx="24" ry="6" fill="none" stroke="#dda15e" stroke-width="2" transform="rotate(-15)"/>
        <circle cx="-4" cy="-4" r="3" fill="#d4845f" opacity="0.5"/>
      </g>`,c=`
      <g opacity="${p}" transform="translate(250, 200)">
        <ellipse cx="0" cy="0" rx="10" ry="8" fill="#8d8d8d" transform="rotate(20)"/>
        <circle cx="-3" cy="-2" r="2" fill="#6b6b6b"/>
        <circle cx="3" cy="1" r="1.5" fill="#6b6b6b"/>
      </g>`,d=15+Math.sin(Date.now()*.01)*5,u=`
      <g transform="translate(${i-22}, ${o})">
        <polygon points="0,0 -${d},-4 -${d+5},0 -${d},4" fill="#ff6b35" opacity="0.9">
          <animate attributeName="opacity" values="0.6;1;0.6" dur="0.3s" repeatCount="indefinite"/>
        </polygon>
        <polygon points="0,0 -${d*.6},-2 -${d*.7},0 -${d*.6},2" fill="#ffd700" opacity="0.8">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="0.2s" repeatCount="indefinite"/>
        </polygon>
      </g>`,f=`
      <g transform="translate(${i}, ${o})">
        <!-- Body -->
        <rect x="-15" y="-8" width="30" height="16" rx="8" fill="#e0e0e0"/>
        <!-- Nose cone -->
        <polygon points="15,-8 15,8 28,0" fill="#ff6b35"/>
        <!-- Window -->
        <circle cx="5" cy="0" r="5" fill="#38bdf8"/>
        <circle cx="5" cy="0" r="3.5" fill="#7dd3fc"/>
        <!-- Fins -->
        <polygon points="-15,-8 -20,-16 -10,-8" fill="#6c3ce0"/>
        <polygon points="-15,8 -20,16 -10,8" fill="#6c3ce0"/>
        <!-- Stripe -->
        <rect x="-8" y="-8" width="3" height="16" fill="#ff6b35" opacity="0.6"/>
      </g>`,g=`
      <g transform="translate(350, 150)">
        <circle cx="0" cy="0" r="${r}" fill="#38bdf8" opacity="${n}"/>
        <circle cx="0" cy="0" r="${r}" fill="none" stroke="#7dd3fc" stroke-width="1.5" opacity="${n}"/>
        <!-- Continents -->
        <ellipse cx="-${r*.2}" cy="-${r*.1}" rx="${r*.3}" ry="${r*.25}" fill="#4ade80" opacity="${n*.8}"/>
        <ellipse cx="${r*.15}" cy="${r*.2}" rx="${r*.2}" ry="${r*.15}" fill="#4ade80" opacity="${n*.7}"/>
        <!-- Atmosphere glow -->
        <circle cx="0" cy="0" r="${r+3}" fill="none" stroke="#7dd3fc" stroke-width="2" opacity="${n*.3}"/>
      </g>`;let T="";if(t>=.95){const x=Math.min(1,(t-.95)*20);[[320,100],[360,120],[340,180],[310,160],[370,90],[330,200],[300,130],[380,160]].forEach(([v,b],y)=>{const m=3+y%3;T+=`
          <g transform="translate(${v}, ${b})" opacity="${x}">
            <line x1="-${m}" y1="0" x2="${m}" y2="0" stroke="#ffd700" stroke-width="2"/>
            <line x1="0" y1="-${m}" x2="0" y2="${m}" stroke="#ffd700" stroke-width="2"/>
            <line x1="-${m*.7}" y1="-${m*.7}" x2="${m*.7}" y2="${m*.7}" stroke="#ffd700" stroke-width="1.5"/>
            <line x1="${m*.7}" y1="-${m*.7}" x2="-${m*.7}" y2="${m*.7}" stroke="#ffd700" stroke-width="1.5"/>
            <animate attributeName="opacity" values="${x};${x*.3};${x}" dur="0.8s" begin="${y*.1}s" repeatCount="indefinite"/>
          </g>`})}return`<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;">
      <!-- Deep space background -->
      <defs>
        <radialGradient id="spaceBg" cx="80%" cy="50%" r="60%">
          <stop offset="0%" stop-color="#1a1040"/>
          <stop offset="100%" stop-color="#0f0a2e"/>
        </radialGradient>
      </defs>
      <rect width="400" height="300" fill="url(#spaceBg)"/>
      <!-- Nebula glow -->
      <ellipse cx="200" cy="150" rx="180" ry="100" fill="#6c3ce0" opacity="0.06"/>
      <!-- Stars -->
      ${a}
      <!-- Celestial bodies -->
      ${h}
      ${c}
      <!-- Earth destination -->
      ${g}
      <!-- Exhaust -->
      ${u}
      <!-- Rocket -->
      ${f}
      <!-- Celebration -->
      ${T}
    </svg>`},renderStamp(e){return e?`<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;">
        <defs>
          <linearGradient id="goldStar" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffd700"/>
            <stop offset="50%" stop-color="#ffec80"/>
            <stop offset="100%" stop-color="#ffd700"/>
          </linearGradient>
          <filter id="starGlow">
            <feGaussianBlur stdDeviation="2" result="glow"/>
            <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <!-- Star shape -->
        <polygon points="30,6 36,22 54,22 40,32 45,50 30,40 15,50 20,32 6,22 24,22"
          fill="url(#goldStar)" stroke="#e6a800" stroke-width="1" filter="url(#starGlow)"/>
        <!-- Sparkle top-right -->
        <line x1="46" y1="8" x2="50" y2="8" stroke="#fff" stroke-width="1.5" opacity="0.9"/>
        <line x1="48" y1="6" x2="48" y2="10" stroke="#fff" stroke-width="1.5" opacity="0.9"/>
        <!-- Sparkle bottom-left -->
        <line x1="10" y1="44" x2="14" y2="44" stroke="#ffd700" stroke-width="1" opacity="0.7"/>
        <line x1="12" y1="42" x2="12" y2="46" stroke="#ffd700" stroke-width="1" opacity="0.7"/>
      </svg>`:`<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;">
      <defs>
        <linearGradient id="silverStar" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#c0c0c0"/>
          <stop offset="50%" stop-color="#e8e8e8"/>
          <stop offset="100%" stop-color="#c0c0c0"/>
        </linearGradient>
      </defs>
      <!-- Star outline -->
      <polygon points="30,10 35,23 50,23 38,32 42,46 30,38 18,46 22,32 10,23 25,23"
        fill="url(#silverStar)" stroke="#a0a0a0" stroke-width="1.5" stroke-dasharray="3,2"/>
      <!-- Effort marks -->
      <line x1="46" y1="10" x2="50" y2="6" stroke="#a0a0a0" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="49" y1="12" x2="53" y2="8" stroke="#a0a0a0" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`},renderStampDecoration(){let e="";const t=[[60,50],[200,40],[340,55],[80,140],[200,150],[320,135],[60,230],[200,240],[340,225]];[[0,1],[1,2],[0,3],[1,4],[2,5],[3,4],[4,5],[3,6],[4,7],[5,8],[6,7],[7,8]].forEach(([r,n])=>{const[a,s]=t[r],[l,p]=t[n];e+=`<line x1="${a}" y1="${s}" x2="${l}" y2="${p}" 
        stroke="#6c3ce0" stroke-width="1" stroke-dasharray="4,6" opacity="0.4"/>`});let o="";return t.forEach(([r,n],a)=>{o+=`<circle cx="${r}" cy="${n}" r="3" fill="#ffd700" opacity="0.5">
        <animate attributeName="opacity" values="0.3;0.7;0.3" dur="3s" begin="${a*.3}s" repeatCount="indefinite"/>
      </circle>`}),`<svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;position:absolute;top:0;left:0;pointer-events:none;">
      ${e}
      ${o}
    </svg>`}},Mt={id:"cleanup",name:"おかたづけ",emoji:"🧹",description:"おへやをピカピカにしよう！",colors:{primary:"#4facfe",secondary:"#43e97b",bg:"#fff8e7",accent:"#c4956a"},speechTriggerKey:"cleanup",renderIllustration(e){const t=Math.max(0,Math.min(1,e)),i=`
      <!-- Back wall -->
      <rect x="20" y="20" width="360" height="200" fill="#fff8e7" rx="4"/>
      <!-- Wall decoration - stripe -->
      <rect x="20" y="20" width="360" height="8" fill="#f0e6d0"/>
      <!-- Floor -->
      <rect x="10" y="220" width="380" height="80" fill="#deb887" rx="2"/>
      <!-- Floor boards -->
      <line x1="10" y1="250" x2="390" y2="250" stroke="#c4956a" stroke-width="0.5" opacity="0.4"/>
      <line x1="10" y1="270" x2="390" y2="270" stroke="#c4956a" stroke-width="0.5" opacity="0.4"/>`,o=`
      <g transform="translate(280, 45)">
        <rect x="0" y="0" width="70" height="70" rx="4" fill="#87ceeb" stroke="#c4956a" stroke-width="3"/>
        <line x1="35" y1="0" x2="35" y2="70" stroke="#c4956a" stroke-width="2"/>
        <line x1="0" y1="35" x2="70" y2="35" stroke="#c4956a" stroke-width="2"/>
        <!-- Sun -->
        <circle cx="55" cy="20" r="12" fill="#ffd700"/>
        <g stroke="#ffd700" stroke-width="1.5" stroke-linecap="round">
          <line x1="55" y1="4" x2="55" y2="1"/>
          <line x1="55" y1="36" x2="55" y2="39"/>
          <line x1="39" y1="20" x2="36" y2="20"/>
          <line x1="71" y1="20" x2="74" y2="20"/>
        </g>
      </g>`,r=`
      <g transform="translate(30, 60)">
        <!-- Shelf frame -->
        <rect x="0" y="0" width="80" height="150" fill="none" stroke="#c4956a" stroke-width="3" rx="3"/>
        <!-- Shelf boards -->
        <line x1="0" y1="50" x2="80" y2="50" stroke="#c4956a" stroke-width="3"/>
        <line x1="0" y1="100" x2="80" y2="100" stroke="#c4956a" stroke-width="3"/>
        <!-- Back panel -->
        <rect x="1.5" y="1.5" width="77" height="147" fill="#f5e6d0" opacity="0.5" rx="2"/>
      </g>`,n=`
      <g transform="translate(150, 170)">
        <rect x="0" y="0" width="70" height="50" rx="5" fill="#ff9a76" stroke="#e07050" stroke-width="2"/>
        <rect x="-2" y="-5" width="74" height="10" rx="3" fill="#e07050"/>
        <text x="35" y="32" text-anchor="middle" fill="#fff" font-size="10" font-family="'M PLUS Rounded 1c', sans-serif" font-weight="700">おもちゃ</text>
      </g>`,a=t<.15,h=`
      <g transform="translate(${a?200:170}, ${a?255:182}) scale(${a?1:.8})" opacity="${t>=1?1:.95}">
        <circle cx="0" cy="0" r="12" fill="#ff6b6b"/>
        <circle cx="-3" cy="-4" r="3" fill="#ff8a8a" opacity="0.6"/>
        <path d="M-8,4 Q0,8 8,4" fill="none" stroke="#e05555" stroke-width="1"/>
      </g>`,c=t<.3,g=`
      <g transform="translate(${c?130:42}, ${c?248:72}) rotate(${c?-15:0})">
        <rect x="0" y="0" width="22" height="30" rx="2" fill="#4facfe"/>
        <rect x="2" y="3" width="18" height="2" fill="#fff" opacity="0.5"/>
        <rect x="2" y="8" width="14" height="2" fill="#fff" opacity="0.3"/>
        <rect x="0" y="0" width="4" height="30" rx="1" fill="#3a8fe0"/>
      </g>`,T=t<.5,b=`
      <g transform="translate(${T?300:175}, ${T?245:182}) scale(${T?1:.7})">
        <!-- Body -->
        <circle cx="0" cy="5" r="12" fill="#c4956a"/>
        <!-- Head -->
        <circle cx="0" cy="-10" r="9" fill="#d4a574"/>
        <!-- Ears -->
        <circle cx="-8" cy="-17" r="4" fill="#c4956a"/>
        <circle cx="8" cy="-17" r="4" fill="#c4956a"/>
        <circle cx="-8" cy="-17" r="2.5" fill="#e8c9a8"/>
        <circle cx="8" cy="-17" r="2.5" fill="#e8c9a8"/>
        <!-- Eyes -->
        <circle cx="-3" cy="-11" r="1.5" fill="#333"/>
        <circle cx="3" cy="-11" r="1.5" fill="#333"/>
        <!-- Nose -->
        <ellipse cx="0" cy="-8" rx="2" ry="1.5" fill="#8b6f47"/>
        <!-- Mouth -->
        <path d="M-2,-6.5 Q0,-5 2,-6.5" fill="none" stroke="#8b6f47" stroke-width="0.8"/>
      </g>`,y=t<.7,bt=`
      <g transform="translate(${y?90:55}, ${y?252:115}) rotate(${y?25:0})">
        <!-- T-shirt -->
        <polygon points="0,-10 -15,-5 -15,5 -8,5 -8,15 8,15 8,5 15,5 15,-5" fill="#9b59b6"/>
        <!-- Collar -->
        <path d="M-4,-10 Q0,-7 4,-10" fill="none" stroke="#8e44ad" stroke-width="1.5"/>
        <!-- Star decoration -->
        <polygon points="0,0 1,3 4,3 2,5 3,8 0,6 -3,8 -2,5 -4,3 -1,3" fill="#ffd700" opacity="0.7" transform="scale(0.8)"/>
      </g>`,ke=t<.85,wt=`
      <g transform="translate(${ke?250:68}, ${ke?255:72}) rotate(${ke?10:0})">
        <rect x="0" y="0" width="18" height="28" rx="2" fill="#43e97b"/>
        <rect x="2" y="3" width="14" height="2" fill="#fff" opacity="0.4"/>
        <rect x="0" y="0" width="3" height="28" rx="1" fill="#2ecc71"/>
      </g>`;let He="";if(t>=.95){const re=Math.min(1,(t-.95)*20);[[100,140],[200,100],[300,130],[160,60],[250,80],[80,190],[320,200],[180,180]].forEach(([vt,kt],_t)=>{He+=`
          <g transform="translate(${vt}, ${kt})" opacity="${re}">
            <line x1="-4" y1="0" x2="4" y2="0" stroke="#ffd700" stroke-width="2" stroke-linecap="round"/>
            <line x1="0" y1="-4" x2="0" y2="4" stroke="#ffd700" stroke-width="2" stroke-linecap="round"/>
            <animate attributeName="opacity" values="${re};${re*.3};${re}" dur="1s" begin="${_t*.15}s" repeatCount="indefinite"/>
          </g>`})}return`<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;">
      ${i}
      ${o}
      ${r}
      ${n}
      ${h}
      ${g}
      ${wt}
      ${b}
      ${bt}
      ${He}
    </svg>`},renderStamp(e){return e?`<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;">
        <defs>
          <linearGradient id="cleanGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#43e97b"/>
            <stop offset="50%" stop-color="#7bf5a5"/>
            <stop offset="100%" stop-color="#43e97b"/>
          </linearGradient>
          <filter id="cleanGlow">
            <feGaussianBlur stdDeviation="1.5" result="glow"/>
            <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <!-- Star -->
        <polygon points="30,8 35,22 50,22 38,31 42,46 30,38 18,46 22,31 10,22 25,22"
          fill="url(#cleanGold)" stroke="#2ecc71" stroke-width="1" filter="url(#cleanGlow)"/>
        <!-- Broom -->
        <g transform="translate(42, 12) rotate(30)">
          <rect x="-1" y="0" width="2" height="14" fill="#c4956a" rx="0.5"/>
          <rect x="-3" y="14" width="6" height="5" fill="#deb887" rx="1"/>
          <line x1="-2" y1="16" x2="-2" y2="19" stroke="#c4956a" stroke-width="0.5"/>
          <line x1="0" y1="16" x2="0" y2="19" stroke="#c4956a" stroke-width="0.5"/>
          <line x1="2" y1="16" x2="2" y2="19" stroke="#c4956a" stroke-width="0.5"/>
        </g>
        <!-- Sparkles -->
        <g opacity="0.8">
          <line x1="10" y1="10" x2="14" y2="10" stroke="#ffd700" stroke-width="1.5"/>
          <line x1="12" y1="8" x2="12" y2="12" stroke="#ffd700" stroke-width="1.5"/>
          <line x1="48" y1="42" x2="52" y2="42" stroke="#ffd700" stroke-width="1.5"/>
          <line x1="50" y1="40" x2="50" y2="44" stroke="#ffd700" stroke-width="1.5"/>
        </g>
      </svg>`:`<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;">
      <defs>
        <linearGradient id="effortBadge" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffd6e0"/>
          <stop offset="100%" stop-color="#ffb3c6"/>
        </linearGradient>
      </defs>
      <!-- Badge circle -->
      <circle cx="30" cy="30" r="22" fill="url(#effortBadge)" stroke="#ff8fab" stroke-width="2" stroke-dasharray="4,2"/>
      <!-- Heart -->
      <path d="M30,38 C24,32 18,27 18,23 C18,19 21,17 24,17 C27,17 29,19 30,21 C31,19 33,17 36,17 C39,17 42,19 42,23 C42,27 36,32 30,38Z"
        fill="#ff6b8a" opacity="0.8"/>
      <!-- Effort marks -->
      <line x1="46" y1="14" x2="50" y2="10" stroke="#ff8fab" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="49" y1="16" x2="53" y2="12" stroke="#ff8fab" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`},renderStampDecoration(){return`<svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;position:absolute;top:0;left:0;pointer-events:none;">
      <!-- Wooden shelf borders -->
      <rect x="20" y="10" width="360" height="260" fill="none" stroke="#c4956a" stroke-width="3" rx="8" opacity="0.3"/>
      <!-- Horizontal shelves -->
      <line x1="20" y1="100" x2="380" y2="100" stroke="#c4956a" stroke-width="2" opacity="0.25"/>
      <line x1="20" y1="190" x2="380" y2="190" stroke="#c4956a" stroke-width="2" opacity="0.25"/>
      <!-- Vertical dividers -->
      <line x1="140" y1="10" x2="140" y2="270" stroke="#c4956a" stroke-width="1" opacity="0.15"/>
      <line x1="260" y1="10" x2="260" y2="270" stroke="#c4956a" stroke-width="1" opacity="0.15"/>
      <!-- Small decorative brackets at corners -->
      <path d="M28,18 L28,30 M28,18 L40,18" fill="none" stroke="#c4956a" stroke-width="1.5" opacity="0.4" stroke-linecap="round"/>
      <path d="M372,18 L372,30 M372,18 L360,18" fill="none" stroke="#c4956a" stroke-width="1.5" opacity="0.4" stroke-linecap="round"/>
      <path d="M28,262 L28,250 M28,262 L40,262" fill="none" stroke="#c4956a" stroke-width="1.5" opacity="0.4" stroke-linecap="round"/>
      <path d="M372,262 L372,250 M372,262 L360,262" fill="none" stroke="#c4956a" stroke-width="1.5" opacity="0.4" stroke-linecap="round"/>
    </svg>`}},Lt={id:"zoo",name:"どうぶつえん",emoji:"🦁",description:"どうぶつたちに あいにいこう！",colors:{primary:"#4ade80",secondary:"#38bdf8",bg:"#f0fdf4",accent:"#fb923c"},speechTriggerKey:"zoo",renderIllustration(e){const t=Math.max(0,Math.min(1,e)),i=`
      <defs>
        <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#87ceeb"/>
          <stop offset="60%" stop-color="#b8e4f9"/>
          <stop offset="100%" stop-color="#d4f0ff"/>
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#skyGrad)"/>`,o=`
      <g>
        <ellipse cx="80" cy="50" rx="40" ry="18" fill="#fff" opacity="0.85"/>
        <ellipse cx="60" cy="50" rx="25" ry="14" fill="#fff" opacity="0.85"/>
        <ellipse cx="100" cy="50" rx="25" ry="14" fill="#fff" opacity="0.85"/>

        <ellipse cx="300" cy="35" rx="35" ry="15" fill="#fff" opacity="0.8"/>
        <ellipse cx="280" cy="35" rx="22" ry="12" fill="#fff" opacity="0.8"/>
        <ellipse cx="320" cy="35" rx="22" ry="12" fill="#fff" opacity="0.8"/>

        <ellipse cx="200" cy="65" rx="28" ry="12" fill="#fff" opacity="0.7"/>
        <ellipse cx="185" cy="65" rx="18" ry="10" fill="#fff" opacity="0.7"/>
      </g>`,r=`
      <ellipse cx="200" cy="320" rx="250" ry="110" fill="#4ade80"/>
      <ellipse cx="200" cy="330" rx="250" ry="100" fill="#34d470"/>`,n=`
      <g>
        <rect x="20" y="195" width="3" height="30" fill="#92400e" rx="1"/>
        <rect x="55" y="195" width="3" height="30" fill="#92400e" rx="1"/>
        <rect x="90" y="195" width="3" height="30" fill="#92400e" rx="1"/>
        <rect x="310" y="195" width="3" height="30" fill="#92400e" rx="1"/>
        <rect x="345" y="195" width="3" height="30" fill="#92400e" rx="1"/>
        <rect x="380" y="195" width="3" height="30" fill="#92400e" rx="1"/>
        <!-- Horizontal rails -->
        <rect x="18" y="200" width="77" height="3" fill="#a0522d" rx="1"/>
        <rect x="18" y="215" width="77" height="3" fill="#a0522d" rx="1"/>
        <rect x="308" y="200" width="77" height="3" fill="#a0522d" rx="1"/>
        <rect x="308" y="215" width="77" height="3" fill="#a0522d" rx="1"/>
      </g>`,a=`
      <g transform="translate(340, 130)">
        <!-- Trunk -->
        <rect x="-6" y="30" width="12" height="50" fill="#92400e" rx="3"/>
        <!-- Canopy -->
        <circle cx="0" cy="15" r="28" fill="#22c55e"/>
        <circle cx="-15" cy="25" r="20" fill="#16a34a"/>
        <circle cx="15" cy="25" r="20" fill="#16a34a"/>
        <circle cx="0" cy="5" r="22" fill="#4ade80"/>
        <!-- Leaf details -->
        <circle cx="-8" cy="10" r="5" fill="#22c55e" opacity="0.6"/>
        <circle cx="10" cy="18" r="4" fill="#16a34a" opacity="0.5"/>
      </g>`,l=`
      <g transform="translate(80, 225)" opacity="${t>=.2?Math.min(1,(t-.2)*10):0}">
        <!-- Body -->
        <ellipse cx="0" cy="8" rx="12" ry="10" fill="#f5f5dc"/>
        <!-- Head -->
        <circle cx="0" cy="-5" r="9" fill="#fff5e6"/>
        <!-- Ears -->
        <ellipse cx="-5" cy="-22" rx="4" ry="12" fill="#fff5e6" transform="rotate(-10)"/>
        <ellipse cx="5" cy="-22" rx="4" ry="12" fill="#fff5e6" transform="rotate(10)"/>
        <ellipse cx="-5" cy="-22" rx="2.5" ry="9" fill="#ffb6c1" transform="rotate(-10)"/>
        <ellipse cx="5" cy="-22" rx="2.5" ry="9" fill="#ffb6c1" transform="rotate(10)"/>
        <!-- Eyes -->
        <circle cx="-3" cy="-6" r="2" fill="#333"/>
        <circle cx="3" cy="-6" r="2" fill="#333"/>
        <circle cx="-2.5" cy="-6.5" r="0.7" fill="#fff"/>
        <circle cx="3.5" cy="-6.5" r="0.7" fill="#fff"/>
        <!-- Nose -->
        <ellipse cx="0" cy="-3" rx="1.5" ry="1" fill="#ffb6c1"/>
        <!-- Whiskers -->
        <line x1="-9" y1="-4" x2="-4" y2="-3" stroke="#ccc" stroke-width="0.5"/>
        <line x1="-9" y1="-2" x2="-4" y2="-2" stroke="#ccc" stroke-width="0.5"/>
        <line x1="9" y1="-4" x2="4" y2="-3" stroke="#ccc" stroke-width="0.5"/>
        <line x1="9" y1="-2" x2="4" y2="-2" stroke="#ccc" stroke-width="0.5"/>
        <!-- Tail -->
        <circle cx="-10" cy="12" r="4" fill="#fff"/>
      </g>`,h=`
      <g transform="translate(330, 115)" opacity="${t>=.4?Math.min(1,(t-.4)*10):0}">
        <!-- Body (triangle-ish) -->
        <ellipse cx="0" cy="0" rx="8" ry="6" fill="#ff6b6b"/>
        <!-- Head -->
        <circle cx="8" cy="-4" r="5" fill="#ff8a8a"/>
        <!-- Eye -->
        <circle cx="9" cy="-5" r="1.5" fill="#333"/>
        <circle cx="9.5" cy="-5.5" r="0.5" fill="#fff"/>
        <!-- Beak -->
        <polygon points="13,-4 17,-3 13,-2" fill="#ffa500"/>
        <!-- Wing -->
        <ellipse cx="-3" cy="-2" rx="6" ry="4" fill="#e05555" transform="rotate(-15)"/>
        <!-- Tail feathers -->
        <polygon points="-8,0 -14,-4 -12,2" fill="#e05555"/>
        <!-- Legs -->
        <line x1="-2" y1="6" x2="-2" y2="10" stroke="#ffa500" stroke-width="1"/>
        <line x1="2" y1="6" x2="2" y2="10" stroke="#ffa500" stroke-width="1"/>
      </g>`,d=`
      <g transform="translate(200, 220)" opacity="${t>=.6?Math.min(1,(t-.6)*10):0}">
        <!-- Body -->
        <ellipse cx="0" cy="0" rx="28" ry="20" fill="#a0aec0"/>
        <!-- Head -->
        <circle cx="25" cy="-10" r="16" fill="#b0bec5"/>
        <!-- Ear -->
        <ellipse cx="35" cy="-8" rx="10" ry="14" fill="#90a4ae"/>
        <ellipse cx="35" cy="-8" rx="7" ry="10" fill="#cfd8dc"/>
        <!-- Eye -->
        <circle cx="30" cy="-12" r="2.5" fill="#333"/>
        <circle cx="30.5" cy="-12.5" r="0.8" fill="#fff"/>
        <!-- Trunk -->
        <path d="M38,-5 Q45,5 42,18 Q40,22 37,20" fill="none" stroke="#a0aec0" stroke-width="5" stroke-linecap="round"/>
        <!-- Legs -->
        <rect x="-18" y="14" width="8" height="18" fill="#90a4ae" rx="3"/>
        <rect x="-6" y="14" width="8" height="18" fill="#90a4ae" rx="3"/>
        <rect x="6" y="14" width="8" height="18" fill="#90a4ae" rx="3"/>
        <rect x="18" y="14" width="8" height="16" fill="#90a4ae" rx="3"/>
        <!-- Tail -->
        <path d="M-28,0 Q-35,-5 -32,-12" fill="none" stroke="#90a4ae" stroke-width="2" stroke-linecap="round"/>
        <!-- Tusk -->
        <path d="M36,-2 Q40,4 38,8" fill="none" stroke="#fff5e6" stroke-width="2" stroke-linecap="round"/>
      </g>`,f=`
      <g transform="translate(140, 235)" opacity="${t>=.8?Math.min(1,(t-.8)*10):0}">
        <!-- Body -->
        <ellipse cx="0" cy="5" rx="18" ry="14" fill="#f59e0b"/>
        <!-- Mane (rays) -->
        <circle cx="-20" cy="-8" r="16" fill="#d97706"/>
        ${Array.from({length:10},(x,z)=>{const v=(z*36-90)*Math.PI/180,b=-20+Math.cos(v)*20,y=-8+Math.sin(v)*20;return`<circle cx="${b}" cy="${y}" r="5" fill="#b45309" opacity="0.6"/>`}).join("")}
        <!-- Head -->
        <circle cx="-20" cy="-8" r="14" fill="#fbbf24"/>
        <!-- Eyes -->
        <circle cx="-24" cy="-10" r="2" fill="#333"/>
        <circle cx="-16" cy="-10" r="2" fill="#333"/>
        <circle cx="-23.5" cy="-10.5" r="0.7" fill="#fff"/>
        <circle cx="-15.5" cy="-10.5" r="0.7" fill="#fff"/>
        <!-- Nose -->
        <ellipse cx="-20" cy="-5" rx="3" ry="2" fill="#92400e"/>
        <!-- Mouth -->
        <path d="M-23,-3 Q-20,0 -17,-3" fill="none" stroke="#92400e" stroke-width="1" stroke-linecap="round"/>
        <!-- Whiskers -->
        <line x1="-30" y1="-5" x2="-25" y2="-4" stroke="#e5a300" stroke-width="0.7"/>
        <line x1="-30" y1="-3" x2="-25" y2="-3" stroke="#e5a300" stroke-width="0.7"/>
        <line x1="-10" y1="-5" x2="-15" y2="-4" stroke="#e5a300" stroke-width="0.7"/>
        <line x1="-10" y1="-3" x2="-15" y2="-3" stroke="#e5a300" stroke-width="0.7"/>
        <!-- Legs -->
        <rect x="-10" y="14" width="6" height="12" fill="#f59e0b" rx="2"/>
        <rect x="4" y="14" width="6" height="12" fill="#f59e0b" rx="2"/>
        <!-- Tail -->
        <path d="M18,5 Q28,0 25,-8" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="25" cy="-10" r="4" fill="#d97706"/>
      </g>`;let g="";if(t>=.95){const x=Math.min(1,(t-.95)*20),z=["#ff6b6b","#ffa500","#ffd700","#4ade80","#38bdf8","#6c3ce0"];g=`<g opacity="${x}">`,z.forEach((v,b)=>{const y=120-b*8;g+=`<path d="M80,210 A${y},${y} 0 0,1 ${80+y*2},210" 
          fill="none" stroke="${v}" stroke-width="6" opacity="0.7"/>`}),g+="</g>"}let T="";if(t>=.95){const x=Math.min(1,(t-.95)*20);[[60,100,"✦"],[150,80,"♪"],[250,70,"✦"],[350,95,"♪"],[100,60,"★"],[300,55,"★"]].forEach(([v,b,y],m)=>{T+=`
          <circle cx="${v}" cy="${b}" r="4" fill="#ffd700" opacity="${x}">
            <animate attributeName="opacity" values="${x};${x*.3};${x}" dur="1s" begin="${m*.2}s" repeatCount="indefinite"/>
            <animate attributeName="cy" values="${Number(b)};${Number(b)-5};${Number(b)}" dur="2s" begin="${m*.3}s" repeatCount="indefinite"/>
          </circle>`})}return`<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;">
      ${i}
      ${o}
      ${r}
      ${n}
      ${a}
      ${l}
      ${h}
      ${d}
      ${f}
      ${g}
      ${T}
    </svg>`},renderStamp(e){return e?`<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;">
        <defs>
          <linearGradient id="goldPaw" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffd700"/>
            <stop offset="50%" stop-color="#ffec80"/>
            <stop offset="100%" stop-color="#ffd700"/>
          </linearGradient>
          <filter id="pawGlow">
            <feGaussianBlur stdDeviation="1.5" result="glow"/>
            <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <!-- Paw pad -->
        <ellipse cx="30" cy="34" rx="12" ry="10" fill="url(#goldPaw)" filter="url(#pawGlow)"/>
        <!-- Toe beans -->
        <ellipse cx="20" cy="22" rx="5" ry="6" fill="url(#goldPaw)" transform="rotate(-15, 20, 22)"/>
        <ellipse cx="30" cy="18" rx="5" ry="6" fill="url(#goldPaw)"/>
        <ellipse cx="40" cy="22" rx="5" ry="6" fill="url(#goldPaw)" transform="rotate(15, 40, 22)"/>
        <!-- Sparkles -->
        <g opacity="0.9">
          <line x1="48" y1="10" x2="52" y2="10" stroke="#fff" stroke-width="1.5"/>
          <line x1="50" y1="8" x2="50" y2="12" stroke="#fff" stroke-width="1.5"/>
          <line x1="8" y1="42" x2="12" y2="42" stroke="#ffd700" stroke-width="1"/>
          <line x1="10" y1="40" x2="10" y2="44" stroke="#ffd700" stroke-width="1"/>
        </g>
      </svg>`:`<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;">
      <defs>
        <linearGradient id="silverPaw" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#c0c0c0"/>
          <stop offset="50%" stop-color="#e0e0e0"/>
          <stop offset="100%" stop-color="#c0c0c0"/>
        </linearGradient>
      </defs>
      <!-- Paw pad -->
      <ellipse cx="30" cy="34" rx="12" ry="10" fill="url(#silverPaw)" stroke="#aaa" stroke-width="1" stroke-dasharray="3,2"/>
      <!-- Toe beans -->
      <ellipse cx="20" cy="22" rx="5" ry="6" fill="url(#silverPaw)" stroke="#aaa" stroke-width="0.8" stroke-dasharray="2,2" transform="rotate(-15, 20, 22)"/>
      <ellipse cx="30" cy="18" rx="5" ry="6" fill="url(#silverPaw)" stroke="#aaa" stroke-width="0.8" stroke-dasharray="2,2"/>
      <ellipse cx="40" cy="22" rx="5" ry="6" fill="url(#silverPaw)" stroke="#aaa" stroke-width="0.8" stroke-dasharray="2,2" transform="rotate(15, 40, 22)"/>
      <!-- Heart -->
      <path d="M30,48 C27,45 22,42 22,39 C22,37 23.5,36 25,36 C27,36 29,37.5 30,39 C31,37.5 33,36 35,36 C36.5,36 38,37 38,39 C38,42 33,45 30,48Z"
        fill="#ff8fab" opacity="0.7"/>
    </svg>`},renderStampDecoration(){let e="";return[[40,250],[80,230],[120,240],[160,220],[200,230],[240,215],[280,225],[320,210],[360,200]].forEach(([o,r],n)=>{const a=n%2===0?-10:10;e+=`
        <g transform="translate(${o}, ${r}) rotate(${a}) scale(0.5)" opacity="0.25">
          <!-- Mini paw -->
          <ellipse cx="0" cy="4" rx="6" ry="5" fill="#92400e"/>
          <ellipse cx="-5" cy="-4" rx="2.5" ry="3" fill="#92400e"/>
          <ellipse cx="0" cy="-6" rx="2.5" ry="3" fill="#92400e"/>
          <ellipse cx="5" cy="-4" rx="2.5" ry="3" fill="#92400e"/>
        </g>`}),`<svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;position:absolute;top:0;left:0;pointer-events:none;">
      ${e}
      
      <g transform="translate(375, 180)" opacity="0.35">
        <rect x="0" y="0" width="2" height="30" fill="#92400e"/>
        <polygon points="2,0 20,5 2,12" fill="#fb923c"/>
      </g>
    </svg>`}},qe=[Tt,Mt,Lt],Et=new Map(qe.map(e=>[e.id,e]));function st(){return qe}function ye(e){return Et.get(e)??qe[0]}const Be="kodomo-timer-",lt=`${Be}settings`,ct=`${Be}stamp-sheet`,dt=`${Be}activity-logs`,Rt="KodomoTimerDB",At=1,$="recordings",Ye={stampGoal:5,rewards:["すきなおやつ 🍪","こうえんであそぶ 🏞️","すきなどうがを みる 📺"],currentTheme:"space",defaultMinutes:5},Qe={stamps:[],goal:5,completedSheets:0};function Pe(e,t){try{const i=localStorage.getItem(e);return i===null?t:JSON.parse(i)}catch{return t}}function Ge(e,t){try{localStorage.setItem(e,JSON.stringify(t))}catch{console.warn(`[storage] Failed to write key "${e}"`)}}function R(){return{...Ye,...Pe(lt,Ye)}}function ae(e){Ge(lt,e)}function be(){const e=Pe(ct,Qe);return{...Qe,...e,stamps:Array.isArray(e.stamps)?e.stamps:[]}}function zt(e){Ge(ct,e)}function Ct(e){const t=be();t.stamps.push(e);const i=R();return t.stamps.length>=i.stampGoal&&(t.completedSheets+=1,t.stamps=[]),t.goal=i.stampGoal,zt(t),t}function ft(){return Pe(dt,[])}function qt(e){const t=ft(),i=t.find(a=>a.date===e.date);i?(i.attempts+=e.attempts,i.completions+=e.completions,i.totalMinutes+=e.totalMinutes):t.push(e);const o=new Date;o.setDate(o.getDate()-90);const r=o.toISOString().slice(0,10),n=t.filter(a=>a.date>=r);Ge(dt,n)}function Bt(){const e=ft(),t=be(),i=new Date,o=new Date;o.setDate(i.getDate()-7);const r=o.toISOString().slice(0,10);let n=0,a=0;for(const l of e)l.date>=r&&(n+=l.attempts,a+=l.completions);let s=0;for(const l of t.stamps)l.date.slice(0,10)>=r&&(s+=1);return{attempts:n,completions:a,stamps:s}}let V=null;function we(){return V?Promise.resolve(V):new Promise((e,t)=>{const i=indexedDB.open(Rt,At);i.onupgradeneeded=()=>{const o=i.result;o.objectStoreNames.contains($)||o.createObjectStore($,{keyPath:"id"})},i.onsuccess=()=>{V=i.result,V.onclose=()=>{V=null},e(V)},i.onerror=()=>{console.error("[storage] IndexedDB open failed",i.error),t(i.error)}})}async function Pt(e,t,i){const o=await we();return new Promise((r,n)=>{const a=o.transaction($,"readwrite");a.objectStore($).put({id:e,blob:t,meta:i}),a.oncomplete=()=>r(),a.onerror=()=>{console.error("[storage] saveRecording failed",a.error),n(a.error)}})}async function pt(e){const t=await we();return new Promise((i,o)=>{const a=t.transaction($,"readonly").objectStore($).get(e);a.onsuccess=()=>{const s=a.result;i(s?{blob:s.blob,meta:s.meta}:null)},a.onerror=()=>{console.error("[storage] getRecording failed",a.error),o(a.error)}})}async function Gt(){const e=await we();return new Promise((t,i)=>{const n=e.transaction($,"readonly").objectStore($).getAll();n.onsuccess=()=>{const a=n.result;t(a.map(s=>s.meta))},n.onerror=()=>{console.error("[storage] getAllRecordingMetas failed",n.error),i(n.error)}})}async function Ot(e){const t=await we();return new Promise((i,o)=>{const r=t.transaction($,"readwrite");r.objectStore($).delete(e),r.oncomplete=()=>i(),r.onerror=()=>{console.error("[storage] deleteRecording failed",r.error),o(r.error)}})}let D=null;function E(){D||(D=new(window.AudioContext||window.webkitAudioContext),D.state==="suspended"&&D.resume())}function Oe(){return D||E(),D}function C(e){return 440*Math.pow(2,(e-69)/12)}const w={C4:C(60),E4:C(64),G4:C(67),A4:C(69),C5:C(72),D5:C(74),E5:C(76),G5:C(79)};function S(e,t={}){const i=Oe(),o=i.currentTime+(t.startOffset??0),r=t.attack??.01,n=t.decay??.1,a=t.sustain??.05,s=t.sustainLevel??.6,l=t.release??.15,p=t.volume??.25,h=i.createOscillator(),c=i.createGain();h.type=t.waveform??"sine",h.frequency.setValueAtTime(e,o),t.detune&&h.detune.setValueAtTime(t.detune,o),c.gain.setValueAtTime(0,o),c.gain.linearRampToValueAtTime(p,o+r),c.gain.linearRampToValueAtTime(p*s,o+r+n),c.gain.setValueAtTime(p*s,o+r+n+a),c.gain.linearRampToValueAtTime(0,o+r+n+a+l),h.connect(c),c.connect(i.destination),h.start(o),h.stop(o+r+n+a+l+.01)}function Me(e={}){const t=Oe(),i=t.currentTime+(e.startOffset??0),o=e.duration??.08,r=e.volume??.15,n=e.filterFreq??4e3,a=e.filterType??"lowpass",s=Math.ceil(t.sampleRate*o),l=t.createBuffer(1,s,t.sampleRate),p=l.getChannelData(0);for(let u=0;u<s;u++)p[u]=Math.random()*2-1;const h=t.createBufferSource();h.buffer=l;const c=t.createBiquadFilter();c.type=a,c.frequency.setValueAtTime(n,i);const d=t.createGain();d.gain.setValueAtTime(r,i),d.gain.exponentialRampToValueAtTime(.001,i+o),h.connect(c),c.connect(d),d.connect(t.destination),h.start(i),h.stop(i+o+.01)}function It(){const e=[w.C4,w.E4,w.G4,w.C5],t=.12;e.forEach((i,o)=>{S(i,{waveform:"triangle",attack:.02,decay:.08,sustain:.15,sustainLevel:.5,release:.3,volume:.25,startOffset:o*t}),S(i*2,{waveform:"sine",attack:.02,decay:.06,sustain:.1,sustainLevel:.3,release:.2,volume:.08,startOffset:o*t})}),S(w.C5,{waveform:"triangle",attack:.01,decay:.1,sustain:.4,sustainLevel:.4,release:.5,volume:.2,startOffset:e.length*t})}function jt(){Me({duration:.06,volume:.3,filterFreq:5e3,filterType:"bandpass"}),S(w.G4,{waveform:"sine",attack:.005,decay:.05,sustain:.08,sustainLevel:.4,release:.25,volume:.2,startOffset:.03}),S(w.D5,{waveform:"sine",attack:.01,decay:.04,sustain:.05,sustainLevel:.2,release:.15,volume:.08,startOffset:.04})}function Vt(){S(w.A4,{waveform:"square",attack:.005,decay:.04,sustain:.02,sustainLevel:.3,release:.08,volume:.15})}function Dt(){const e=Oe(),t=e.currentTime,i=e.createOscillator(),o=e.createGain();i.type="sine",i.frequency.setValueAtTime(150,t),i.frequency.exponentialRampToValueAtTime(40,t+.2),o.gain.setValueAtTime(.4,t),o.gain.exponentialRampToValueAtTime(.001,t+.35),i.connect(o),o.connect(e.destination),i.start(t),i.stop(t+.4),Me({duration:.1,volume:.25,filterFreq:2e3,filterType:"lowpass"}),Me({duration:.5,volume:.06,filterFreq:1200,filterType:"lowpass",startOffset:.05})}function Nt(){const e=[w.C5,w.D5,w.E5,w.G5,w.C5*2],t=.07;e.forEach((i,o)=>{S(i,{waveform:"sine",attack:.005,decay:.04,sustain:.03,sustainLevel:.3,release:.15,volume:.15,startOffset:o*t}),S(i*2,{waveform:"sine",attack:.005,decay:.03,sustain:.02,sustainLevel:.15,release:.12,volume:.05,startOffset:o*t+.01,detune:15})})}function Ut(){const e=w.E4;S(e,{waveform:"sine",attack:.02,decay:.2,sustain:.3,sustainLevel:.35,release:.8,volume:.15}),S(e*2,{waveform:"sine",attack:.02,decay:.15,sustain:.15,sustainLevel:.2,release:.5,volume:.06}),S(e*3,{waveform:"sine",attack:.02,decay:.1,sustain:.05,sustainLevel:.1,release:.3,volume:.025})}let U="space",I=5;const Ht=[5,10,15,30];function Ft(){const e=Y(),t=R();U=t.currentTheme,I=t.defaultMinutes,e.innerHTML=`
    ${ie({showBack:!1,showCooldown:!0,title:"ビジュアルタイマー"})}
    <div class="screen screen-enter" id="home-screen">
      <!-- Time Selection -->
      <section class="home-section">
        <h2 class="home-section__title">⏱️ じかんをえらぼう</h2>
        <div class="quick-times">
          ${Ht.map(i=>`
            <button class="quick-time-btn ${i===I?"quick-time-btn--active":""}" 
                    data-minutes="${i}">
              ${i}<span class="quick-time-unit">ぷん</span>
            </button>
          `).join("")}
        </div>
        <div class="custom-time">
          <input type="range" id="time-slider" class="time-slider" 
                 min="1" max="60" value="${I}" step="1">
          <div class="time-display">
            <span class="time-display__value" id="time-value">${I}</span>
            <span class="time-display__unit">ぷん</span>
          </div>
        </div>
      </section>

      <!-- Theme Selection -->
      <section class="home-section">
        <h2 class="home-section__title">🎨 テーマをえらぼう</h2>
        <div class="theme-list" id="theme-list">
          ${st().map(i=>at(i,i.id===U)).join("")}
        </div>
      </section>

      <!-- Start Button -->
      <div class="start-area">
        <button class="start-btn" id="start-btn">
          <span class="start-btn__icon">🚀</span>
          <span class="start-btn__text">ミッション スタート！</span>
        </button>
      </div>

      <!-- Settings & Help Links -->
      <div class="settings-link-area">
        <button class="settings-link" id="help-btn">
          ❓ つかいかた
        </button>
        <span class="settings-link-separator">|</span>
        <button class="settings-link" id="settings-link">
          ⚙️ ほごしゃせってい
        </button>
      </div>
    </div>

    <style>
      #home-screen {
        padding: calc(56px + env(safe-area-inset-top, 0px) + 16px) 16px 32px;
        min-height: 100vh;
        box-sizing: border-box;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
      }

      .home-section {
        margin-bottom: 28px;
      }

      .home-section__title {
        font-size: 1.2rem;
        font-weight: 700;
        color: var(--color-text, #374151);
        margin: 0 0 14px 0;
        text-align: center;
      }

      .quick-times {
        display: flex;
        gap: 10px;
        justify-content: center;
        flex-wrap: wrap;
        margin-bottom: 16px;
      }

      .quick-time-btn {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        border: 3px solid #e5e7eb;
        background: #fff;
        font-family: 'M PLUS Rounded 1c', sans-serif;
        font-size: 1.5rem;
        font-weight: 900;
        color: #6b7280;
        cursor: pointer;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        -webkit-tap-highlight-color: transparent;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      }

      .quick-time-unit {
        font-size: 0.6rem;
        font-weight: 700;
        margin-top: -2px;
      }

      .quick-time-btn--active {
        border-color: var(--color-primary, hsl(263, 70%, 55%));
        background: linear-gradient(135deg, hsl(263, 70%, 55%) 0%, hsl(263, 70%, 65%) 100%);
        color: #fff;
        transform: scale(1.08);
        box-shadow: 0 4px 16px hsla(263, 70%, 55%, 0.3);
      }

      .quick-time-btn:active {
        transform: scale(0.95);
      }

      .custom-time {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 0 8px;
      }

      .time-slider {
        flex: 1;
        -webkit-appearance: none;
        appearance: none;
        height: 8px;
        border-radius: 4px;
        background: linear-gradient(to right, hsl(263, 70%, 75%), hsl(263, 70%, 55%));
        outline: none;
      }

      .time-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #fff;
        border: 3px solid hsl(263, 70%, 55%);
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        cursor: pointer;
      }

      .time-display {
        display: flex;
        align-items: baseline;
        gap: 2px;
        min-width: 60px;
        justify-content: center;
      }

      .time-display__value {
        font-size: 2rem;
        font-weight: 900;
        color: hsl(263, 70%, 55%);
      }

      .time-display__unit {
        font-size: 0.9rem;
        font-weight: 700;
        color: #9ca3af;
      }

      .theme-list {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 14px;
      }

      .start-area {
        display: flex;
        justify-content: center;
        padding: 16px 0 8px;
      }

      .start-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        width: 100%;
        max-width: 320px;
        height: 64px;
        border: none;
        border-radius: 32px;
        background: linear-gradient(135deg, hsl(263, 70%, 55%) 0%, hsl(280, 70%, 60%) 50%, hsl(263, 70%, 45%) 100%);
        color: #fff;
        font-family: 'M PLUS Rounded 1c', sans-serif;
        font-size: 1.3rem;
        font-weight: 900;
        cursor: pointer;
        box-shadow: 0 6px 24px hsla(263, 70%, 55%, 0.35);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        -webkit-tap-highlight-color: transparent;
        animation: startPulse 2s ease-in-out infinite;
        position: relative;
        overflow: hidden;
      }

      .start-btn::after {
        content: '';
        position: absolute;
        top: 0; left: -100%;
        width: 100%; height: 100%;
        background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%);
        animation: startShimmer 3s ease-in-out infinite;
      }

      @keyframes startShimmer {
        0% { left: -100%; }
        50%, 100% { left: 100%; }
      }

      @keyframes startPulse {
        0%, 100% { box-shadow: 0 6px 24px hsla(263, 70%, 55%, 0.35); }
        50% { box-shadow: 0 8px 32px hsla(263, 70%, 55%, 0.5); }
      }

      .start-btn:hover {
        transform: translateY(-2px);
      }

      .start-btn:active {
        transform: scale(0.97);
        animation: none;
      }

      .start-btn__icon {
        font-size: 1.5rem;
      }

      .settings-link-area {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 8px 0 env(safe-area-inset-bottom, 16px);
      }

      .settings-link-separator {
        color: #d1d5db;
        font-size: 0.85rem;
        font-weight: 300;
        user-select: none;
      }

      .settings-link {
        background: none;
        border: none;
        color: #9ca3af;
        font-family: 'M PLUS Rounded 1c', sans-serif;
        font-size: 0.85rem;
        font-weight: 700;
        cursor: pointer;
        padding: 8px 16px;
        border-radius: 16px;
        transition: all 0.2s;
        -webkit-tap-highlight-color: transparent;
      }

      .settings-link:hover {
        background: rgba(0,0,0,0.04);
        color: #6b7280;
      }
    </style>
  `,oe(e),Yt(e)}function Yt(e){e.querySelectorAll(".quick-time-btn").forEach(n=>{n.addEventListener("click",()=>{const a=parseInt(n.dataset.minutes||"5",10);We(a,e),E()})});const t=e.querySelector("#time-slider");t&&t.addEventListener("input",()=>{const n=parseInt(t.value,10);We(n,e)}),e.querySelectorAll(".theme-card").forEach(n=>{n.addEventListener("click",()=>{const a=n.dataset.theme;a&&(ht(a,e),E())})});const i=e.querySelector("#start-btn");i&&i.addEventListener("click",()=>{E();const n=R();n.currentTheme=U,n.defaultMinutes=I,ae(n),G("timer",{theme:U,minutes:String(I)})});const o=e.querySelector("#settings-link");o&&o.addEventListener("click",()=>{G("settings")});const r=e.querySelector("#help-btn");r&&r.addEventListener("click",()=>{E(),Qt()})}function We(e,t){I=e;const i=t.querySelector("#time-slider");i&&(i.value=String(e));const o=t.querySelector("#time-value");o&&(o.textContent=String(e)),t.querySelectorAll(".quick-time-btn").forEach(r=>{const n=parseInt(r.dataset.minutes||"0",10);r.classList.toggle("quick-time-btn--active",n===e)})}function ht(e,t){U=e;const i=t.querySelector("#theme-list");i&&(i.innerHTML=st().map(n=>at(n,n.id===U)).join(""),i.querySelectorAll(".theme-card").forEach(n=>{n.addEventListener("click",()=>{const a=n.dataset.theme;a&&ht(a,t)})}));const o=t.querySelector(".start-btn__icon"),r=ye(e);o&&r&&(o.textContent=r.emoji)}function Qt(){const e=document.createElement("div");e.className="modal-overlay",e.id="help-modal",e.innerHTML=`
    <div class="modal-content help-modal-content">
      <div class="help-modal-header">
        <h2 class="help-modal-title">⏱️ つかいかた</h2>
        <button class="help-modal-close" id="help-modal-close" aria-label="とじる">&times;</button>
      </div>
      <div class="help-modal-body">
        <div class="help-item">
          <div class="help-item__icon">⏱️</div>
          <div class="help-item__text">
            <h3>じかんをえらぼう</h3>
            <p>ボタンをえらぶか、スライダーをうごかして、タイマーの時間をきめるよ。</p>
          </div>
        </div>
        <div class="help-item">
          <div class="help-item__icon">🎨</div>
          <div class="help-item__text">
            <h3>テーマをえらぼう</h3>
            <p>「うちゅう🚀」「おかたづけ🧹」「どうぶつえん🦁」からすきなテーマをえらんでね。</p>
          </div>
        </div>
        <div class="help-item">
          <div class="help-item__icon">🚀</div>
          <div class="help-item__text">
            <h3>ミッション スタート！</h3>
            <p>タイマーがはじまると、アニメーションやイラストがどんどんかわっていくよ。</p>
          </div>
        </div>
        <div class="help-item">
          <div class="help-item__icon">🗣️</div>
          <div class="help-item__text">
            <h3>おしゃべりじっきょう</h3>
            <p>タイマーのちゅうしゃくや、のこり時間がすくなくなると、声で応援してくれるよ！</p>
          </div>
        </div>
        <div class="help-item">
          <div class="help-item__icon">⭐️</div>
          <div class="help-item__text">
            <h3>スタンプをあつめよう</h3>
            <p>タイマーをさいごまでやり遂げるとスタンプがおせるよ。ごほうびチケットをねらおう！</p>
          </div>
        </div>
        <div class="help-item">
          <div class="help-item__icon">🫧</div>
          <div class="help-item__text">
            <h3>おちつきモード（おちつく）</h3>
            <p>イライラしたり、おちつきたいときは、みぎうえの「おちつく」ボタンをおして、しんこきゅうをしてみよう。</p>
          </div>
        </div>
      </div>
    </div>
    <style>
      .help-modal-content {
        max-width: 440px;
        border-radius: 24px;
        padding: 24px;
        box-sizing: border-box;
      }
      .help-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        border-bottom: 2px solid #f3f4f6;
        padding-bottom: 12px;
      }
      .help-modal-title {
        font-size: 1.15rem;
        font-weight: 900;
        color: var(--color-primary);
        margin: 0;
        font-family: 'M PLUS Rounded 1c', sans-serif;
      }
      .help-modal-close {
        font-size: 2rem;
        font-weight: 400;
        color: #9ca3af;
        cursor: pointer;
        background: none;
        border: none;
        padding: 0;
        line-height: 1;
        transition: color 0.2s;
      }
      .help-modal-close:hover {
        color: #374151;
      }
      .help-modal-body {
        display: flex;
        flex-direction: column;
        gap: 16px;
        max-height: 50vh;
        overflow-y: auto;
        padding-right: 4px;
      }
      .help-item {
        display: flex;
        gap: 14px;
        align-items: flex-start;
      }
      .help-item__icon {
        font-size: 1.8rem;
        width: 44px;
        height: 44px;
        background: rgba(124, 58, 237, 0.08);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .help-item__text h3 {
        font-size: 0.95rem;
        font-weight: 800;
        color: #374151;
        margin: 0 0 4px 0;
        font-family: 'M PLUS Rounded 1c', sans-serif;
      }
      .help-item__text p {
        font-size: 0.8rem;
        font-weight: 500;
        color: #6b7280;
        margin: 0;
        line-height: 1.4;
        font-family: 'M PLUS Rounded 1c', sans-serif;
      }
    </style>
  `,document.body.appendChild(e);const t=e.querySelector("#help-modal-close"),i=()=>{e.classList.add("closing"),e.addEventListener("animationend",()=>{e.remove()},{once:!0})};t==null||t.addEventListener("click",i),e.addEventListener("click",o=>{o.target===e&&i()})}function ut(e,t,i){const o=Math.max(0,Math.min(1,e)),r=200,n=r/2,a=r/2,s=80,l=12,p=2*Math.PI*s,h=p*(1-o),d={green:{stroke:"hsl(145, 65%, 45%)",glow:"hsla(145, 65%, 45%, 0.35)",glowOuter:"hsla(145, 65%, 45%, 0.15)"},yellow:{stroke:"hsl(45, 95%, 55%)",glow:"hsla(45, 95%, 55%, 0.35)",glowOuter:"hsla(45, 95%, 55%, 0.15)"},red:{stroke:"hsl(0, 75%, 60%)",glow:"hsla(0, 75%, 60%, 0.35)",glowOuter:"hsla(0, 75%, 60%, 0.15)"}}[i],u=`gaugeGlow-${i}`,f=t.length<=5?36:t.length<=8?28:22;return`
    <div class="progress-gauge" role="timer" aria-label="のこり ${t}">
      <svg viewBox="0 0 ${r} ${r}" width="${r}" height="${r}" class="progress-gauge__svg">
        <defs>
          <filter id="${u}" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <!-- Background ring -->
        <circle
          cx="${n}" cy="${a}" r="${s}"
          fill="none"
          stroke="#e5e7eb"
          stroke-width="${l}"
          opacity="0.5"
        />

        <!-- Subtle outer glow ring -->
        <circle
          cx="${n}" cy="${a}" r="${s}"
          fill="none"
          stroke="${d.glowOuter}"
          stroke-width="${l+8}"
          stroke-dasharray="${p}"
          stroke-dashoffset="${h}"
          stroke-linecap="round"
          transform="rotate(-90, ${n}, ${a})"
          class="progress-gauge__glow"
        />

        <!-- Progress ring -->
        <circle
          cx="${n}" cy="${a}" r="${s}"
          fill="none"
          stroke="${d.stroke}"
          stroke-width="${l}"
          stroke-dasharray="${p}"
          stroke-dashoffset="${h}"
          stroke-linecap="round"
          transform="rotate(-90, ${n}, ${a})"
          filter="url(#${u})"
          class="progress-gauge__ring"
        />

        <!-- Time text -->
        <text
          x="${n}" y="${a}"
          text-anchor="middle"
          dominant-baseline="central"
          font-family="'M PLUS Rounded 1c', sans-serif"
          font-weight="900"
          font-size="${f}"
          fill="#374151"
          class="progress-gauge__time"
        >${t}</text>
      </svg>
    </div>
    <style>
      .progress-gauge {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        max-width: 220px;
        margin: 0 auto;
      }

      .progress-gauge__svg {
        width: 100%;
        height: auto;
        display: block;
        filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.08));
      }

      .progress-gauge__ring {
        transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1),
                    stroke 0.6s ease;
      }

      .progress-gauge__glow {
        transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1),
                    stroke 0.6s ease;
      }

      .progress-gauge__time {
        transition: fill 0.3s ease;
        user-select: none;
      }

      /* Urgent pulsing when red */
      @keyframes gaugeUrgentPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
    </style>
  `}const Wt={space:{start:{text:"3、2、1…発射！うちゅうミッション、スタート！",pitch:1.3,rate:1.1},half:{text:"折り返し地点通過！その調子だ、パイロット！",pitch:1.2},threeMin:{text:"まもなく大気圏突入！ラストスパートだ！",pitch:1.3,rate:1.1},complete:{text:"着陸成功！ミッションクリア！すごいぞ！",pitch:1.4,rate:1},timeUp:{text:"ミッション終了！よくがんばったね！",pitch:1.1,rate:.9}},cleanup:{start:{text:"おかたづけ、スタート！きれいにしよう！",pitch:1.4,rate:1},half:{text:"半分できたよ！すごい、きれいになってきた！",pitch:1.3},threeMin:{text:"あとすこし！ラストスパートだよ！",pitch:1.3,rate:1.1},complete:{text:"ピッカピカ！おかたづけかんりょう！",pitch:1.5,rate:1},timeUp:{text:"おしまい！がんばっておかたづけしたね！",pitch:1.2,rate:.9}},zoo:{start:{text:"どうぶつえん探検、しゅっぱーつ！",pitch:1.4,rate:1},half:{text:"折り返し！どうぶつたちが待ってるよ！",pitch:1.3},threeMin:{text:"もうすぐゴール！あとすこしだ！",pitch:1.3,rate:1.1},complete:{text:"やったー！どうぶつたちが大集合！すごい！",pitch:1.5,rate:1},timeUp:{text:"探検おわり！たくさんがんばったね！",pitch:1.2,rate:.9}}};let Le=[],_e=!1;function gt(){return typeof window<"u"&&"speechSynthesis"in window}function Xt(){const t=window.speechSynthesis.getVoices();return t.find(o=>o.lang==="ja-JP")??t.find(o=>o.lang.startsWith("ja"))??null}function Kt(){return new Promise(e=>{const t=window.speechSynthesis;if(t.getVoices().length>0){e();return}const o=()=>{t.removeEventListener("voiceschanged",o),e()};t.addEventListener("voiceschanged",o),setTimeout(()=>{t.removeEventListener("voiceschanged",o),e()},2e3)})}async function Jt(){if(!_e){for(_e=!0;Le.length>0;){const e=Le.shift();await Zt(e.text,e.pitch,e.rate)}_e=!1}}function Zt(e,t,i){return new Promise(async o=>{if(!gt()){o();return}const r=window.speechSynthesis;await Kt();const n=new SpeechSynthesisUtterance(e);n.lang="ja-JP",n.pitch=Math.max(0,Math.min(2,t)),n.rate=Math.max(.1,Math.min(10,i)),n.volume=1;const a=Xt();a&&(n.voice=a),n.onend=()=>{o()},n.onerror=()=>{o()},r.cancel(),r.speak(n)})}async function ue(e,t){if(!gt())return;const i=Wt[e];if(!i)return;const o=i[t];if(!o)return;const r=o.pitch??1.2,n=o.rate??1;Le.push({text:o.text,pitch:r,rate:n}),await Jt()}const Xe=10,Ke=250;let k=null,ge=[],B="idle",Je=0,se=null,le=null,q={},P=null,Z=null;function ei(){const e=["audio/webm;codecs=opus","audio/webm","audio/ogg;codecs=opus","audio/ogg","audio/mp4"];for(const t of e)if(MediaRecorder.isTypeSupported(t))return t;return""}function Se(){se!==null&&(clearInterval(se),se=null),le!==null&&(clearTimeout(le),le=null)}function Ie(){return typeof window<"u"&&typeof navigator<"u"&&"mediaDevices"in navigator&&typeof navigator.mediaDevices.getUserMedia=="function"&&typeof MediaRecorder<"u"}async function ti(e){if(!Ie())throw B="unavailable",new Error("MediaRecorder is not supported in this browser.");B==="recording"&&k&&(k.stop(),Se()),q={},ge=[];const t=await navigator.mediaDevices.getUserMedia({audio:!0}),i=ei(),o=i?{mimeType:i}:{};k=new MediaRecorder(t,o),k.ondataavailable=r=>{r.data.size>0&&ge.push(r.data)},k.onstop=()=>{t.getTracks().forEach(r=>r.stop()),Se(),B="idle"},k.onerror=()=>{t.getTracks().forEach(r=>r.stop()),Se(),B="idle"},k.start(Ke),B="recording",Je=Date.now(),q.onProgress&&(se=window.setInterval(()=>{var n;const r=(Date.now()-Je)/1e3;(n=q.onProgress)==null||n.call(q,Math.min(r,Xe))},Ke)),le=window.setTimeout(()=>{var r;B==="recording"&&k&&k.state==="recording"&&(k.stop(),(r=q.onAutoStop)==null||r.call(q))},Xe*1e3)}function ii(){return new Promise((e,t)=>{if(!k||B!=="recording"){t(new Error("No recording in progress."));return}const i=k,o=i.onstop;i.onstop=r=>{typeof o=="function"&&o.call(i,r);const n=i.mimeType||"audio/webm",a=new Blob(ge,{type:n});ge=[],e(a)},i.stop()})}function Ze(){return Ie()?B:"unavailable"}function mt(e){return new Promise((t,i)=>{oi(),Z=URL.createObjectURL(e),P=new Audio(Z),P.onended=()=>{ce(),t()},P.onerror=()=>{ce(),i(new Error("Playback failed."))},P.play().catch(o=>{ce(),i(o)})})}function oi(){P&&(P.pause(),P.currentTime=0),ce()}function ce(){Z&&(URL.revokeObjectURL(Z),Z=null),P=null}function me(e){const t=Math.floor(e/60),i=e%60;return`${String(t).padStart(2,"0")}:${String(i).padStart(2,"0")}`}function xt(e,t){return t<=0?1:Math.max(0,Math.min(1,1-e/t))}function ri(e,t){const i=e/t;return i>.5?"green":i>.2?"yellow":"red"}function et(){return new Date().toISOString().split("T")[0]}function je(e){const t={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"};return e.replace(/[&<>"']/g,i=>t[i]||i)}function ni(){const e=Math.floor(Math.random()*8)+2,t=Math.floor(Math.random()*8)+2,i=["+","×"];return i[Math.floor(Math.random()*i.length)]==="+"?{question:`${e} + ${t} = ?`,answer:e+t}:{question:`${e} × ${t} = ?`,answer:e*t}}function ai(e){"vibrate"in navigator&&navigator.vibrate(e)}let de=null,j=0,_=0,N=!1,A="space",O=new Set;function si(e){const t=Y();A=(e==null?void 0:e.theme)||"space",j=parseInt((e==null?void 0:e.minutes)||"5",10)*60,_=j,N=!1,O=new Set,E();const o=ye(A);t.innerHTML=`
    ${ie({showBack:!0,showCooldown:!0,title:o.name})}
    <div class="screen screen-enter timer-screen" id="timer-screen"
         style="background: linear-gradient(180deg, ${o.colors.bg} 0%, ${o.colors.primary}15 100%);">
      
      <!-- Theme Animation Area -->
      <div class="timer-theme-animation" id="theme-animation">
        ${o.renderIllustration(0)}
      </div>

      <!-- Progress Gauge -->
      <div class="timer-gauge-area" id="gauge-area">
        ${ut(0,me(_),"green")}
      </div>

      <!-- Speech Bubble -->
      <div class="timer-speech-bubble" id="speech-bubble" style="display: none;">
        <span id="speech-text"></span>
      </div>

      <!-- Controls -->
      <div class="timer-controls">
        <button class="timer-ctrl-btn timer-ctrl-btn--pause" id="pause-btn">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1"/>
            <rect x="14" y="4" width="4" height="16" rx="1"/>
          </svg>
          <span>いちじていし</span>
        </button>
        <button class="timer-ctrl-btn timer-ctrl-btn--stop" id="stop-btn">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
            <rect x="5" y="5" width="14" height="14" rx="2"/>
          </svg>
          <span>やめる</span>
        </button>
      </div>
    </div>

    <style>
      .timer-screen {
        padding: calc(56px + env(safe-area-inset-top, 0px) + 8px) 16px 24px;
        min-height: 100vh;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        transition: background 1s ease;
      }

      .timer-theme-animation {
        width: 100%;
        max-width: 400px;
        min-height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 0;
      }

      .timer-theme-animation svg {
        width: 100%;
        height: auto;
        max-height: 240px;
      }

      .timer-gauge-area {
        display: flex;
        justify-content: center;
      }

      .timer-speech-bubble {
        background: #fff;
        border-radius: 20px;
        padding: 12px 24px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        font-size: 1rem;
        font-weight: 700;
        color: #374151;
        text-align: center;
        max-width: 320px;
        animation: speechBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        position: relative;
      }

      .timer-speech-bubble::after {
        content: '';
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        width: 16px;
        height: 8px;
        background: #fff;
        clip-path: polygon(0 0, 100% 0, 50% 100%);
      }

      @keyframes speechBounce {
        0% { transform: scale(0.5) translateY(20px); opacity: 0; }
        100% { transform: scale(1) translateY(0); opacity: 1; }
      }

      .timer-controls {
        display: flex;
        gap: 20px;
        margin-top: auto;
        padding-bottom: env(safe-area-inset-bottom, 16px);
      }

      .timer-ctrl-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        border: none;
        border-radius: 20px;
        padding: 14px 28px;
        font-family: 'M PLUS Rounded 1c', sans-serif;
        font-size: 0.75rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
        -webkit-tap-highlight-color: transparent;
      }

      .timer-ctrl-btn--pause {
        background: rgba(255,255,255,0.85);
        color: #6b7280;
        box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      }

      .timer-ctrl-btn--pause.is-paused {
        background: hsl(145, 65%, 45%);
        color: #fff;
      }

      .timer-ctrl-btn--stop {
        background: rgba(255,255,255,0.85);
        color: #ef4444;
        box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      }

      .timer-ctrl-btn:active {
        transform: scale(0.93);
      }
    </style>
  `,oe(t),ci(t),di(t),ue(A,"start"),Ee(t,li())}function li(){return{space:"🚀 ミッションスタート！",cleanup:"🧹 おかたづけスタート！",zoo:"🦁 たんけんスタート！"}[A]||"スタート！"}function ci(e){const t=e.querySelector("#pause-btn"),i=e.querySelector("#stop-btn");t&&t.addEventListener("click",()=>{N=!N,t.classList.toggle("is-paused",N);const o=t.querySelector("svg"),r=t.querySelector("span");N?(o&&(o.innerHTML='<polygon points="6,4 20,12 6,20" />'),r&&(r.textContent="さいかい")):(o&&(o.innerHTML='<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>'),r&&(r.textContent="いちじていし"))}),i&&i.addEventListener("click",()=>{confirm("タイマーをやめますか？")&&(Ve(),G("home"))})}function di(e){de=setInterval(()=>{N||(_--,fi(e),hi(e),_<=0&&(Ve(),ui()))},1e3)}function fi(e){xt(_,j)>=.5&&!O.has("half")&&(O.add("half"),ue(A,"half"),Ee(e,"🔥 おりかえし！そのちょうし！")),_===180&&!O.has("threeMin")&&j>180&&(O.add("threeMin"),ue(A,"threeMin"),Ee(e,"⚡ あと3ぷん！ラストスパート！")),_===60&&!O.has("parentVoice")&&(O.add("parentVoice"),pi()),_<=10&&_>0&&Vt()}async function pi(){try{const e=await pt("recording-1");e&&mt(e.blob)}catch{}}function hi(e){const t=xt(_,j),i=ri(_,j),o=ye(A),r=e.querySelector("#theme-animation");r&&(r.innerHTML=o.renderIllustration(t));const n=e.querySelector("#gauge-area");n&&(n.innerHTML=ut(t,me(_),i))}function Ee(e,t){const i=e.querySelector("#speech-bubble"),o=e.querySelector("#speech-text");i&&o&&(o.textContent=t,i.style.display="block",i.style.animation="none",i.offsetHeight,i.style.animation="speechBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",setTimeout(()=>{i.style.display="none"},3e3))}function ui(e,t){ue(A,"complete"),G("stamp",{theme:A,completed:"true",minutes:String(Math.ceil(j/60))})}function Ve(){de&&(clearInterval(de),de=null)}window.addEventListener("hashchange",()=>{Ve()});let ee=null,te=null,fe=null;const tt=["#ff6b6b","#ffa500","#ffd700","#4ade80","#38bdf8","#6c3ce0","#ff69b4","#ffb347","#7dd3fc","#a78bfa"];function gi(e){return{x:Math.random()*e,y:-20-Math.random()*100,vx:(Math.random()-.5)*2,vy:Math.random()*2+1.5,width:5+Math.random()*10,height:5+Math.random()*10,color:tt[Math.floor(Math.random()*tt.length)],rotation:Math.random()*Math.PI*2,rotationSpeed:(Math.random()-.5)*.15,swayOffset:Math.random()*Math.PI*2,swaySpeed:.02+Math.random()*.03,opacity:1}}function mi(e,t=5e3){it();const i=document.createElement("canvas");i.style.cssText=`
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 9999;
  `,i.width=window.innerWidth*(window.devicePixelRatio||1),i.height=window.innerHeight*(window.devicePixelRatio||1),e.appendChild(i),ee=i;const o=i.getContext("2d");if(!o)return;o.scale(window.devicePixelRatio||1,window.devicePixelRatio||1);const r=window.innerWidth,n=window.innerHeight,a=100,s=[];for(let d=0;d<a;d++){const u=gi(r);u.y=-20-Math.random()*300,s.push(u)}let l=1,p=performance.now(),h=!1;function c(d){if(!o||!ee)return;const u=d-p;if(o.clearRect(0,0,r,n),h&&(l=Math.max(0,l-.02),l<=0)){it();return}o.globalAlpha=l;for(const f of s)f.vy+=.04,f.x+=f.vx+Math.sin(u*f.swaySpeed+f.swayOffset)*.8,f.y+=f.vy,f.rotation+=f.rotationSpeed,f.y>n+20&&!h&&(f.y=-20,f.x=Math.random()*r,f.vy=Math.random()*2+1.5),o.save(),o.translate(f.x,f.y),o.rotate(f.rotation),o.fillStyle=f.color,o.fillRect(-f.width/2,-f.height/2,f.width,f.height),o.restore();te=requestAnimationFrame(c)}te=requestAnimationFrame(c),fe=setTimeout(()=>{h=!0},t-1e3)}function it(){te!==null&&(cancelAnimationFrame(te),te=null),fe!==null&&(clearTimeout(fe),fe=null),ee&&(ee.remove(),ee=null)}let $e=!1;function xi(e){const t=Y(),i=(e==null?void 0:e.theme)||"space",o=(e==null?void 0:e.completed)==="true",r=parseInt((e==null?void 0:e.minutes)||"5",10),n=ye(i),a=R();$e||($e=!0,Ct({date:et(),themeId:i,durationMinutes:r,completed:o}),qt({date:et(),attempts:1,completions:o?1:0,totalMinutes:r}));const s=be(),l=s.stamps.length===0&&s.completedSheets>0,p=l?a.stampGoal:s.stamps.length,h=a.stampGoal,c=a.rewards,d=c.length>0?c[Math.floor(Math.random()*c.length)]:"すてきなごほうび 🎁";t.innerHTML=`
    ${ie({showBack:!1,showCooldown:!0,title:"けっか はっぴょう！"})}
    <div class="screen screen-enter stamp-screen" id="stamp-screen">

      <!-- Result Overlay -->
      <div class="result-overlay" id="result-overlay">
        <div class="result-stamp-container">
          <div class="result-stamp" id="result-stamp">
            ${o?`<div class="result-stamp__icon">🌟</div>
                 <div class="result-stamp__label">たいへん<br>よくできました！</div>`:`<div class="result-stamp__icon">💪</div>
                 <div class="result-stamp__label">がんばったね！</div>`}
          </div>
        </div>
        <button class="result-next-btn" id="result-next-btn">
          つぎへ →
        </button>
      </div>

      <!-- Stamp Sheet View (hidden initially) -->
      <div class="stamp-sheet-view" id="stamp-sheet-view" style="display: none;">
        <h2 class="stamp-sheet-title">${n.emoji} スタンプシート</h2>
        <div class="stamp-sheet-progress">
          <span class="stamp-count">${p}</span> / <span class="stamp-goal">${h}</span>
        </div>

        <div class="stamp-grid stamp-grid--${h}" id="stamp-grid">
          ${yi(n,p,h)}
        </div>

        <div class="stamp-actions">
          <button class="btn btn-primary stamp-action-btn" id="home-btn">
            🏠 ホームにもどる
          </button>
          <button class="btn btn-accent stamp-action-btn" id="retry-btn">
            🔄 もういちど チャレンジ！
          </button>
        </div>
      </div>

      <!-- Reward Ticket (shown when goal reached) -->
      ${l?`
        <div class="reward-overlay" id="reward-overlay" style="display: none;">
          <div class="reward-ticket">
            <div class="reward-ticket__header">🎉 ごほうびチケット 🎉</div>
            <div class="reward-ticket__body">
              <div class="reward-ticket__text">${je(d)}</div>
            </div>
            <div class="reward-ticket__footer">
              チケットをパパ・ママに みせてね！
            </div>
            <button class="reward-ticket__close" id="reward-close-btn">とじる</button>
          </div>
        </div>
      `:""}
    </div>

    <style>
      .stamp-screen {
        padding: calc(56px + env(safe-area-inset-top, 0px) + 8px) 16px 24px;
        min-height: 100vh;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      /* Result Overlay */
      .result-overlay {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex: 1;
        gap: 40px;
        width: 100%;
      }

      .result-stamp-container {
        position: relative;
      }

      .result-stamp {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        animation: stampSlam 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .result-stamp__icon {
        font-size: 6rem;
        animation: stampGlow 1.5s ease-in-out infinite alternate;
      }

      .result-stamp__label {
        font-size: 1.6rem;
        font-weight: 900;
        text-align: center;
        color: #374151;
        line-height: 1.4;
        background: linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #8b5cf6 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      @keyframes stampSlam {
        0% { transform: scale(3) rotate(-10deg); opacity: 0; }
        60% { transform: scale(0.9) rotate(2deg); opacity: 1; }
        80% { transform: scale(1.05) rotate(-1deg); }
        100% { transform: scale(1) rotate(0deg); }
      }

      @keyframes stampGlow {
        0% { filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.4)); }
        100% { filter: drop-shadow(0 0 20px rgba(251, 191, 36, 0.7)); }
      }

      .result-next-btn {
        padding: 14px 40px;
        border: none;
        border-radius: 24px;
        background: linear-gradient(135deg, hsl(263, 70%, 55%), hsl(263, 70%, 65%));
        color: #fff;
        font-family: 'M PLUS Rounded 1c', sans-serif;
        font-size: 1.1rem;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 4px 16px hsla(263, 70%, 55%, 0.3);
        transition: all 0.2s;
        -webkit-tap-highlight-color: transparent;
      }

      .result-next-btn:active {
        transform: scale(0.95);
      }

      /* Stamp Sheet */
      .stamp-sheet-view {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;
        width: 100%;
        max-width: 400px;
      }

      .stamp-sheet-title {
        font-size: 1.3rem;
        font-weight: 700;
        margin: 0 0 4px;
        color: #374151;
      }

      .stamp-sheet-progress {
        font-size: 1.1rem;
        font-weight: 700;
        color: #9ca3af;
        margin-bottom: 16px;
      }

      .stamp-count {
        font-size: 1.5rem;
        color: hsl(263, 70%, 55%);
      }

      .stamp-grid {
        display: grid;
        gap: 8px;
        width: 100%;
        margin-bottom: 24px;
      }

      .stamp-grid--5 { grid-template-columns: repeat(5, 1fr); }
      .stamp-grid--10 { grid-template-columns: repeat(5, 1fr); }
      .stamp-grid--20 { grid-template-columns: repeat(5, 1fr); }

      .stamp-cell {
        aspect-ratio: 1;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px dashed #d1d5db;
        background: rgba(255,255,255,0.6);
        transition: all 0.3s;
        overflow: hidden;
      }

      .stamp-cell svg {
        width: 80%;
        height: 80%;
      }

      .stamp-cell--filled {
        border-style: solid;
        border-color: #fbbf24;
        background: rgba(251, 191, 36, 0.1);
        animation: cellFillIn 0.3s ease-out;
      }

      .stamp-cell--current {
        border-color: hsl(263, 70%, 55%);
        border-style: solid;
        animation: cellPulse 1.5s ease-in-out infinite;
      }

      @keyframes cellFillIn {
        0% { transform: scale(0.8); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }

      @keyframes cellPulse {
        0%, 100% { box-shadow: 0 0 0 0 hsla(263, 70%, 55%, 0.3); }
        50% { box-shadow: 0 0 0 6px hsla(263, 70%, 55%, 0); }
      }

      .stamp-actions {
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 100%;
        margin-top: auto;
        padding-bottom: env(safe-area-inset-bottom, 16px);
      }

      .stamp-action-btn {
        width: 100%;
        height: 54px;
        border-radius: 27px;
        border: none;
        font-family: 'M PLUS Rounded 1c', sans-serif;
        font-size: 1rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
        -webkit-tap-highlight-color: transparent;
      }

      .btn-primary {
        background: linear-gradient(135deg, hsl(263, 70%, 55%), hsl(263, 70%, 65%));
        color: #fff;
        box-shadow: 0 4px 16px hsla(263, 70%, 55%, 0.3);
      }

      .btn-accent {
        background: linear-gradient(135deg, hsl(45, 95%, 55%), hsl(35, 95%, 55%));
        color: #fff;
        box-shadow: 0 4px 16px hsla(45, 95%, 55%, 0.3);
      }

      .stamp-action-btn:active {
        transform: scale(0.97);
      }

      /* Reward Overlay */
      .reward-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 200;
        backdrop-filter: blur(4px);
        animation: fadeIn 0.3s ease;
      }

      .reward-ticket {
        width: 90%;
        max-width: 340px;
        background: linear-gradient(135deg, #fef3c7 0%, #fbbf24 50%, #f59e0b 100%);
        border-radius: 24px;
        padding: 32px 24px;
        text-align: center;
        box-shadow: 0 12px 40px rgba(0,0,0,0.2);
        border: 3px dashed #92400e;
        animation: ticketAppear 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        position: relative;
        overflow: hidden;
      }

      .reward-ticket::before {
        content: '';
        position: absolute;
        top: 0; left: -100%;
        width: 200%; height: 100%;
        background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
        animation: ticketShimmer 2s ease-in-out infinite;
      }

      @keyframes ticketAppear {
        0% { transform: scale(0) rotate(-15deg); opacity: 0; }
        100% { transform: scale(1) rotate(0deg); opacity: 1; }
      }

      @keyframes ticketShimmer {
        0% { left: -100%; }
        50%, 100% { left: 100%; }
      }

      .reward-ticket__header {
        font-size: 1.4rem;
        font-weight: 900;
        color: #92400e;
        margin-bottom: 16px;
        position: relative;
      }

      .reward-ticket__body {
        background: rgba(255,255,255,0.7);
        border-radius: 16px;
        padding: 20px 16px;
        margin-bottom: 16px;
        position: relative;
      }

      .reward-ticket__text {
        font-size: 1.3rem;
        font-weight: 900;
        color: #78350f;
      }

      .reward-ticket__footer {
        font-size: 0.85rem;
        font-weight: 700;
        color: #92400e;
        margin-bottom: 12px;
        position: relative;
      }

      .reward-ticket__close {
        background: #92400e;
        color: #fef3c7;
        border: none;
        border-radius: 16px;
        padding: 10px 32px;
        font-family: 'M PLUS Rounded 1c', sans-serif;
        font-size: 0.9rem;
        font-weight: 700;
        cursor: pointer;
        position: relative;
        -webkit-tap-highlight-color: transparent;
      }

      @keyframes fadeIn {
        0% { opacity: 0; }
        100% { opacity: 1; }
      }
    </style>
  `,oe(t),setTimeout(()=>{o?It():jt(),Dt(),ai([100,50,100])},300),bi(t,i,l);const u=()=>{$e=!1,window.removeEventListener("hashchange",u)};window.addEventListener("hashchange",u)}function yi(e,t,i){let o="";for(let r=0;r<i;r++)r<t?o+=`<div class="stamp-cell stamp-cell--filled">${e.renderStamp(!0)}</div>`:r===t?o+='<div class="stamp-cell stamp-cell--current"></div>':o+='<div class="stamp-cell"></div>';return o}function bi(e,t,i){const o=e.querySelector("#result-next-btn"),r=e.querySelector("#result-overlay"),n=e.querySelector("#stamp-sheet-view");o&&r&&n&&o.addEventListener("click",()=>{r.style.display="none",n.style.display="flex",i&&setTimeout(()=>{wi(e)},800)});const a=e.querySelector("#home-btn");a&&a.addEventListener("click",()=>G("home"));const s=e.querySelector("#retry-btn");s&&s.addEventListener("click",()=>{const p=R();G("timer",{theme:t,minutes:String(p.defaultMinutes)})});const l=e.querySelector("#reward-close-btn");l&&l.addEventListener("click",()=>{const p=e.querySelector("#reward-overlay");p&&(p.style.display="none")})}function wi(e){const t=e.querySelector("#reward-overlay");t&&(t.style.display="flex",Nt(),mi(e,6e3))}let X=null,K=null,De=null,H=!1,Re=[],Ae=[],ze=[];function Q(){return X||(X=new(window.AudioContext||window.webkitAudioContext)),X.state==="suspended"&&X.resume(),X}function ve(){if(!K){const e=Q();K=e.createGain(),K.gain.setValueAtTime(.5,e.currentTime),K.connect(e.destination)}return K}function Ne(){const e=Q(),t=e.sampleRate*2,i=e.createBuffer(1,t,e.sampleRate),o=i.getChannelData(0);for(let r=0;r<t;r++)o[r]=Math.random()*2-1;return i}function L(e){return Re.push(e),e}function Ue(e){return ze.push(e),e}function Ce(e){return Ae.push(e),e}function vi(){ze.forEach(e=>{try{e.stop()}catch{}try{e.disconnect()}catch{}}),ze=[],Re.forEach(e=>{try{e.disconnect()}catch{}}),Re=[],Ae.forEach(e=>clearTimeout(e)),Ae=[]}function ki(){const e=Q(),t=ve(),i=Ne(),o=e.createBufferSource();o.buffer=i,o.loop=!0,Ue(o);const r=e.createBiquadFilter();r.type="bandpass",r.frequency.setValueAtTime(3e3,e.currentTime),r.Q.setValueAtTime(.8,e.currentTime),L(r);const n=e.createGain();n.gain.setValueAtTime(.25,e.currentTime),L(n),o.connect(r),r.connect(n),n.connect(t),o.start();function a(){if(!H)return;const l=e.currentTime,p=.15+Math.random()*.15;n.gain.linearRampToValueAtTime(p,l+1),Ce(window.setTimeout(a,800+Math.random()*1200))}a();function s(){if(!H)return;const l=e.currentTime,p=e.createBuffer(1,Math.ceil(e.sampleRate*.04),e.sampleRate),h=p.getChannelData(0);for(let g=0;g<h.length;g++)h[g]=Math.random()*2-1;const c=e.createBufferSource();c.buffer=p;const d=e.createBiquadFilter();d.type="bandpass",d.frequency.setValueAtTime(2e3+Math.random()*3e3,l),d.Q.setValueAtTime(5,l);const u=e.createGain();u.gain.setValueAtTime(.08+Math.random()*.07,l),u.gain.exponentialRampToValueAtTime(.001,l+.04),c.connect(d),d.connect(u),u.connect(t),c.start(l),c.stop(l+.05);const f=300+Math.random()*700;Ce(window.setTimeout(s,f))}s()}function _i(){const e=Q(),t=ve(),i=Ne(),o=e.createBufferSource();o.buffer=i,o.loop=!0,Ue(o);const r=e.createBiquadFilter();r.type="lowpass",r.frequency.setValueAtTime(800,e.currentTime),r.Q.setValueAtTime(1,e.currentTime),L(r);const n=e.createOscillator();n.type="sine",n.frequency.setValueAtTime(.1,e.currentTime),L(n);const a=e.createGain();a.gain.setValueAtTime(450,e.currentTime),L(a),r.frequency.setValueAtTime(750,e.currentTime),n.connect(a),a.connect(r.frequency);const s=e.createGain();s.gain.setValueAtTime(.2,e.currentTime),L(s);const l=e.createGain();l.gain.setValueAtTime(.1,e.currentTime),L(l),n.connect(l),l.connect(s.gain),o.connect(r),r.connect(s),s.connect(t),n.start(),o.start()}function Si(){const e=Q(),t=ve(),i=857,o=.08,r=.06,n=.18,a=Ne(),s=e.createBufferSource();s.buffer=a,s.loop=!0,Ue(s);const l=e.createBiquadFilter();l.type="lowpass",l.frequency.setValueAtTime(200,e.currentTime),L(l);const p=e.createGain();p.gain.setValueAtTime(.03,e.currentTime),L(p),s.connect(l),l.connect(p),p.connect(t),s.start();function h(){if(!H)return;const c=e.currentTime,d=e.createOscillator();d.type="sine",d.frequency.setValueAtTime(60,c),d.frequency.exponentialRampToValueAtTime(40,c+o);const u=e.createGain();u.gain.setValueAtTime(0,c),u.gain.linearRampToValueAtTime(.3,c+.01),u.gain.exponentialRampToValueAtTime(.001,c+o),d.connect(u),u.connect(t),d.start(c),d.stop(c+o+.01);const f=e.createOscillator();f.type="sine",f.frequency.setValueAtTime(75,c+n),f.frequency.exponentialRampToValueAtTime(50,c+n+r);const g=e.createGain();g.gain.setValueAtTime(0,c+n),g.gain.linearRampToValueAtTime(.2,c+n+.01),g.gain.exponentialRampToValueAtTime(.001,c+n+r),f.connect(g),g.connect(t),f.start(c+n),f.stop(c+n+r+.01),Ce(window.setTimeout(h,i))}h()}function $i(e){switch(H&&xe(),De=e,H=!0,e){case"rain":ki();break;case"wave":_i();break;case"heartbeat":Si();break}}function xe(){H=!1,De=null,vi()}function Ti(e){const t=Math.max(0,Math.min(1,e)),i=ve(),o=Q();i.gain.linearRampToValueAtTime(t,o.currentTime+.05)}function Mi(){return De}let M=null,J=0,pe=!0,he=null;const Li=[{type:"rain",emoji:"🌧️",label:"あめ"},{type:"wave",emoji:"🌊",label:"うみ"},{type:"heartbeat",emoji:"💗",label:"しんぞう"}];function Ei(){const e=Y();E(),e.innerHTML=`
    <div class="screen screen-enter cooldown-screen" id="cooldown-screen">
      <!-- Close button -->
      <button class="cooldown-close" id="cooldown-close" aria-label="とじる">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      <!-- Cooldown Header -->
      <div class="cooldown-header">
        <h1 class="cooldown-title">おちつきモード</h1>
        <p class="cooldown-subtitle">しんこきゅう してみよう</p>
      </div>

      <!-- Stars background -->
      <div class="cooldown-stars">
        ${Array.from({length:30},(t,i)=>`
          <div class="cooldown-star" style="
            left: ${Math.random()*100}%;
            top: ${Math.random()*100}%;
            animation-delay: ${Math.random()*3}s;
            animation-duration: ${2+Math.random()*3}s;
            width: ${1+Math.random()*3}px;
            height: ${1+Math.random()*3}px;
          "></div>
        `).join("")}
      </div>

      <!-- Breathing Circle -->
      <div class="breathing-area">
        <div class="breathing-circle" id="breathing-circle">
          <div class="breathing-circle__inner">
            <div class="breathing-text" id="breathing-text">すって...</div>
          </div>
        </div>
      </div>

      <!-- Timer Selection -->
      <div class="cooldown-timer-select" id="timer-select">
        <button class="cooldown-timer-btn" data-duration="180">3ぷん</button>
        <button class="cooldown-timer-btn" data-duration="300">5ぷん</button>
      </div>

      <!-- Timer Display (hidden until started) -->
      <div class="cooldown-timer" id="cooldown-timer" style="display: none;">
        <span id="cooldown-time-display">03:00</span>
      </div>

      <!-- Sound Selector -->
      <div class="sound-selector">
        <div class="sound-buttons">
          ${Li.map(t=>`
            <button class="sound-btn" data-sound="${t.type}">
              <span class="sound-btn__emoji">${t.emoji}</span>
              <span class="sound-btn__label">${t.label}</span>
            </button>
          `).join("")}
        </div>
        <div class="volume-control">
          <span class="volume-icon">🔈</span>
          <input type="range" class="volume-slider" id="volume-slider" 
                 min="0" max="100" value="50" step="5">
          <span class="volume-icon">🔊</span>
        </div>
      </div>
    </div>

    <style>
      .cooldown-screen {
        position: fixed;
        inset: 0;
        background: linear-gradient(180deg, #0f0a2e 0%, #1e1b4b 40%, #312e81 100%);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 24px;
        padding: 24px 16px;
        box-sizing: border-box;
        z-index: 150;
        overflow: hidden;
      }

      .cooldown-header {
        text-align: center;
        z-index: 5;
        margin-top: calc(48px + env(safe-area-inset-top, 0px));
        font-family: 'M PLUS Rounded 1c', sans-serif;
      }

      .cooldown-title {
        color: #fff;
        font-size: 1.5rem;
        font-weight: 900;
        margin: 0 0 6px 0;
        text-shadow: 0 2px 8px rgba(0,0,0,0.5);
      }

      .cooldown-subtitle {
        color: #bae6fd;
        font-size: 0.85rem;
        font-weight: 700;
        margin: 0;
        opacity: 0.8;
      }

      .cooldown-close {
        position: absolute;
        top: calc(16px + env(safe-area-inset-top, 0px));
        right: 16px;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: none;
        background: rgba(255,255,255,0.1);
        color: rgba(255,255,255,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 10;
        transition: all 0.2s;
        -webkit-tap-highlight-color: transparent;
      }

      .cooldown-close:hover {
        background: rgba(255,255,255,0.2);
        color: #fff;
      }

      /* Stars */
      .cooldown-stars {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }

      .cooldown-star {
        position: absolute;
        border-radius: 50%;
        background: #fff;
        animation: starTwinkle ease-in-out infinite alternate;
      }

      @keyframes starTwinkle {
        0% { opacity: 0.2; }
        100% { opacity: 0.8; }
      }

      /* Breathing */
      .breathing-area {
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 1;
        position: relative;
      }

      .breathing-circle {
        width: 180px;
        height: 180px;
        border-radius: 50%;
        background: radial-gradient(circle, hsla(240, 60%, 65%, 0.8) 0%, hsla(263, 70%, 50%, 0.4) 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 60px hsla(263, 70%, 55%, 0.3),
                    0 0 120px hsla(263, 70%, 55%, 0.15);
        transition: transform 4s ease-in-out, box-shadow 4s ease-in-out;
      }

      .breathing-circle.inhale {
        transform: scale(1.5);
        box-shadow: 0 0 80px hsla(263, 70%, 55%, 0.5),
                    0 0 160px hsla(263, 70%, 55%, 0.25);
      }

      .breathing-circle.exhale {
        transform: scale(1);
        box-shadow: 0 0 40px hsla(263, 70%, 55%, 0.2),
                    0 0 80px hsla(263, 70%, 55%, 0.1);
      }

      .breathing-circle__inner {
        text-align: center;
      }

      .breathing-text {
        color: rgba(255,255,255,0.9);
        font-size: 1.2rem;
        font-weight: 700;
        font-family: 'M PLUS Rounded 1c', sans-serif;
        transition: opacity 0.5s ease;
      }

      /* Timer Select */
      .cooldown-timer-select {
        display: flex;
        gap: 16px;
        z-index: 5;
      }

      .cooldown-timer-btn {
        padding: 12px 32px;
        border-radius: 24px;
        border: 2px solid rgba(255,255,255,0.3);
        background: rgba(255,255,255,0.1);
        color: rgba(255,255,255,0.9);
        font-family: 'M PLUS Rounded 1c', sans-serif;
        font-size: 1rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
        -webkit-tap-highlight-color: transparent;
      }

      .cooldown-timer-btn:hover {
        background: rgba(255,255,255,0.2);
        border-color: rgba(255,255,255,0.5);
      }

      .cooldown-timer-btn:active {
        transform: scale(0.95);
      }

      .cooldown-timer-btn--active {
        background: rgba(255,255,255,0.25);
        border-color: rgba(255,255,255,0.6);
      }

      /* Timer Display */
      .cooldown-timer {
        font-size: 1.2rem;
        font-weight: 400;
        color: rgba(255,255,255,0.35);
        font-family: 'M PLUS Rounded 1c', sans-serif;
        z-index: 5;
      }

      /* Sound Selector */
      .sound-selector {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        width: 100%;
        max-width: 320px;
        padding-bottom: env(safe-area-inset-bottom, 8px);
        z-index: 5;
      }

      .sound-buttons {
        display: flex;
        gap: 10px;
      }

      .sound-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        padding: 10px 18px;
        border-radius: 20px;
        border: 2px solid rgba(255,255,255,0.15);
        background: rgba(255,255,255,0.05);
        color: rgba(255,255,255,0.7);
        font-family: 'M PLUS Rounded 1c', sans-serif;
        font-size: 0.7rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.2s;
        -webkit-tap-highlight-color: transparent;
      }

      .sound-btn__emoji {
        font-size: 1.5rem;
      }

      .sound-btn.active {
        background: rgba(255,255,255,0.15);
        border-color: rgba(255,255,255,0.4);
        color: #fff;
      }

      .volume-control {
        display: flex;
        align-items: center;
        gap: 8px;
        width: 100%;
      }

      .volume-icon {
        font-size: 1rem;
        opacity: 0.6;
      }

      .volume-slider {
        flex: 1;
        -webkit-appearance: none;
        appearance: none;
        height: 6px;
        border-radius: 3px;
        background: rgba(255,255,255,0.15);
        outline: none;
      }

      .volume-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: rgba(255,255,255,0.8);
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      }
    </style>
  `,Ai(e),Ri(e)}function Ri(e){const t=e.querySelector("#breathing-circle"),i=e.querySelector("#breathing-text");!t||!i||(pe=!0,ot(t,i),he=setInterval(()=>{pe=!pe,ot(t,i)},4e3))}function ot(e,t){pe?(e.classList.remove("exhale"),e.classList.add("inhale"),t.textContent="すって..."):(e.classList.remove("inhale"),e.classList.add("exhale"),t.textContent="はいて...")}function Ai(e){const t=e.querySelector("#cooldown-close");t&&t.addEventListener("click",()=>{rt(),window.history.length>1?window.history.back():G("home")}),e.querySelectorAll(".cooldown-timer-btn").forEach(r=>{r.addEventListener("click",()=>{const n=parseInt(r.dataset.duration||"180",10);zi(e,n),e.querySelectorAll(".cooldown-timer-btn").forEach(a=>a.classList.remove("cooldown-timer-btn--active")),r.classList.add("cooldown-timer-btn--active")})}),e.querySelectorAll(".sound-btn").forEach(r=>{r.addEventListener("click",()=>{const n=r.dataset.sound;Mi()===n?(xe(),r.classList.remove("active")):(xe(),e.querySelectorAll(".sound-btn").forEach(s=>s.classList.remove("active")),$i(n),r.classList.add("active"))})});const i=e.querySelector("#volume-slider");i&&i.addEventListener("input",()=>{Ti(parseInt(i.value,10)/100)});const o=()=>{rt(),window.removeEventListener("hashchange",o)};window.addEventListener("hashchange",o)}function zi(e,t){M&&clearInterval(M),J=t;const i=e.querySelector("#cooldown-timer"),o=e.querySelector("#cooldown-time-display"),r=e.querySelector("#timer-select");i&&(i.style.display="block"),o&&(o.textContent=me(J)),M=setInterval(()=>{J--,o&&(o.textContent=me(J)),J<=0&&(M&&clearInterval(M),M=null,Ut(),i&&(i.style.display="none"),r&&(r.style.display="flex"),e.querySelectorAll(".cooldown-timer-btn").forEach(n=>n.classList.remove("cooldown-timer-btn--active")))},1e3)}function rt(){xe(),M&&(clearInterval(M),M=null),he&&(clearInterval(he),he=null)}let yt=!1,Te=null;function Ci(){const e=Y();if(E(),!yt){qi(e);return}F(e)}function qi(e){const t=ni();e.innerHTML=`
    ${ie({showBack:!0,showCooldown:!1,title:"ほごしゃ せってい"})}
    <div class="screen screen-enter" id="lock-screen">
      <div class="pin-modal">
        <div class="pin-modal__icon">🔒</div>
        <h2 class="pin-modal__title">おとなのかた へ</h2>
        <p class="pin-modal__desc">もんだいに こたえてください</p>
        <div class="pin-modal__quiz">${t.question}</div>
        <input type="number" class="pin-modal__input" id="lock-answer" 
               inputmode="numeric" placeholder="こたえ" autocomplete="off">
        <div class="pin-modal__error" id="lock-error" style="display: none;">
          ちがいます。もういちど。
        </div>
        <button class="pin-modal__btn" id="lock-submit">かくにん</button>
      </div>
    </div>

    <style>
      #lock-screen {
        padding: calc(56px + env(safe-area-inset-top, 0px) + 16px) 16px 24px;
        min-height: 100vh;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .pin-modal {
        background: #fff;
        border-radius: 28px;
        padding: 40px 32px;
        text-align: center;
        box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        width: 100%;
        max-width: 340px;
      }

      .pin-modal__icon { font-size: 3rem; margin-bottom: 12px; }
      .pin-modal__title { font-size: 1.3rem; font-weight: 900; margin: 0 0 8px; color: #374151; }
      .pin-modal__desc { font-size: 0.9rem; color: #9ca3af; margin: 0 0 20px; }

      .pin-modal__quiz {
        font-size: 2rem;
        font-weight: 900;
        color: hsl(263, 70%, 55%);
        margin-bottom: 20px;
        font-family: 'M PLUS Rounded 1c', sans-serif;
      }

      .pin-modal__input {
        width: 100%;
        max-width: 160px;
        height: 56px;
        border: 3px solid #e5e7eb;
        border-radius: 16px;
        font-size: 2rem;
        font-weight: 900;
        text-align: center;
        font-family: 'M PLUS Rounded 1c', sans-serif;
        outline: none;
        transition: border-color 0.2s;
        box-sizing: border-box;
      }

      .pin-modal__input:focus { border-color: hsl(263, 70%, 55%); }

      .pin-modal__error {
        color: #ef4444;
        font-size: 0.85rem;
        font-weight: 700;
        margin-top: 8px;
      }

      .pin-modal__btn {
        display: block;
        width: 100%;
        max-width: 200px;
        margin: 20px auto 0;
        height: 48px;
        border: none;
        border-radius: 24px;
        background: linear-gradient(135deg, hsl(263, 70%, 55%), hsl(263, 70%, 65%));
        color: #fff;
        font-family: 'M PLUS Rounded 1c', sans-serif;
        font-size: 1rem;
        font-weight: 700;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }

      .pin-modal__btn:active { transform: scale(0.97); }
    </style>
  `,oe(e);const i=e.querySelector("#lock-submit"),o=e.querySelector("#lock-answer"),r=e.querySelector("#lock-error"),n=()=>{parseInt((o==null?void 0:o.value)||"",10)===t.answer?(yt=!0,F(e)):(r&&(r.style.display="block"),o&&(o.value="",o.style.borderColor="#ef4444",setTimeout(()=>{o&&(o.style.borderColor="#e5e7eb")},1e3)))};i==null||i.addEventListener("click",n),o==null||o.addEventListener("keypress",a=>{a.key==="Enter"&&n()})}async function F(e){const t=R(),i=Bt(),o=be(),r=await Gt();e.innerHTML=`
    ${ie({showBack:!0,showCooldown:!1,title:"⚙️ ほごしゃ せってい"})}
    <div class="screen screen-enter settings-screen" id="settings-screen">

      <!-- Weekly Stats -->
      <section class="settings-section">
        <h3 class="settings-section__title">📊 こんしゅうの きろく</h3>
        <div class="log-summary">
          <div class="stat-card">
            <div class="stat-card__value">${i.attempts}</div>
            <div class="stat-card__label">チャレンジ</div>
          </div>
          <div class="stat-card stat-card--success">
            <div class="stat-card__value">${i.completions}</div>
            <div class="stat-card__label">せいこう</div>
          </div>
          <div class="stat-card stat-card--accent">
            <div class="stat-card__value">${i.stamps}</div>
            <div class="stat-card__label">スタンプ</div>
          </div>
          <div class="stat-card stat-card--info">
            <div class="stat-card__value">${o.completedSheets}</div>
            <div class="stat-card__label">シートクリア</div>
          </div>
        </div>
      </section>

      <!-- Stamp Goal -->
      <section class="settings-section">
        <h3 class="settings-section__title">⭐ スタンプシートのマスかず</h3>
        <div class="radio-group" id="stamp-goal-group">
          ${[5,10,20].map(n=>`
            <label class="radio-option ${t.stampGoal===n?"radio-option--active":""}">
              <input type="radio" name="stampGoal" value="${n}" 
                     ${t.stampGoal===n?"checked":""}>
              <span class="radio-option__label">${n}マス</span>
              <span class="radio-option__hint">${n===5?"かんたん":n===10?"ふつう":"チャレンジ"}</span>
            </label>
          `).join("")}
        </div>
      </section>

      <!-- Rewards -->
      <section class="settings-section">
        <h3 class="settings-section__title">🎁 ごほうびテキスト</h3>
        <div class="reward-editor">
          <div class="reward-list" id="reward-list">
            ${t.rewards.map((n,a)=>`
              <div class="reward-item" data-index="${a}">
                <span class="reward-item__text">${je(n)}</span>
                <button class="reward-item__delete" data-index="${a}">×</button>
              </div>
            `).join("")}
          </div>
          <div class="reward-add">
            <input type="text" class="reward-input" id="reward-input" 
                   placeholder="あたらしいごほうび..." maxlength="50">
            <button class="reward-add-btn" id="reward-add-btn">＋</button>
          </div>
        </div>
      </section>

      <!-- Voice Recording -->
      <section class="settings-section">
        <h3 class="settings-section__title">🎙️ おうえんボイス</h3>
        <p class="settings-hint">のこり1ぷんで じどうさいせいされます（さいだい10びょう×3つ）</p>
        <div class="recording-slots" id="recording-slots">
          ${Bi(r)}
        </div>
      </section>

    </div>

    <style>
      .settings-screen {
        padding: calc(56px + env(safe-area-inset-top, 0px) + 16px) 16px 32px;
        min-height: 100vh;
        box-sizing: border-box;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
      }

      .settings-section {
        background: #fff;
        border-radius: 20px;
        padding: 20px;
        margin-bottom: 16px;
        box-shadow: 0 2px 12px rgba(0,0,0,0.06);
      }

      .settings-section__title {
        font-size: 1rem;
        font-weight: 700;
        color: #374151;
        margin: 0 0 14px;
      }

      .settings-hint {
        font-size: 0.75rem;
        color: #9ca3af;
        margin: -8px 0 12px;
      }

      /* Stats */
      .log-summary {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }

      .stat-card {
        background: linear-gradient(135deg, hsl(263, 40%, 96%) 0%, hsl(263, 40%, 92%) 100%);
        border-radius: 16px;
        padding: 16px 12px;
        text-align: center;
      }

      .stat-card--success { background: linear-gradient(135deg, hsl(145, 40%, 95%) 0%, hsl(145, 40%, 90%) 100%); }
      .stat-card--accent { background: linear-gradient(135deg, hsl(45, 60%, 95%) 0%, hsl(45, 60%, 90%) 100%); }
      .stat-card--info { background: linear-gradient(135deg, hsl(200, 40%, 95%) 0%, hsl(200, 40%, 90%) 100%); }

      .stat-card__value {
        font-size: 2rem;
        font-weight: 900;
        color: #374151;
      }

      .stat-card__label {
        font-size: 0.75rem;
        font-weight: 700;
        color: #9ca3af;
        margin-top: 4px;
      }

      /* Radio Group */
      .radio-group {
        display: flex;
        gap: 10px;
      }

      .radio-option {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 14px 8px;
        border-radius: 16px;
        border: 2px solid #e5e7eb;
        background: #fafafa;
        cursor: pointer;
        transition: all 0.2s;
        -webkit-tap-highlight-color: transparent;
      }

      .radio-option input { display: none; }

      .radio-option--active {
        border-color: hsl(263, 70%, 55%);
        background: hsl(263, 70%, 97%);
      }

      .radio-option__label {
        font-size: 1.1rem;
        font-weight: 900;
        color: #374151;
      }

      .radio-option__hint {
        font-size: 0.65rem;
        color: #9ca3af;
        margin-top: 2px;
      }

      /* Rewards */
      .reward-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 12px;
      }

      .reward-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 10px 14px;
        background: #f9fafb;
        border-radius: 12px;
      }

      .reward-item__text {
        font-size: 0.9rem;
        font-weight: 700;
        color: #374151;
        flex: 1;
      }

      .reward-item__delete {
        width: 28px;
        height: 28px;
        border: none;
        border-radius: 50%;
        background: #fee2e2;
        color: #ef4444;
        font-size: 1rem;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        -webkit-tap-highlight-color: transparent;
      }

      .reward-add {
        display: flex;
        gap: 8px;
      }

      .reward-input {
        flex: 1;
        height: 44px;
        border: 2px solid #e5e7eb;
        border-radius: 14px;
        padding: 0 14px;
        font-family: 'M PLUS Rounded 1c', sans-serif;
        font-size: 0.9rem;
        outline: none;
        box-sizing: border-box;
      }

      .reward-input:focus { border-color: hsl(263, 70%, 55%); }

      .reward-add-btn {
        width: 44px;
        height: 44px;
        border: none;
        border-radius: 14px;
        background: hsl(263, 70%, 55%);
        color: #fff;
        font-size: 1.3rem;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        -webkit-tap-highlight-color: transparent;
      }

      /* Recording */
      .recording-slots {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .recording-slot {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px;
        background: #f9fafb;
        border-radius: 16px;
      }

      .recording-slot__num {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: hsl(263, 40%, 92%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.8rem;
        font-weight: 900;
        color: hsl(263, 70%, 55%);
        flex-shrink: 0;
      }

      .recording-slot__info {
        flex: 1;
        min-width: 0;
      }

      .recording-slot__label {
        font-size: 0.85rem;
        font-weight: 700;
        color: #374151;
      }

      .recording-slot__duration {
        font-size: 0.7rem;
        color: #9ca3af;
      }

      .recording-slot__actions {
        display: flex;
        gap: 6px;
      }

      .rec-action-btn {
        width: 36px;
        height: 36px;
        border: none;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 1rem;
        -webkit-tap-highlight-color: transparent;
        transition: all 0.2s;
      }

      .rec-btn-record {
        background: #fee2e2;
        color: #ef4444;
      }

      .rec-btn-record.is-recording {
        background: #ef4444;
        color: #fff;
        animation: recPulse 1s ease-in-out infinite;
      }

      @keyframes recPulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.3); }
        50% { box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
      }

      .rec-btn-play { background: #dbeafe; color: #3b82f6; }
      .rec-btn-delete { background: #fee2e2; color: #ef4444; }
      .rec-action-btn:active { transform: scale(0.9); }
    </style>
  `,oe(e),Pi(e)}function Bi(e){const t=[];for(let i=0;i<3;i++){const o=e.find(n=>n.id===`recording-${i+1}`),r=`recording-${i+1}`;o?t.push(`
        <div class="recording-slot" data-slot="${r}">
          <div class="recording-slot__num">${i+1}</div>
          <div class="recording-slot__info">
            <div class="recording-slot__label">${je(o.label||`ろくおん ${i+1}`)}</div>
            <div class="recording-slot__duration">${o.duration.toFixed(1)}びょう</div>
          </div>
          <div class="recording-slot__actions">
            <button class="rec-action-btn rec-btn-play" data-play="${r}">▶</button>
            <button class="rec-action-btn rec-btn-record" data-record="${r}">⏺</button>
            <button class="rec-action-btn rec-btn-delete" data-delete="${r}">🗑</button>
          </div>
        </div>
      `):t.push(`
        <div class="recording-slot" data-slot="${r}">
          <div class="recording-slot__num">${i+1}</div>
          <div class="recording-slot__info">
            <div class="recording-slot__label" style="color: #9ca3af;">みろくおん</div>
          </div>
          <div class="recording-slot__actions">
            <button class="rec-action-btn rec-btn-record" data-record="${r}">⏺</button>
          </div>
        </div>
      `)}return t.join("")}function Pi(e){const t=e.querySelector("#stamp-goal-group");t&&t.querySelectorAll('input[name="stampGoal"]').forEach(r=>{r.addEventListener("change",()=>{var a;const n=R();n.stampGoal=parseInt(r.value,10),ae(n),t.querySelectorAll(".radio-option").forEach(s=>s.classList.remove("radio-option--active")),(a=r.closest(".radio-option"))==null||a.classList.add("radio-option--active")})});const i=e.querySelector("#reward-input"),o=e.querySelector("#reward-add-btn");if(i&&o){const r=()=>{const n=i.value.trim();if(!n)return;const a=R();a.rewards.push(n),ae(a),i.value="",F(e)};o.addEventListener("click",r),i.addEventListener("keypress",n=>{n.key==="Enter"&&r()})}e.querySelectorAll(".reward-item__delete").forEach(r=>{r.addEventListener("click",()=>{const n=parseInt(r.dataset.index||"0",10),a=R();a.rewards.splice(n,1),ae(a),F(e)})}),Gi(e)}function Gi(e){e.querySelectorAll("[data-record]").forEach(t=>{t.addEventListener("click",async()=>{const i=t.dataset.record;if(Ze()==="recording"){t.classList.remove("is-recording");try{const r=await ii();Te&&clearInterval(Te);const n={id:i,label:`おうえん ${i.split("-")[1]}`,duration:r.size>0?10:0,createdAt:new Date().toISOString()};await Pt(i,r,n),F(e)}catch{console.error("Recording save failed")}return}if(!Ie()){alert("この端末では録音がサポートされていません");return}try{await ti(),t.classList.add("is-recording"),t.textContent="⏹";const r=setInterval(()=>{Ze()!=="recording"&&(clearInterval(r),t.classList.remove("is-recording"),t.textContent="⏺")},500);Te=r}catch{alert("マイクへのアクセスが許可されていません")}})}),e.querySelectorAll("[data-play]").forEach(t=>{t.addEventListener("click",async()=>{const i=t.dataset.play;try{const o=await pt(i);o&&await mt(o.blob)}catch{console.error("Playback failed")}})}),e.querySelectorAll("[data-delete]").forEach(t=>{t.addEventListener("click",async()=>{const i=t.dataset.delete;confirm("この録音を削除しますか？")&&(await Ot(i),F(e))})})}window.addEventListener("hashchange",()=>{});function Oi(){const e=()=>{E(),document.removeEventListener("touchstart",e),document.removeEventListener("click",e)};document.addEventListener("touchstart",e,{once:!0}),document.addEventListener("click",e,{once:!0})}function Ii(){"serviceWorker"in navigator&&window.addEventListener("load",()=>{navigator.serviceWorker.register("./sw.js").catch(()=>{})})}function ji(){Oi(),Ii(),W("home",e=>Ft()),W("timer",e=>si(e)),W("stamp",e=>xi(e)),W("cooldown",()=>Ei()),W("settings",()=>Ci()),$t()}document.addEventListener("DOMContentLoaded",ji);
