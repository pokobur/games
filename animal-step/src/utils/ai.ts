import type { BoardState, Piece, Player, Position, AIDifficulty } from '../types/game';
import { getValidMoves, getValidDrops, checkWinCondition } from './gameLogic';

export type AIMove =
  | { type: 'move'; from: Position; to: Position }
  | { type: 'drop'; pieceId: string; to: Position };

// Get all possible moves for a player
export const getAllPossibleMoves = (
  board: BoardState,
  hands: { 1: Piece[]; 2: Piece[] },
  player: Player
): AIMove[] => {
  const moves: AIMove[] = [];

  // 1. Board moves
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[y].length; x++) {
      const piece = board[y][x];
      if (piece && piece.owner === player) {
        const validTargets = getValidMoves(board, x, y);
        for (const target of validTargets) {
          moves.push({
            type: 'move',
            from: { x, y },
            to: target,
          });
        }
      }
    }
  }

  // 2. Hand drops
  const playerHand = hands[player];
  if (playerHand.length > 0) {
    const validDrops = getValidDrops(board, player);
    // Group by piece type to avoid redundant drops of the same piece type at the same square
    const seenTypes = new Set<string>();
    for (const piece of playerHand) {
      if (seenTypes.has(piece.type)) continue;
      seenTypes.add(piece.type);

      for (const target of validDrops) {
        moves.push({
          type: 'drop',
          pieceId: piece.id,
          to: target,
        });
      }
    }
  }

  return moves;
};

// Simulate a move
const applyMoveVirtual = (
  board: BoardState,
  hands: { 1: Piece[]; 2: Piece[] },
  move: AIMove,
  player: Player
): { board: BoardState; hands: { 1: Piece[]; 2: Piece[] } } => {
  const newBoard = board.map((row) => [...row]);
  const newHands = {
    1: [...hands[1]],
    2: [...hands[2]],
  };

  if (move.type === 'drop') {
    const pieceIndex = newHands[player].findIndex((p) => p.id === move.pieceId);
    if (pieceIndex !== -1) {
      const piece = { ...newHands[player][pieceIndex], isPromoted: false };
      newHands[player].splice(pieceIndex, 1);
      newBoard[move.to.y][move.to.x] = piece;
    }
  } else {
    const movingPiece = { ...newBoard[move.from.y][move.from.x]! };
    const targetPiece = newBoard[move.to.y][move.to.x];

    // Handle promotion
    const reachOpponentEnd = (player === 1 && move.to.y === 0) || (player === 2 && move.to.y === 4);
    if (reachOpponentEnd && movingPiece.type !== 'lion') {
      movingPiece.isPromoted = true;
    }

    newBoard[move.from.y][move.from.x] = null;
    newBoard[move.to.y][move.to.x] = movingPiece;

    if (targetPiece) {
      const capturedPiece = {
        ...targetPiece,
        owner: player,
        isPromoted: false,
      };
      newHands[player].push(capturedPiece);
    }
  }

  return { board: newBoard, hands: newHands };
};

// Heuristic evaluation function from Player 2's perspective (AI is Player 2)
const evaluateBoard = (board: BoardState, hands: { 1: Piece[]; 2: Piece[] }): number => {
  let score = 0;

  // Win/Loss immediate checks
  const winState = checkWinCondition(board);
  if (winState === 2) return 20000;
  if (winState === 1) return -20000;

  // Material on board
  for (let y = 0; y < board.length; y++) {
    for (let x = 0; x < board[y].length; x++) {
      const piece = board[y][x];
      if (piece) {
        let pieceVal = 0;
        switch (piece.type) {
          case 'lion': pieceVal = 10000; break;
          case 'fox': pieceVal = piece.isPromoted ? 500 : 300; break;
          case 'monkey': pieceVal = piece.isPromoted ? 450 : 250; break;
          case 'rabbit': pieceVal = piece.isPromoted ? 400 : 200; break;
          case 'boar': pieceVal = piece.isPromoted ? 400 : 200; break;
        }

        // Positional score: advancing towards the opposite end
        let posVal = 0;
        if (piece.owner === 2) {
          // Player 2 moves DOWN (Y increasing: 0 -> 4)
          posVal = y * 25;
          if (piece.type === 'lion') {
            posVal = y * 50; // Encourages Lion to try and win
          }
          score += (pieceVal + posVal);
        } else {
          // Player 1 moves UP (Y decreasing: 4 -> 0)
          posVal = (4 - y) * 25;
          if (piece.type === 'lion') {
            posVal = (4 - y) * 50;
          }
          score -= (pieceVal + posVal);
        }
      }
    }
  }

  // Material in hands
  hands[2].forEach((p) => {
    let val = 180;
    if (p.type === 'fox') val = 280;
    else if (p.type === 'monkey') val = 230;
    score += val;
  });

  hands[1].forEach((p) => {
    let val = 180;
    if (p.type === 'fox') val = 280;
    else if (p.type === 'monkey') val = 230;
    score -= val;
  });

  return score;
};

