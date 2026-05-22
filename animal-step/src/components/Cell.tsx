import React from 'react';
import clsx from 'clsx';
import type { Piece, AnimalType } from '../types/game';
import { ANIMAL_EMOJIS } from '../utils/constants';

interface CellProps {
  piece: Piece | null;
  isValidMove: boolean;
  isValidDrop: boolean;
  isSelected: boolean;
  isLastMoveFrom?: boolean;
  isLastMoveTo?: boolean;
  onClick: () => void;
}

// Direction dots helper (TC, BC, etc.)
// Index mapping for a 3x3 grid:
// 0 (TL)  1 (TC)  2 (TR)
// 3 (ML)  4 (C)   5 (MR)
// 6 (BL)  7 (BC)  8 (BR)
const getDirectionDots = (type: AnimalType, isPromoted: boolean): boolean[] => {
  if (isPromoted && type !== 'lion') {
    // Promoted moves: Gold General (TL, TC, TR, ML, MR, BC)
    return [true, true, true, true, false, true, false, true, false];
  }
  switch (type) {
    case 'lion':
      return [true, true, true, true, false, true, true, true, true];
    case 'boar':
      return [false, true, false, false, false, false, false, true, false];
    case 'rabbit':
      return [true, false, true, false, false, false, false, true, false];
    case 'monkey':
      return [false, true, false, true, false, true, false, true, false];
    case 'fox':
      return [false, true, false, true, false, true, true, false, true];
    default:
      return Array(9).fill(false);
  }
};

export const Cell: React.FC<CellProps> = ({
  piece,
  isValidMove,
  isValidDrop,
  isSelected,
  isLastMoveFrom = false,
  isLastMoveTo = false,
  onClick,
}) => {
  const dots = piece ? getDirectionDots(piece.type, piece.isPromoted) : [];

  return (
    <div
      onClick={onClick}
      className={clsx(
        'relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 flex items-center justify-center rounded-xl cursor-pointer transition-all duration-200',
        'border border-[#c2b280] bg-[#e8f5e9] shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]',
        {
          'hover:bg-[#c8e6c9]': !isValidMove && !isValidDrop && !isSelected && !isLastMoveFrom && !isLastMoveTo,
          'bg-[#fffde7] border-[#fbc02d] ring-4 ring-[#fff59d]/50': isSelected,
          'bg-[#e1f5fe] border-[#29b6f6] ring-4 ring-[#81d4fa]/30': isValidMove || isValidDrop,
          // Highlight target cell of last move
          'bg-[#fff9c4] border-[#ffa000] ring-2 ring-[#ffe082]/50': isLastMoveTo && !isSelected && !isValidMove && !isValidDrop,
          // Highlight origin cell of last move (which is now empty)
          'bg-[#efebe9]/50 border-2 border-dashed border-[#bcaaa4]': isLastMoveFrom && !isSelected && !isValidMove && !isValidDrop,
        }
      )}
    >
      {/* Piece Tile */}
      {piece && (
        <div
          className={clsx(
            'relative w-[85%] h-[85%] rounded-xl flex flex-col items-center justify-center select-none transition-all duration-300 border-2 shadow-md',
            {
              // Rotated 180 degrees for Player 2
              'rotate-180': piece.owner === 2,
              'scale-105 shadow-lg': isSelected,
              // Styling for Promoted vs Normal pieces
              'bg-gradient-to-br from-[#ffe082] to-[#ffb300] border-[#ff8f00] text-[#5d4037]': piece.isPromoted,
              'bg-[#fffdd0] border-[#d2b48c] text-gray-800': !piece.isPromoted,
            }
          )}
        >
          {/* 3x3 Grid Overlay for Move Dots */}
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 p-1 pointer-events-none">
            {dots.map((hasDot, index) => {
              if (index === 4) return <div key={index} />; // Center is empty
              return (
                <div key={index} className="flex items-center justify-center">
                  {hasDot && (
                    <span
                      className={clsx(
                        'w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.2)]',
                        piece.isPromoted ? 'bg-[#d32f2f]' : 'bg-[#e65100]'
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Animal Emoji */}
          <div className="text-3.5xl sm:text-4.5xl md:text-5xl filter drop-shadow-sm">
            {ANIMAL_EMOJIS[piece.type]}
          </div>
        </div>
      )}

      {/* Empty Cell Highlights */}
      {(isValidMove || isValidDrop) && !piece && (
        <div className="absolute w-5 h-5 bg-[#29b6f6] rounded-full opacity-40 animate-pulse"></div>
      )}
    </div>
  );
};
