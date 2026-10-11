/**
 * apiClient.js
 * Gemini API + 画像生成API クライアント
 * APIキーが未設定の場合は高品質プリセット／モックデータを返す
 */

import { loadApiKey } from './storage.js';
import { getPresetPuzzle } from './presets.js';

/**
 * 実行時に LocalStorage または 環境変数 から APIキー を取得する
 */
function getApiKey() {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  return loadApiKey() || envKey || '';
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

入力テキスト:「${text}」`;

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
            temperature: 0.4,
          },
        }),
      }
    );

    if (!res.ok) {
      console.warn(`Gemini API returned ${res.status}, falling back to mock.`);
      return mockTranslate(text);
    }

    const data = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    // JSON文字列の抽出（コードブロックのトリム対応）
    const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    console.error('Gemini API error, using mock:', err);
    return mockTranslate(text);
  }
}

/**
 * プロンプトから画像を生成する
 * @param {string} prompt - 英語プロンプト
 * @returns {Promise<string>} 画像URLまたはdataURL
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
          instances: [{
            prompt: `${prompt}, extremely simple flat 2D icon, pure white background, bold outlines, solid bright colors, no gradients, minimal vector style`
          }],
          parameters: {
            sampleCount: 1,
            aspectRatio: '1:1',
          },
        }),
      }
    );

    if (!res.ok) {
      console.warn(`Imagen API error ${res.status}, using mock`);
      return generateMockImage(prompt);
    }

    const data = await res.json();
    const base64 = data?.predictions?.[0]?.bytesBase64Encoded;
    if (base64) {
      return `data:image/png;base64,${base64}`;
    }
    return generateMockImage(prompt);
  } catch (err) {
    console.error('Image API error, using mock:', err);
    return generateMockImage(prompt);
  }
}

// ============ モック関数 ============

const NG_WORDS = ['死', '殺', '血', 'こわい', 'ばか', 'アホ', 'うんこ', 'うんち', '戦争', '銃', 'ナイフ'];

function mockTranslate(text) {
  // 簡易NGチェック
  for (const w of NG_WORDS) {
    if (text.includes(w)) {
      return {
        safe: false,
        prompt: '',
        message: 'そのことばは まほうにつかえないよ！\nたのしいことばにしてみてね！'
      };
    }
  }

  return {
    safe: true,
    prompt: text,
    message: `「${text}」のまほうをかけるよ！\nちょっとまっててね！✨`
  };
}

/**
 * モック画像を生成する。プリセットピクセルアートからCanvasに描画してDataURLを返す
 */
export async function generateMockImage(query) {
  const preset = getPresetPuzzle(query);
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const scale = 128 / preset.gridSize;

  for (let y = 0; y < preset.gridSize; y++) {
    for (let x = 0; x < preset.gridSize; x++) {
      const cell = preset.grid[y][x];
      ctx.fillStyle = preset.palette[cell.colorIndex] || '#1A1A2E';
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
  }

  return canvas.toDataURL('image/png');
}
