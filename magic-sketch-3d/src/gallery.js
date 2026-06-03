import { audioManager } from './audio.js';

// IndexedDB の設定
const DB_NAME = 'MagicSketch3DDB';
const DB_VERSION = 1;
const STORE_NAME = 'characters';

class GalleryDatabase {
  constructor() {
    this.db = null;
  }

  // データベースの初期化
  init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = (e) => {
        console.error('IndexedDB open error:', e);
        reject(e);
      };
      
      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve();
      };
      
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          // キーは ID (UUID または タイムスタンプ)
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
    });
  }

  // キャラクターの保存
  // 3dModel は GLBの ArrayBuffer データを想定
  saveCharacter(charData) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }
      
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(transaction.objectStoreNames[0]);
      
      const dataToSave = {
        id: charData.id || `char-${Date.now()}`,
        name: charData.name || 'なまえなし',
        image2d: charData.image2d, // DataURL (PNG)
        modelData: charData.modelData, // ArrayBuffer (GLB)
        createdAt: charData.createdAt || new Date().toISOString()
      };
      
      const request = store.put(dataToSave);
      
      request.onsuccess = () => {
        audioManager.playSuccess();
        resolve(dataToSave);
      };
      
      request.onerror = (e) => {
        reject(e);
      };
    });
  }

  // 全キャラクターの取得 (作成日の降順)
  getAllCharacters() {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }
      
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = (e) => {
        const result = e.target.result;
        // 日時降順でソートして返す
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        resolve(result);
      };
      
      request.onerror = (e) => {
        reject(e);
      };
    });
  }

  // キャラクターの削除
  deleteCharacter(id) {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }
      
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      
      request.onsuccess = () => {
        audioManager.playDelete();
        resolve();
      };
      
      request.onerror = (e) => {
        reject(e);
      };
    });
  }
}

// データベースシングルトン
export const galleryDB = new GalleryDatabase();

// --- 音声名前入力 (Web Speech API) 管理 ---
export class SpeechNameRecognizer {
  constructor(inputElementId, micButtonId) {
    this.input = document.getElementById(inputElementId);
    this.btn = document.getElementById(micButtonId);
    this.recognition = null;
    this.isListening = false;
    
    this.initSpeech();
  }

  initSpeech() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // 非対応ブラウザの場合はマイクボタンを隠す
      this.btn.style.display = 'none';
      return;
    }
    
    this.recognition = new SpeechRecognition();
    this.recognition.lang = 'ja-JP';
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;
    
    // イベント
    this.recognition.onstart = () => {
      this.isListening = true;
      this.btn.textContent = '🔴';
      this.btn.classList.add('pulse-active');
      this.input.placeholder = 'こえ を きいているよ...';
      audioManager.playTap();
    };
    
    this.recognition.onend = () => {
      this.isListening = false;
      this.btn.textContent = '🎤';
      this.btn.classList.remove('pulse-active');
      this.input.placeholder = 'なまえをつけてね';
    };
    
    this.recognition.onresult = (e) => {
      const resultText = e.results[0][0].transcript;
      // 句読点をトリム
      const cleanText = resultText.replace(/[。、.!?]/g, '');
      this.input.value = cleanText;
      audioManager.playSuccess();
    };
    
    this.recognition.onerror = (e) => {
      console.warn("Speech recognition error:", e.error);
      this.input.placeholder = 'うまくききとれなかったよ';
    };

    // マイクボタンのイベント
    this.btn.addEventListener('click', () => {
      this.toggleListening();
    });
  }

  toggleListening() {
    if (!this.recognition) return;
    
    if (this.isListening) {
      this.recognition.stop();
    } else {
      this.recognition.start();
    }
  }
}
