import React, { useState } from 'react';
import clsx from 'clsx';
import { useGame } from '../hooks/useGame';
import { Board } from './Board';
import { Hand } from './Hand';
import { RulesModal } from './RulesModal';
import type { AIDifficulty } from '../types/game';

const DIFFICULTY_OPTIONS: { value: AIDifficulty; label: string; emoji: string; description: string }[] = [
  { value: 'weak', label: 'よわい', emoji: '🌱', description: '40%ランダムにうごくよ' },
  { value: 'somewhat_weak', label: 'ややよわい', emoji: '🌿', description: 'さきをちょっとよむよ' },
  { value: 'somewhat_strong', label: 'ややつよい', emoji: '🌳', description: 'しっかりかんがえるよ' },
  { value: 'strong', label: 'つよい', emoji: '🔥', description: 'さきをよんでくるよ' },
  { value: 'very_strong', label: 'とてもつよい', emoji: '⚡', description: 'てごわいぞ！' },
];

const DIFFICULTY_LABELS: Record<AIDifficulty, string> = {
  weak: 'よわい',
  somewhat_weak: 'ややよわい',
  somewhat_strong: 'ややつよい',
  strong: 'つよい',
  very_strong: 'とてもつよい',
};

export const GameScreen: React.FC = () => {
  const {
    board,
    turn,
    winner,
    hands,
    mode,
    difficulty,
    selectedPos,
    selectedHandPieceId,
    validMoves,
    validDrops,
    isAIThinking,
    isGameStarted,
    lastMove,
    canUndo,
    handleSquareClick,
    handleHandPieceClick,
    resetGame,
    startGame,
    backToMenu,
    undo,
  } = useGame();

  const [selectedDifficulty, setSelectedDifficulty] = useState<AIDifficulty>('somewhat_weak');
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  // ======== SETUP MENU ========
  if (!isGameStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#e8f5e9] to-[#c8e6c9] flex flex-col items-center justify-center px-4 py-8 font-sans">
        {/* Title */}
        <div className="text-center mb-6">
          <h1 className="text-5xl sm:text-6xl font-black text-[#2e7d32] tracking-wide drop-shadow-sm animate-bounce duration-1000">
            🌳 どうぶつステップ 🌳
          </h1>
          <p className="text-base sm:text-lg text-[#558b2f] mt-3 font-semibold">
            どうぶつたちをうごかして、あいてのライオンをつかまえよう！
          </p>
        </div>

        {/* Rule Button */}
        <button
          onClick={() => setIsRulesOpen(true)}
          className="mb-8 px-6 py-2.5 bg-white text-[#2e7d32] font-black rounded-full shadow-md border-2 border-[#a5d6a7] hover:bg-[#e8f5e9] active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
        >
          <span>📖</span> ルールをみる
        </button>

        {/* Mode Selection Cards */}
        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl">
          {/* Two Player Mode */}
          <button
            onClick={() => startGame('local', 'weak')}
            className="flex-1 bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border-2 border-[#a5d6a7] hover:border-[#66bb6a] hover:shadow-xl transition-all active:scale-[0.98] cursor-pointer group flex flex-col items-center text-center"
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">👫</div>
            <h2 className="text-2xl font-black text-[#2e7d32] mb-2">2人であそぶ</h2>
            <p className="text-sm text-gray-500">1つの画面をつかって、おやこやともだちと対面でたいせん！</p>
          </button>

          {/* VS AI Mode */}
          <div className="flex-1 bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border-2 border-[#a5d6a7]">
            <div className="text-5xl mb-4 text-center">🤖</div>
            <h2 className="text-2xl font-black text-[#2e7d32] mb-4 text-center">1人であそぶ</h2>
            <p className="text-sm text-gray-500 mb-4 text-center">コンピュータとたいせん！むずかしさをえらんでね。</p>

            {/* Difficulty Selector */}
            <div className="flex flex-col gap-2 mb-5">
              {DIFFICULTY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedDifficulty(opt.value)}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 transition-all text-left w-full',
                    selectedDifficulty === opt.value
                      ? 'border-[#66bb6a] bg-[#e8f5e9] shadow-md'
                      : 'border-gray-200 bg-white hover:border-[#a5d6a7] hover:bg-[#f1f8e9]'
                  )}
                >
                  <span className="text-2xl">{opt.emoji}</span>
                  <div>
                    <div className="font-bold text-gray-800 text-sm">{opt.label}</div>
                    <div className="text-xs text-gray-400">{opt.description}</div>
                  </div>
                  {selectedDifficulty === opt.value && (
                    <span className="ml-auto text-[#43a047] text-xl">✓</span>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={() => startGame('vs-ai', selectedDifficulty)}
              className="w-full py-3 bg-[#43a047] hover:bg-[#2e7d32] text-white text-lg font-bold rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              このつよさであそぶ！
            </button>
          </div>
        </div>

        {/* Rules Modal */}
        <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
      </div>
    );
  }

  // ======== GAME PLAY ========
  const isAITurn = mode === 'vs-ai' && turn === 2 && !winner;

  return (
    <div className="min-h-screen bg-[#f1f8e9] flex flex-col items-center py-4 sm:py-8 px-2 font-sans">
      {/* Title Header */}
      <div className="text-center mb-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#2e7d32] tracking-wide drop-shadow-sm">
          🌳 どうぶつステップ 🌳
        </h1>
        {mode === 'vs-ai' && (
          <p className="text-xs sm:text-sm text-[#558b2f] mt-1 font-semibold">
            VS コンピュータ（{DIFFICULTY_LABELS[difficulty]}）
          </p>
        )}
        {mode === 'local' && (
          <p className="text-xs sm:text-sm text-[#558b2f] mt-1 font-semibold">
            2人たいせん
          </p>
        )}
      </div>

      {/* Control Panel (Replacing absolute top buttons for much better mobile layout) */}
      <div className="flex flex-wrap gap-2 justify-center mb-4 max-w-md w-full">
        <button
          onClick={() => setIsRulesOpen(true)}
          className="px-4 py-2 bg-white hover:bg-[#e8f5e9] text-[#2e7d32] border border-[#a5d6a7] font-bold rounded-full shadow-sm text-xs sm:text-sm active:scale-95 transition-all cursor-pointer flex items-center gap-1"
        >
          <span>📖</span> ルール
        </button>
        <button
          onClick={undo}
          disabled={!canUndo}
          className={clsx(
            "px-4 py-2 font-bold rounded-full shadow-sm text-xs sm:text-sm active:scale-95 transition-all cursor-pointer flex items-center gap-1 border",
            canUndo
              ? "bg-[#fff8e1] hover:bg-[#fff0c2] text-[#e65100] border-[#ffe082]"
              : "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed active:scale-100"
          )}
        >
          <span>↩️</span> 待った
        </button>
        <button
          onClick={resetGame}
          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold rounded-full shadow-sm text-xs sm:text-sm active:scale-95 transition-all cursor-pointer flex items-center gap-1"
        >
          <span>🔄</span> 最初から
        </button>
        <button
          onClick={backToMenu}
          className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-300 font-bold rounded-full shadow-sm text-xs sm:text-sm active:scale-95 transition-all cursor-pointer flex items-center gap-1"
        >
          <span>🚪</span> メニュー
        </button>
      </div>

      <div className="w-full max-w-lg flex flex-col items-center gap-4 sm:gap-6 relative px-2 flex-1 justify-center">

        {/* Player 2 (Top / Parent or AI) Hand */}
        <Hand
          player={2}
          pieces={hands[2]}
          isTurn={turn === 2}
          selectedPieceId={turn === 2 && mode === 'local' ? selectedHandPieceId : null}
          onPieceClick={(id) => handleHandPieceClick(2, id)}
          isUpsideDown={mode === 'local'}
          label={mode === 'vs-ai' ? 'コンピュータ' : undefined}
        />

        {/* AI Thinking Indicator */}
        {isAIThinking && (
          <div className="flex items-center gap-2 text-[#558b2f] font-bold text-sm animate-pulse">
            <span className="text-xl animate-bounce">🤔</span> コンピュータがかんがえちゅう...
          </div>
        )}

        {/* Main Board Container */}
        <div className="p-2 sm:p-3 bg-[#8d6e63] rounded-2xl shadow-xl border-4 border-[#5d4037]">
          <Board
            board={board}
            selectedPos={selectedPos}
            validMoves={isAITurn ? [] : validMoves}
            validDrops={isAITurn ? [] : validDrops}
            lastMove={lastMove}
            onSquareClick={handleSquareClick}
          />
        </div>

        {/* Player 1 (Bottom / Child) Hand */}
        <Hand
          player={1}
          pieces={hands[1]}
          isTurn={turn === 1}
          selectedPieceId={turn === 1 ? selectedHandPieceId : null}
          onPieceClick={(id) => handleHandPieceClick(1, id)}
          isUpsideDown={false}
          label={mode === 'vs-ai' ? 'あなた' : undefined}
        />

      </div>

      {/* Rules Modal */}
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      {/* Winner Overlay */}
      {winner && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center transform scale-100 animate-in zoom-in-90 duration-300 border-4 border-[#fff176]">
            <h2 className="text-3xl sm:text-4xl font-black text-[#fbc02d] drop-shadow-md mb-2">
              {mode === 'vs-ai'
                ? winner === 1 ? 'あなたのかち！' : 'コンピュータのかち！'
                : `プレイヤー ${winner} のかち！`
              }
            </h2>
            <div className="text-6xl my-6 animate-bounce">
              {mode === 'vs-ai' && winner === 2 ? '😢💪' : '👑🏆🎉'}
            </div>
            <div className="flex gap-3">
              <button
                onClick={resetGame}
                className="px-6 py-3 bg-[#2e7d32] hover:bg-[#1b5e20] text-white text-lg font-bold rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              >
                もういちど
              </button>
              <button
                onClick={backToMenu}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-lg font-bold rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95 border border-gray-200 cursor-pointer"
              >
                メニューへ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
