/**
 * apiClient.js
 * Gemini API + 画像生成API クライアント
 * APIキーが未設定の場合はモックデータを返す
 */

import { loadApiKey } from './storage.js';

/**
 * 実行時に LocalStorage または 環境変数 から APIキー を取得する
 */
function getApiKey() {
  return loadApiKey() || '';
}

/**
 * 音声テキストを安全チェックして英語プロンプトに変換する
 * @param {string} text - 日本語テキスト
 * @returns {Promise<{prompt: string, safe: boolean, message: string}>}
 */
export async function translateToPrompt(text) {
  const apiKey = getApiKey();
  if (!apiKey) {
    // モック: APIキーなしの場合
    return mockTranslate(text);
  }

  const systemPrompt = `あなたは子供向けアプリのAIアシスタントです。
ユーザーの入力テキストを確認して以下のJSONを返してください：
- safe: boolean（子供向けに適切かどうか）
- prompt: string（英語の画像生成プロンプト。「a very simple 2D flat vector icon of a [subject], thick black outlines, bold solid colors, isolated on pure white background, no shading, no details, child friendly, kawaii」を必ずベースにしてください。ドット絵(16x16)に変換するため、写真や複雑な絵は絶対にNGです）
- message: string（日本語でユーザーへのメッセージ）

入力:「${text}」`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: {
            response_mime_type: 'application/json',
            temperature: 0.7,
          },
        }),
      }
    );
    if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
    const data = await res.json();
    const jsonText = data.candidates[0].content.parts[0].text;
    return JSON.parse(jsonText);
  } catch (err) {
    console.error('Gemini API error:', err);
    return mockTranslate(text);
  }
}

/**
 * プロンプトから画像を生成する
 * @param {string} prompt - 英語プロンプト
 * @returns {Promise<string>} 画像URL
 */
export async function generateImage(prompt) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return generateMockImage(prompt);
  }

  // Gemini Imagen API を使用
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt: prompt + ', isolated on a pure white background, extremely simple flat shape, thick outlines, plain solid colors, no gradients, minimal details' }],
          parameters: {
            sampleCount: 1,
            aspectRatio: '1:1',
          },
        }),
      }
    );
    if (!res.ok) throw new Error(`Imagen API error: ${res.status}`);
    const data = await res.json();
    const base64 = data.predictions[0].bytesBase64Encoded;
    return `data:image/png;base64,${base64}`;
  } catch (err) {
    console.error('Image API error:', err);
    return generateMockImage(prompt);
  }
}

// ============ モック関数 ============

const MOCK_SUBJECTS = {
  'ドラゴン': 'dragon',   'ねこ': 'cat',      'いぬ': 'dog',
  'りんご':  'apple',    'たいよう': 'sun',   'ほし': 'star',
  'きょうりゅう': 'dinosaur', 'うさぎ': 'rabbit', 'くも': 'cloud',
  'はな': 'flower',      'さかな': 'fish',    'ふね': 'boat',
  'ロケット': 'rocket',   'ケーキ': 'cake',   'にじ': 'rainbow',
};

function mockTranslate(text) {
  // 危険ワードの簡易チェック
  const ngWords = ['こわい', 'ちち', 'おかあさん', '死', '殺'];
  for (const w of ngWords) {
    if (text.includes(w)) {
      return { safe: false, prompt: '', message: 'そのことばはつかえないよ！ほかのことばをためしてね！' };
    }
  }
  let subject = '';
  for (const [jp, en] of Object.entries(MOCK_SUBJECTS)) {
    if (text.includes(jp)) { subject = en; break; }
  }
  if (!subject) subject = text || 'magical creature';
  const prompt = `a very simple 2D flat vector icon of a cute ${subject}, thick black outlines, bold solid colors, isolated on pure white background, no shading, no details, child friendly, kawaii`;
  return { safe: true, prompt, message: `「${text}」のえをつくるよ！まってね！` };
}

async function generateMockImage(prompt) {
  // カラフルなプレースホルダー画像を生成（Canvas）
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // 背景グラデーション（ソリッドカラーのみ）
  const colors = ['#FF6B35', '#FFD60A', '#06D6A0', '#4CC9F0', '#7B2FBE', '#EF233C'];
  const gridS = 16;
  const cellW = canvas.width / gridS;
  const cellH = canvas.height / gridS;

  // ランダムシードをpromptから生成
  let seed = 0;
  for (const c of prompt) seed = (seed * 31 + c.charCodeAt(0)) % 1000;

  function pseudoRand(n) {
    seed = (seed * 1664525 + 1013904223) % 2147483647;
    return Math.abs(seed % n);
  }

  // 背景
  ctx.fillStyle = '#1A1A2E';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // カラフルなブロック
  for (let y = 0; y < gridS; y++) {
    for (let x = 0; x < gridS; x++) {
      if (pseudoRand(3) !== 0) {
        ctx.fillStyle = colors[pseudoRand(colors.length)];
        ctx.fillRect(x * cellW, y * cellH, cellW - 1, cellH - 1);
      }
    }
  }

  // 中央にテキスト
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🎨', canvas.width / 2, canvas.height / 2);

  return canvas.toDataURL('image/png');
}
