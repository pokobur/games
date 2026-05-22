import React from 'react';
import clsx from 'clsx';
import type { Piece, Player } from '../types/game';
import { ANIMAL_EMOJIS } from '../utils/constants';

interface HandProps {
  player: Player;
  pieces: Piece[];
  isTurn: boolean;
  selectedPieceId: string | null;
  onPieceClick: (pieceId: string) => void;
  isUpsideDown?: boolean;
  label?: string; // Custom label like "あなた" or "コンピュータ"
}

export const Hand: React.FC<HandProps> = ({
  player,
  pieces,
  isTurn,
  selectedPieceId,
  onPieceClick,
  isUpsideDown = false,
  label,
}) => {
  const displayName = label || `プレイヤー ${player}`;

  return (
    <div
      className={clsx(
        'w-full max-w-sm p-3 sm:p-4 rounded-xl flex flex-col items-center gap-2 transition-colors',
        {
          'bg-[#fffbe6] border-2 border-[#e6c138] shadow-[0_0_15px_rgba(230,193,56,0.3)]': isTurn,
          'bg-[#f5f5f5] border-2 border-transparent': !isTurn,
          'rotate-180': isUpsideDown,
        }
      )}
    >
      <div className="font-bold text-base sm:text-lg text-gray-700">
        {displayName}のなかま {isTurn && <span className="text-[#e6c138]">（ばんだよ）</span>}
      </div>
      
      <div className="flex flex-wrap gap-2 justify-center min-h-[3.5rem]">
        {pieces.length === 0 ? (
          <div className="text-gray-400 italic flex items-center justify-center text-sm">
            （なかまはいないよ）
          </div>
        ) : (
          pieces.map((piece) => (
            <div
              key={piece.id}
              onClick={() => onPieceClick(piece.id)}
              className={clsx(
                'w-12 h-12 flex items-center justify-center rounded-lg cursor-pointer text-3xl transition-all shadow-sm bg-white border border-gray-100',
                {
                  'ring-4 ring-[#4dabf5] scale-110 shadow-md': selectedPieceId === piece.id,
                  'hover:bg-gray-50 hover:shadow-md': selectedPieceId !== piece.id && isTurn,
                  'opacity-50 cursor-not-allowed': !isTurn,
                }
              )}
            >
              {ANIMAL_EMOJIS[piece.type]}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
