export type Player = 1 | 2;

export type AnimalType = 'lion' | 'boar' | 'rabbit' | 'monkey' | 'fox';

export interface Piece {
  id: string;
  type: AnimalType;
  owner: Player;
  isPromoted: boolean; // true if evolved
}

export type BoardState = (Piece | null)[][]; // 5 rows, 4 cols. board[y][x]

export type GameMode = 'local' | 'vs-ai';

export type AIDifficulty = 'weak' | 'somewhat_weak' | 'somewhat_strong' | 'strong' | 'very_strong';

export interface GameState {
  board: BoardState;
  turn: Player;
  winner: Player | null;
  hands: {
    1: Piece[];
    2: Piece[];
  };
  mode: GameMode;
  difficulty: AIDifficulty;
}

export interface Position {
  x: number;
  y: number;
}