// Alpha-Beta Minimax search
const alphaBeta = (
  board: BoardState,
  hands: { 1: Piece[]; 2: Piece[] },
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): number => {
  const winner = checkWinCondition(board);
  if (depth === 0 || winner !== null) {
    return evaluateBoard(board, hands);
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    const moves = getAllPossibleMoves(board, hands, 2);
    // Sort moves to optimize AB pruning (captures first)
    moves.sort((a, b) => {
      const aScore = a.type === 'move' && board[a.to.y][a.to.x] ? 1 : 0;
      const bScore = b.type === 'move' && board[b.to.y][b.to.x] ? 1 : 0;
      return bScore - aScore;
    });

    for (const move of moves) {
      const nextState = applyMoveVirtual(board, hands, move, 2);
      const evalValue = alphaBeta(nextState.board, nextState.hands, depth - 1, alpha, beta, false);
      maxEval = Math.max(maxEval, evalValue);
      alpha = Math.max(alpha, evalValue);
      if (beta <= alpha) break; // Pruning
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    const moves = getAllPossibleMoves(board, hands, 1);
    moves.sort((a, b) => {
      const aScore = a.type === 'move' && board[a.to.y][a.to.x] ? 1 : 0;
      const bScore = b.type === 'move' && board[b.to.y][b.to.x] ? 1 : 0;
      return bScore - aScore;
    });

    for (const move of moves) {
      const nextState = applyMoveVirtual(board, hands, move, 1);
      const evalValue = alphaBeta(nextState.board, nextState.hands, depth - 1, alpha, beta, true);
      minEval = Math.min(minEval, evalValue);
      beta = Math.min(beta, evalValue);
      if (beta <= alpha) break; // Pruning
    }
    return minEval;
  }
};

// Primary interface to get the best move for Player 2
export const getBestMove = (
  board: BoardState,
  hands: { 1: Piece[]; 2: Piece[] },
  difficulty: AIDifficulty
): AIMove | null => {
  const moves = getAllPossibleMoves(board, hands, 2);
  if (moves.length === 0) return null;

  // 1. "よわい" (Weak) - 40% random, 60% depth 1 minimax
  if (difficulty === 'weak') {
    if (Math.random() < 0.4) {
      const randomIndex = Math.floor(Math.random() * moves.length);
      return moves[randomIndex];
    }
    // Else fall through to depth 1 evaluation
  }

  // 2. "ややよわい" (Somewhat Weak) - Alpha-Beta search depth 1 (always)
  // No random chance to select purely random move anymore, it falls through to searchDepth = 1.

  // Define depth based on difficulty
  let searchDepth = 1;
  if (difficulty === 'weak') searchDepth = 1;
  else if (difficulty === 'somewhat_weak') searchDepth = 1;
  else if (difficulty === 'somewhat_strong') searchDepth = 2;
  else if (difficulty === 'strong') searchDepth = 3;
  else if (difficulty === 'very_strong') searchDepth = 4;

  let bestMove: AIMove | null = null;
  let bestValue = -Infinity;

  // Evaluate all moves
  for (const move of moves) {
    const nextState = applyMoveVirtual(board, hands, move, 2);
    // If it's a winning move, take it immediately!
    const win = checkWinCondition(nextState.board);
    if (win === 2) {
      return move;
    }

    const value = alphaBeta(nextState.board, nextState.hands, searchDepth - 1, -Infinity, Infinity, false);
    
    // Add small random noise to prevent identical play in same situations
    const noise = (Math.random() - 0.5) * 5;
    const finalValue = value + noise;

    if (finalValue > bestValue) {
      bestValue = finalValue;
      bestMove = move;
    }
  }

  return bestMove || moves[0];
};
