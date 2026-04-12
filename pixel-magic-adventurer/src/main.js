/**
 * main.js — アプリエントリーポイント・ルーティング
 */
import './style.css';
import { createHomeScreen, homeScreenCSS } from './screens/HomeScreen.js';
import { createSpellScreen, spellScreenCSS } from './screens/SpellScreen.js';
import { createPuzzleScreen, puzzleScreenCSS } from './screens/PuzzleScreen.js';
import { createGalleryScreen, galleryScreenCSS } from './screens/GalleryScreen.js';
import { translateToPrompt, generateImage } from './logic/apiClient.js';
import { pixelateImage, generateMockPuzzle } from './logic/pixelate.js';
import { loadWipPuzzle } from './logic/storage.js';

// ============ 画面別CSSを動的に注入 ============
const styleEl = document.createElement('style');
styleEl.textContent = [homeScreenCSS, spellScreenCSS, puzzleScreenCSS, galleryScreenCSS].join('\n');
document.head.appendChild(styleEl);

// ============ 状態復元処理 ============
function handleResumeWip() {
  try {
    const wip = loadWipPuzzle();
    if (wip) {
      navigate('puzzle');
      puzzleScreen._initPuzzle(wip.puzzleData, wip.title);
    } else {
      alert("No WIP data found!");
    }
  } catch (err) {
    console.error(err);
    alert("Error resuming: " + err.message);
  }
}

// ============ App DOM構造 ============
const app = document.getElementById('app');

// ローディングオーバーレイ
const loadingEl = document.createElement('div');
loadingEl.className = 'loading-overlay hidden';
loadingEl.innerHTML = `
  <div class="loading-spinner"></div>
  <div class="loading-text" id="loading-msg">よみこみちゅう…</div>
`;
document.body.appendChild(loadingEl);

// トースト
const toastEl = document.createElement('div');
toastEl.className = 'toast hidden';
document.body.appendChild(toastEl);

// ============ 画面インスタンスを生成 ============
const homeScreen   = createHomeScreen({ 
  onStart: () => navigate('spell'), 
  onGallery: () => navigate('gallery'),
  onResume: handleResumeWip
});
const spellScreen  = createSpellScreen({ onBack: () => navigate('home'), onGenerate: handleGenerate });
const puzzleScreen = createPuzzleScreen({ onBack: () => navigate('home'), onComplete: () => navigate('gallery') });
const galleryScreen = createGalleryScreen({ onBack: () => navigate('home'), onNewArt: () => navigate('spell'), onReplay: handleReplay });

app.appendChild(homeScreen);
app.appendChild(spellScreen);
app.appendChild(puzzleScreen);
app.appendChild(galleryScreen);

// ============ ルーティング ============
const screens = {
  home:    homeScreen,
  spell:   spellScreen,
  puzzle:  puzzleScreen,
  gallery: galleryScreen,
};

let currentScreen = 'home';

function navigate(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
  currentScreen = name;

  if (name === 'gallery') {
    galleryScreen._refresh();
  } else if (name === 'home' && homeScreen._refresh) {
    homeScreen._refresh();
  } else if (name === 'spell' && spellScreen._refresh) {
    spellScreen._refresh();
  }
}

// 初期画面
navigate('home');

// ============ 画像生成フロー ============
async function handleGenerate(text) {
  showLoading(`「${text}」のえをつくってるよ！\nまほうをかけてるかんじ✨`);

  try {
    // 1. テキスト → プロンプト変換（Gemini / モック）
    const { safe, prompt, message } = await translateToPrompt(text);

    if (!safe) {
      hideLoading();
      showToast(message || 'そのことばはつかえないよ！');
      return;
    }

    updateLoadingMsg('えをかいてるよ✏️\nもうすこしまってね！');

    // 2. 画像生成
    const imageUrl = await generateImage(prompt);

    updateLoadingMsg('パズルをつくってるよ🧩');

    // 3. ピクセル化処理
    let puzzleData;
    try {
      puzzleData = await pixelateImage(imageUrl, 12);
    } catch (e) {
      console.warn('pixelateImage failed, using mock:', e);
      puzzleData = generateMockPuzzle();
    }

    hideLoading();

    // 4. パズル画面へ遷移
    navigate('puzzle');
    puzzleScreen._initPuzzle(puzzleData, text);

  } catch (err) {
    console.error('Generation error:', err);
    hideLoading();

    // エラー時もモックパズルで遊べるようにする
    const puzzleData = generateMockPuzzle();
    navigate('puzzle');
    puzzleScreen._initPuzzle(puzzleData, text);
    showToast('AIがつかれてるみたい😅 かんたんなえで あそぼう！');
  }
}

// ============ ギャラリーからリプレイ ============
function handleReplay(item) {
  // solved状態をリセットして再挑戦できるようにする
  const freshGrid = item.grid.map(row =>
    row.map(cell => ({ ...cell, solved: false }))
  );
  const puzzleData = {
    palette: item.palette,
    grid: freshGrid,
    gridSize: freshGrid.length,
  };
  navigate('puzzle');
  puzzleScreen._initPuzzle(puzzleData, item.title);
}

function showLoading(msg) {
  loadingEl.querySelector('#loading-msg').innerHTML = msg.replace(/\n/g, '<br>');
  loadingEl.classList.remove('hidden');
}

function updateLoadingMsg(msg) {
  loadingEl.querySelector('#loading-msg').innerHTML = msg.replace(/\n/g, '<br>');
}

function hideLoading() {
  loadingEl.classList.add('hidden');
}

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.remove('hidden');
  setTimeout(() => toastEl.classList.add('hidden'), 3000);
}
