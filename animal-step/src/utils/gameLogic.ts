import type { AnimalType, BoardState, Piece, Player, Position } from '../types/game';

export const COLS = 4;
export const ROWS = 5;

// Create a unique ID for pieces
let pieceIdCounter = 0;
const createPiece = (type: AnimalType, owner: Player): Piece => ({
  id: `piece_${pieceIdCounter++}`,
  type,
  owner,
  isPromoted: false,
});

export const getInitialBoard = (): BoardState => {
  const board: BoardState = Array.from({ length: ROWS }, () => Array(COLS).fill(null));

  // Player 2 (Top, Y=0) - [Rabbit, Lion, Fox, Monkey] (from X=0 to 3)
  // Boar at Y=1, X=1 (in front of Lion)
  board[0][0] = createPiece('rabbit', 2);
  board[0][1] = createPiece('lion', 2);
  board[0][2] = createPiece('fox', 2);
  board[0][3] = createPiece('monkey', 2);
  board[1][1] = createPiece('boar', 2);

  // Player 1 (Bottom, Y=4) - [Monkey, Fox, Lion, Rabbit] (from X=0 to 3)
  // Boar at Y=3, X=2 (in front of Lion)
  board[4][0] = createPiece('monkey', 1);
  board[4][1] = createPiece('fox', 1);
  board[4][2] = createPiece('lion', 1);
  board[4][3] = createPiece('rabbit', 1);
  board[3][2] = createPiece('boar', 1);

  return board;
};

// Check if a position is within the board bounds
export const isValidPosition = (x: number, y: number): boolean => {
  return x >= 0 && x < COLS && y >= 0 && y < ROWS;
};

// Get all possible move positions for a piece at (x, y)
export const getValidMoves = (board: BoardState, x: number, y: number): Position[] => {
  const piece = board[y][x];
  if (!piece) return [];

  const moves: Position[] = [];
  const owner = piece.owner;
  const forward = owner === 1 ? -1 : 1;
  const backward = owner === 1 ? 1 : -1;

  const addMoveIfValid = (nx: number, ny: number) => {
    if (isValidPosition(nx, ny)) {
      const targetPiece = board[ny][nx];
      // Can move if empty or occupied by opponent
      if (!targetPiece || targetPiece.owner !== owner) {
        moves.push({ x: nx, y: ny });
      }
    }
  };

  // If the piece is promoted (and is not a Lion, though Lion shouldn't be promoted anyway)
  if (piece.isPromoted && piece.type !== 'lion') {
    // Promoted movement: Gold General (all directions except diagonal backward)
    // Forward (1), Backward (1), Left (1), Right (1), Diagonal Forward (2)
    addMoveIfValid(x, y + forward);        // Forward
    addMoveIfValid(x, y + backward);       // Backward
    addMoveIfValid(x - 1, y);              // Left
    addMoveIfValid(x + 1, y);              // Right
    addMoveIfValid(x - 1, y + forward);    // Diagonal Forward Left
    addMoveIfValid(x + 1, y + forward);    // Diagonal Forward Right
    return moves;
  }

  // Unpromoted movement rules (Improvement A)
  switch (piece.type) {
    case 'lion':
      // 8 directions
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          if (dx !== 0 || dy !== 0) addMoveIfValid(x + dx, y + dy);
        }
      }
      break;

    case 'boar':
      // Forward and Backward
      addMoveIfValid(x, y + forward);
      addMoveIfValid(x, y + backward);
      break;

    case 'rabbit':
      // Diagonal Forward (2) and Straight Backward (1)
      addMoveIfValid(x - 1, y + forward);
      addMoveIfValid(x + 1, y + forward);
      addMoveIfValid(x, y + backward);
      break;

    case 'monkey':
      // Forward, Backward, Left, Right (Cross shape, 4 directions)
      addMoveIfValid(x, y + forward);
      addMoveIfValid(x, y + backward);
      addMoveIfValid(x - 1, y);
      addMoveIfValid(x + 1, y);
      break;

    case 'fox':
      // Forward, Left, Right, Diagonal Backward (5 directions)
      addMoveIfValid(x, y + forward);
      addMoveIfValid(x - 1, y);
      addMoveIfValid(x + 1, y);
      addMoveIfValid(x - 1, y + backward);
      addMoveIfValid(x + 1, y + backward);
      break;
  }

  return moves;
};

// Check if a piece can be dropped at (x, y)
export const canDropPiece = (board: BoardState, _player: Player, x: number, y: number): boolean => {
  return board[y][x] === null;
};

export const getValidDrops = (board: BoardState, _player: Player): Position[] => {
  const drops: Position[] = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (board[y][x] === null) {
        drops.push({ x, y });
      }
    }
  }
  return drops;
};

export const checkWinCondition = (board: BoardState): Player | null => {
  // Win condition 1: Opponent's lion is captured.
  let p1LionFound = false;
  let p2LionFound = false;

  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const p = board[y][x];
      if (p && p.type === 'lion') {
        if (p.owner === 1) p1LionFound = true;
        if (p.owner === 2) p2LionFound = true;
        
        // Win condition 2: Lion reached opponent's 1st row (Y=0 for P1, Y=ROWS-1 for P2)
        if (p.owner === 1 && y === 0) return 1;
        if (p.owner === 2 && y === ROWS - 1) return 2;
      }
    }
  }

  if (!p1LionFound) return 2;
  if (!p2LionFound) return 1;

  return null;
};
