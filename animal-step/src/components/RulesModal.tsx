import React from 'react';
import { ANIMAL_EMOJIS } from '../utils/constants';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-[#faf8f5] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border-4 border-[#8d6e63] flex flex-col max-h-[85vh] transform scale-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-[#8d6e63] px-6 py-4 flex items-center justify-between text-white border-b-2 border-[#5d4037]">
          <h2 className="text-xl sm:text-2xl font-black tracking-wide flex items-center gap-2">
            🌳 ゲームのあそびかた
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 transition-all flex items-center justify-center font-bold text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-gray-800 text-sm sm:text-base scrollbar-thin">
          
          {/* Concept Section */}
          <div className="bg-white p-4 rounded-2xl border border-[#e0dcd3] shadow-sm">
            <h3 className="font-extrabold text-[#2e7d32] text-base mb-1.5 flex items-center gap-1.5">
              <span>🌟</span> どうぶつステップとは？
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">
              1つの画面をはさんで、おやこで対面してあそぶターン制のミニ将棋ゲームです。<br />
              シンプルなルールで、先を読む力や論理的思考を楽しく育みます。
            </p>
          </div>

          {/* Win Conditions */}
          <div className="bg-[#e8f5e9] p-4 rounded-2xl border border-[#c8e6c9] shadow-sm">
            <h3 className="font-extrabold text-[#2e7d32] text-base mb-2.5 flex items-center gap-1.5">
              <span>🏆</span> かちまけのルール（しょうりじょうけん）
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm font-semibold text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-[#2e7d32]">・</span>
                <span>あいての「ライオン {ANIMAL_EMOJIS.lion}」をつかまえたら勝ち！</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#2e7d32]">・</span>
                <span>自分の「ライオン {ANIMAL_EMOJIS.lion}」が、あいての一番おくの列にたどりついても勝ち！</span>
              </li>
            </ul>
          </div>

          {/* Evolution Rules */}
          <div className="bg-[#fffde7] p-4 rounded-2xl border border-[#fff59d] shadow-sm">
            <h3 className="font-extrabold text-[#fbc02d] text-base mb-2 flex items-center gap-1.5">
              <span>✨</span> しんか（成る）システム
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium mb-2">
              ライオン以外のどうぶつは、<b>あいての一番おくの列</b>に入ると、ゴールドに輝く<b>「進化」</b>状態になります！
            </p>
            <ul className="space-y-1.5 text-xs sm:text-sm font-semibold text-gray-700">
              <li className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#d32f2f] shadow-sm" />
                <span>進化すると、動ける方向が「ななめうしろ」以外の6方向にパワーアップ！</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600">・</span>
                <span>進化しているどうぶつがつかまると、元の姿（未進化）に戻ってあいての持ち駒になります。</span>
              </li>
            </ul>
          </div>

          {/* Drop Rules */}
          <div className="bg-white p-4 rounded-2xl border border-[#e0dcd3] shadow-sm">
            <h3 className="font-extrabold text-[#1565c0] text-base mb-1.5 flex items-center gap-1.5">
              <span>🤝</span> なかま（持ち駒）をおく
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">
              つかまえた相手のどうぶつは、自分の手番のときに、盤面の<b>あいている好きなマス</b>に置いてふたたび活躍させることができます！
            </p>
          </div>

          {/* Piece Movement details */}
          <div>
            <h3 className="font-extrabold text-[#8d6e63] text-base mb-3 flex items-center gap-1.5 border-b pb-1 border-gray-200">
              <span>🐾</span> どうぶつたちのうごきかた
            </h3>
            <p className="text-xs text-gray-400 mb-3 font-semibold">
              ※ コマのまわりにある「オレンジの点」がうごける方向です。（進化すると「赤の点」に変わります）
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Lion */}
              <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-center gap-3">
                <span className="text-3xl">{ANIMAL_EMOJIS.lion}</span>
                <div>
                  <div className="font-bold text-gray-800 text-sm">ライオン</div>
                  <div className="text-xs text-gray-500 font-medium">すべての方向（8方向）に1マス</div>
                </div>
              </div>
              {/* Boar */}
              <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-center gap-3">
                <span className="text-3xl">{ANIMAL_EMOJIS.boar}</span>
                <div>
                  <div className="font-bold text-gray-800 text-sm">イノシシ</div>
                  <div className="text-xs text-gray-500 font-medium">まえ と うしろ</div>
                </div>
              </div>
              {/* Rabbit */}
              <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-center gap-3">
                <span className="text-3xl">{ANIMAL_EMOJIS.rabbit}</span>
                <div>
                  <div className="font-bold text-gray-800 text-sm">ウサギ</div>
                  <div className="text-xs text-gray-500 font-medium">ななめまえ(2つ) と まうしろ</div>
                </div>
              </div>
              {/* Monkey */}
              <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-center gap-3">
                <span className="text-3xl">{ANIMAL_EMOJIS.monkey}</span>
                <div>
                  <div className="font-bold text-gray-800 text-sm">サル</div>
                  <div className="text-xs text-gray-500 font-medium">まえ、うしろ、みぎ、ひだり</div>
                </div>
              </div>
              {/* Fox */}
              <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-center gap-3">
                <span className="text-3xl">{ANIMAL_EMOJIS.fox}</span>
                <div>
                  <div className="font-bold text-gray-800 text-sm">キツネ</div>
                  <div className="text-xs text-gray-500 font-medium">まえ、みぎ、ひだり、ななめうしろ</div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#8d6e63] hover:bg-[#5d4037] text-white font-bold rounded-full transition-all active:scale-95 cursor-pointer text-sm shadow-sm"
          >
            ルールをとじる
          </button>
        </div>
      </div>
    </div>
  );
};
