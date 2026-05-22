import { useState, useCallback, useEffect, useRef } from 'react';
import type { GameState, Position, Player, Piece, GameMode, AIDifficulty } from '../types/game';
import { getInitialBoard, getValidMoves, getValidDrops, checkWinCondition, canDropPiece, ROWS } from '../utils/gameLogic';
import { getBestMove } from '../utils/ai';

export interface LastMoveInfo {
  from: Position | null; // null if it was a drop
  to: Position;
}

export interface GameHistoryState {
  board: (Piece | null)[][];
  hands: { 1: Piece[]; 2: Piece[] };
  turn: Player;
  winner: Player | null;
  lastMove: LastMoveInfo | null;
}

export interface UseGameReturn extends GameState {
  selectedPos: Position | null;
  selectedHandPieceId: string | null;
  validMoves: Position[];
  validDrops: Position[];
  isAIThinking: boolean;
  isGameStarted: boolean;
  lastMove: LastMoveInfo | null;
  canUndo: boolean;
  handleSquareClick: (x: number, y: number) => void;
  handleHandPieceClick: (player: Player, pieceId: string) => void;
  resetGame: () => void;
  startGame: (mode: GameMode, difficulty: AIDifficulty) => void;
  backToMenu: () => void;
  undo: () => void;
}

