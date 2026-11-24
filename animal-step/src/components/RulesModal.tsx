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
            🌳 ゲームの あそびかた
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
              <span>🌟</span> どうぶつステップって なに？
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">
              1つの がめんを はさんで、おやこで むかいあって あそぶ ミニ<ruby>将棋<rt>しょうぎ</rt></ruby>ゲームだよ。<br />
              かんたんな ルールで、つぎの てを よむ <ruby>力<rt>ちから</rt></ruby>や かんがえる <ruby>力<rt>ちから</rt></ruby>が たのしく そだつよ！
            </p>
          </div>

          {/* Win Conditions */}
          <div className="bg-[#e8f5e9] p-4 rounded-2xl border border-[#c8e6c9] shadow-sm">
            <h3 className="font-extrabold text-[#2e7d32] text-base mb-2.5 flex items-center gap-1.5">
              <span>🏆</span> かちまけの ルール
            </h3>
            <ul className="space-y-2 text-xs sm:text-sm font-semibold text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-[#2e7d32]">・</span>
                <span>あいての「ライオン {ANIMAL_EMOJIS.lion}」を つかまえたら かち！</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#2e7d32]">・</span>
                <span>じぶんの「ライオン {ANIMAL_EMOJIS.lion}」が、あいての いちばん おくの れつに たどりついても かち！</span>
              </li>
            </ul>
          </div>

          {/* Evolution Rules */}
          <div className="bg-[#fffde7] p-4 rounded-2xl border border-[#fff59d] shadow-sm">
            <h3 className="font-extrabold text-[#fbc02d] text-base mb-2 flex items-center gap-1.5">
              <span>✨</span> <ruby>進化<rt>しんか</rt></ruby>（パワーアップ）
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium mb-2">
              ライオン いがいの どうぶつは、<b>あいての いちばん おくの れつ</b>に はいると、<ruby>金色<rt>きんいろ</rt></ruby>の わくに かわって <b>「<ruby>進化<rt>しんか</rt></ruby>」</b> するよ！
            </p>
            <ul className="space-y-1.5 text-xs sm:text-sm font-semibold text-gray-700">
              <li className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#dc2626] shadow-sm shrink-0" />
                <span><ruby>進化<rt>しんか</rt></ruby>すると、うごける むきが「ななめうしろ」いがいの 6つの むきに パワーアップ！</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600">・</span>
                <span><ruby>進化<rt>しんか</rt></ruby>している どうぶつが つかまると、もとの すがたに もどって あいての もちごまに なるよ。</span>
              </li>
            </ul>
          </div>

          {/* Drop Rules */}
          <div className="bg-white p-4 rounded-2xl border border-[#e0dcd3] shadow-sm">
            <h3 className="font-extrabold text-[#1565c0] text-base mb-1.5 flex items-center gap-1.5">
              <span>🤝</span> なかま（もちごま）を おく
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed font-medium">
              つかまえた あいての どうぶつは、じぶんの ばんの ときに、ばんの うえの <b>あいている すきな マス</b>に おいて、また なかまとして うごかせるよ！
            </p>
          </div>

          {/* Piece Movement details */}
          <div>
            <h3 className="font-extrabold text-[#8d6e63] text-base mb-3 flex items-center gap-1.5 border-b pb-1 border-gray-200">
              <span>🐾</span> どうぶつたちの うごきかた
            </h3>
            <p className="text-xs text-gray-400 mb-3 font-semibold leading-relaxed">
              ※ コマの まわりに ある「オレンジの <ruby>点<rt>てん</rt></ruby>」が うごける むきだよ。（<ruby>進化<rt>しんか</rt></ruby>すると「<ruby>赤<rt>あか</rt></ruby>の <ruby>点<rt>てん</rt></ruby>」に かわるよ）
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Lion */}
              <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-center gap-3">
                <span className="text-3xl">{ANIMAL_EMOJIS.lion}</span>
                <div>
                  <div className="font-bold text-gray-800 text-sm">ライオン</div>
                  <div className="text-xs text-gray-500 font-medium">すべての むき（8つの むき）に 1マス</div>
                </div>
              </div>
              {/* Boar */}
              <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-center gap-3">
                <span className="text-3xl">{ANIMAL_EMOJIS.boar}</span>
                <div>
                  <div className="font-bold text-gray-800 text-sm">イノシシ</div>
                  <div className="text-xs text-gray-500 font-medium">まえ と うしろ に 1マス</div>
                </div>
              </div>
              {/* Rabbit */}
              <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-center gap-3">
                <span className="text-3xl">{ANIMAL_EMOJIS.rabbit}</span>
                <div>
                  <div className="font-bold text-gray-800 text-sm">ウサギ</div>
                  <div className="text-xs text-gray-500 font-medium">ななめまえ（2つ）と まうしろ に 1マス</div>
                </div>
              </div>
              {/* Monkey */}
              <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-center gap-3">
                <span className="text-3xl">{ANIMAL_EMOJIS.monkey}</span>
                <div>
                  <div className="font-bold text-gray-800 text-sm">サル</div>
                  <div className="text-xs text-gray-500 font-medium">まえ、うしろ、みぎ、ひだり に 1マス</div>
                </div>
              </div>
              {/* Fox */}
              <div className="bg-white p-3 rounded-xl border border-gray-100 flex items-center gap-3">
                <span className="text-3xl">{ANIMAL_EMOJIS.fox}</span>
                <div>
                  <div className="font-bold text-gray-800 text-sm">キツネ</div>
                  <div className="text-xs text-gray-500 font-medium">まえ、みぎ、ひだり、ななめうしろ に 1マス</div>
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
            ルールを とじる
          </button>
        </div>
      </div>
    </div>
  );
};
