import React from 'react';
import type { BoardState, Position } from '../types/game';
import { Cell } from './Cell';
import type { LastMoveInfo } from '../hooks/useGame';

interface BoardProps {
  board: BoardState;
  selectedPos: Position | null;
  validMoves: Position[];
  validDrops: Position[];
  lastMove: LastMoveInfo | null;
  onSquareClick: (x: number, y: number) => void;
}

export const Board: React.FC<BoardProps> = ({
  board,
  selectedPos,
  validMoves,
  validDrops,
  lastMove,
  onSquareClick,
}) => {
  return (
    <div className="bg-[#4a3623] p-3 sm:p-4 rounded-xl shadow-2xl flex flex-col gap-1 sm:gap-2">
      {board.map((row, y) => (
        <div key={`row-${y}`} className="flex gap-1 sm:gap-2">
          {row.map((piece, x) => {
            const isSelected = selectedPos?.x === x && selectedPos?.y === y;
            const isValidMove = validMoves.some((m) => m.x === x && m.y === y);
            const isValidDrop = validDrops.some((d) => d.x === x && d.y === y);

            const isLastMoveFrom = lastMove?.from?.x === x && lastMove?.from?.y === y;
            const isLastMoveTo = lastMove?.to.x === x && lastMove?.to.y === y;

            return (
              <Cell
                key={`cell-${x}-${y}`}
                piece={piece}
                isSelected={isSelected}
                isValidMove={isValidMove}
                isValidDrop={isValidDrop}
                isLastMoveFrom={isLastMoveFrom}
                isLastMoveTo={isLastMoveTo}
                onClick={() => onSquareClick(x, y)}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};