export const useGame = (): UseGameReturn => {
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [mode, setMode] = useState<GameMode>('local');
  const [difficulty, setDifficulty] = useState<AIDifficulty>('weak');

  const [board, setBoard] = useState(getInitialBoard());
  const [turn, setTurn] = useState<Player>(1);
  const [winner, setWinner] = useState<Player | null>(null);
  const [hands, setHands] = useState<{ 1: Piece[]; 2: Piece[] }>({ 1: [], 2: [] });
  const [isAIThinking, setIsAIThinking] = useState(false);
  
  const [lastMove, setLastMove] = useState<LastMoveInfo | null>(null);
  const [history, setHistory] = useState<GameHistoryState[]>([]);

  const [selectedPos, setSelectedPos] = useState<Position | null>(null);
  const [selectedHandPieceId, setSelectedHandPieceId] = useState<string | null>(null);

  const validMoves = selectedPos && !winner ? getValidMoves(board, selectedPos.x, selectedPos.y) : [];
  const validDrops = selectedHandPieceId && !winner ? getValidDrops(board, turn) : [];

  // Refs for AI effect to access latest state without stale closures
  const boardRef = useRef(board);
  const handsRef = useRef(hands);
  const turnRef = useRef(turn);
  const winnerRef = useRef(winner);
  const modeRef = useRef(mode);
  const difficultyRef = useRef(difficulty);
  const lastMoveRef = useRef(lastMove);

  boardRef.current = board;
  handsRef.current = hands;
  turnRef.current = turn;
  winnerRef.current = winner;
  modeRef.current = mode;
  difficultyRef.current = difficulty;
  lastMoveRef.current = lastMove;

  const saveHistory = useCallback((
    currentBoard: typeof board,
    currentHands: typeof hands,
    currentTurn: Player,
    currentWinner: typeof winner,
    currentLastMove: typeof lastMove
  ) => {
    const handsCopy = {
      1: [...currentHands[1]],
      2: [...currentHands[2]],
    };
    setHistory((prev) => [
      ...prev,
      {
        board: currentBoard.map(row => [...row]),
        hands: handsCopy,
        turn: currentTurn,
        winner: currentWinner,
        lastMove: currentLastMove ? { ...currentLastMove } : null,
      }
    ]);
  }, []);

  const applyMove = useCallback((
    fromX: number, fromY: number, toX: number, toY: number,
    currentBoard: typeof board, currentHands: typeof hands, currentTurn: Player
  ) => {
    const newBoard = currentBoard.map(row => [...row]);
    const movingPiece = { ...newBoard[fromY][fromX]! };
    const targetPiece = newBoard[toY][toX];

    // Check for promotion
    const reachOpponentEnd = (movingPiece.owner === 1 && toY === 0) || (movingPiece.owner === 2 && toY === ROWS - 1);
    if (reachOpponentEnd && movingPiece.type !== 'lion') {
      movingPiece.isPromoted = true;
    }

    newBoard[fromY][fromX] = null;
    newBoard[toY][toX] = movingPiece;

    const newHands = { 1: [...currentHands[1]], 2: [...currentHands[2]] };
    if (targetPiece) {
      const capturedPiece: Piece = {
        ...targetPiece,
        owner: currentTurn,
        isPromoted: false,
      };
      newHands[currentTurn] = [...newHands[currentTurn], capturedPiece];
    }

    return { newBoard, newHands };
  }, []);

  const applyDrop = useCallback((
    pieceId: string, toX: number, toY: number,
    currentHands: typeof hands, currentBoard: typeof board, currentTurn: Player
  ) => {
    const hand = currentHands[currentTurn];
    const pieceToDrop = hand.find(p => p.id === pieceId);
    if (!pieceToDrop) return null;

    const newBoard = currentBoard.map(row => [...row]);
    newBoard[toY][toX] = { ...pieceToDrop, isPromoted: false };

    const newHands = {
      ...currentHands,
      [currentTurn]: hand.filter(p => p.id !== pieceId),
    };

    return { newBoard, newHands };
  }, []);

  const finalizeTurn = useCallback((newBoard: typeof board, newHands: typeof hands, lastMoveInfo: LastMoveInfo) => {
    setBoard(newBoard);
    setHands(newHands as { 1: Piece[]; 2: Piece[] });
    setLastMove(lastMoveInfo);
    setSelectedPos(null);
    setSelectedHandPieceId(null);

    const newWinner = checkWinCondition(newBoard);
    if (newWinner) {
      setWinner(newWinner);
    } else {
      setTurn(t => (t === 1 ? 2 : 1));
    }
  }, []);

  // AI auto-play effect (with 2 seconds delay)
  useEffect(() => {
    if (mode !== 'vs-ai' || turn !== 2 || winner !== null || !isGameStarted) return;

    setIsAIThinking(true);

    const timeoutId = setTimeout(() => {
      const currentBoard = boardRef.current;
      const currentHands = handsRef.current;
      const currentTurn = turnRef.current;
      const currentWinner = winnerRef.current;
      const currentLastMove = lastMoveRef.current;

      const aiMove = getBestMove(currentBoard, currentHands, difficultyRef.current);
      if (!aiMove) {
        setIsAIThinking(false);
        return;
      }

      if (aiMove.type === 'move') {
        const result = applyMove(
          aiMove.from.x, aiMove.from.y, aiMove.to.x, aiMove.to.y,
          currentBoard, currentHands, 2
        );
        saveHistory(currentBoard, currentHands, currentTurn, currentWinner, currentLastMove);
        finalizeTurn(result.newBoard, result.newHands, { from: aiMove.from, to: aiMove.to });
      } else {
        const result = applyDrop(
          aiMove.pieceId, aiMove.to.x, aiMove.to.y,
          currentHands, currentBoard, 2
        );
        if (result) {
          saveHistory(currentBoard, currentHands, currentTurn, currentWinner, currentLastMove);
          finalizeTurn(result.newBoard, result.newHands, { from: null, to: aiMove.to });
        }
      }

      setIsAIThinking(false);
    }, 2000); // 2 seconds thinking delay

    return () => clearTimeout(timeoutId);
  }, [turn, winner, mode, isGameStarted, applyMove, applyDrop, finalizeTurn, saveHistory]);

  const handleSquareClick = useCallback((x: number, y: number) => {
    if (winner) return;
    // Block clicks during AI turn
    if (mode === 'vs-ai' && turn === 2) return;

    // Case 1: Dropping a piece from hand
    if (selectedHandPieceId) {
      if (canDropPiece(board, turn, x, y)) {
        const result = applyDrop(selectedHandPieceId, x, y, hands, board, turn);
        if (result) {
          saveHistory(board, hands, turn, winner, lastMove);
          finalizeTurn(result.newBoard, result.newHands, { from: null, to: { x, y } });
        }
      }
      return;
    }

    // Case 2: Moving a piece on the board
    const clickedPiece = board[y][x];

    // If we click our own piece, select it
    if (clickedPiece && clickedPiece.owner === turn) {
      setSelectedPos({ x, y });
      setSelectedHandPieceId(null);
      return;
    }

    // If we have a piece selected, check if we clicked a valid move target
    if (selectedPos) {
      const isMoveValid = validMoves.some(m => m.x === x && m.y === y);
      if (isMoveValid) {
        const result = applyMove(selectedPos.x, selectedPos.y, x, y, board, hands, turn);
        saveHistory(board, hands, turn, winner, lastMove);
        finalizeTurn(result.newBoard, result.newHands, { from: { x: selectedPos.x, y: selectedPos.y }, to: { x, y } });
      } else {
        setSelectedPos(null);
      }
    }
  }, [board, turn, winner, hands, selectedPos, selectedHandPieceId, validMoves, mode, applyMove, applyDrop, finalizeTurn, saveHistory, lastMove]);

  const handleHandPieceClick = useCallback((player: Player, pieceId: string) => {
    if (winner || player !== turn) return;
    if (mode === 'vs-ai' && turn === 2) return;

    if (selectedHandPieceId === pieceId) {
      setSelectedHandPieceId(null);
    } else {
      setSelectedHandPieceId(pieceId);
      setSelectedPos(null);
    }
  }, [turn, winner, selectedHandPieceId, mode]);

  const resetGame = useCallback(() => {
    setBoard(getInitialBoard());
    setTurn(1);
    setWinner(null);
    setHands({ 1: [], 2: [] });
    setSelectedPos(null);
    setSelectedHandPieceId(null);
    setIsAIThinking(false);
    setLastMove(null);
    setHistory([]);
  }, []);

  const startGame = useCallback((newMode: GameMode, newDifficulty: AIDifficulty) => {
    setMode(newMode);
    setDifficulty(newDifficulty);
    resetGame();
    setIsGameStarted(true);
  }, [resetGame]);

  const backToMenu = useCallback(() => {
    resetGame();
    setIsGameStarted(false);
  }, [resetGame]);

  const undo = useCallback(() => {
    if (history.length === 0 || isAIThinking) return;

    const newHistory = [...history];
    let targetState: GameHistoryState | undefined;

    if (mode === 'vs-ai') {
      // In VS-AI mode:
      // If the player won, they undo only 1 step (their own winning move, as AI never played).
      // If the AI won or game is active (it's Player 1's turn), undoing reverts BOTH the AI's last move and Player 1's last move (pop 2 states).
      if (winner === 1) {
        targetState = newHistory.pop();
      } else {
        if (newHistory.length >= 2) {
          newHistory.pop(); // Pop AI turn state
          targetState = newHistory.pop(); // Pop Player 1 turn state
        } else {
          // Fallback if only 1 state exists
          targetState = newHistory.pop();
        }
      }
    } else {
      // Local 2-Player mode: undo 1 step
      targetState = newHistory.pop();
    }

    if (targetState) {
      setBoard(targetState.board);
      setHands(targetState.hands);
      setTurn(targetState.turn);
      setWinner(targetState.winner);
      setLastMove(targetState.lastMove);
      setHistory(newHistory);
      setSelectedPos(null);
      setSelectedHandPieceId(null);
    }
  }, [history, isAIThinking, mode, winner]);

  const canUndo = history.length > 0 && !isAIThinking;

  return {
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
  };
};
