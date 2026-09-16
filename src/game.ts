import { BOARD_WIDTH, clearRows, filledRows, hasCollision, placePiece, type Position } from "./board";
import { TETROMINOES, TETROMINO_TYPES, type Grid, type TetrominoType } from "./tetromino";

export interface ActivePiece {
  type: TetrominoType;
  rotation: number;
  position: Position;
}

export interface GameState {
  board: Grid;
  piece: ActivePiece;
  score: number;
  level: number;
  linesCleared: number;
}

export const LINES_PER_LEVEL = 10;

// Standard Tetris Guideline base scores per simultaneous line clear, scaled by level.
const LINE_CLEAR_SCORES: Record<number, number> = {
  0: 0,
  1: 100,
  2: 300,
  3: 500,
  4: 800,
};

const BASE_DROP_INTERVAL_MS = 1000;
const DROP_INTERVAL_STEP_MS = 100;
const MIN_DROP_INTERVAL_MS = 100;

export function dropIntervalForLevel(level: number): number {
  return Math.max(
    MIN_DROP_INTERVAL_MS,
    BASE_DROP_INTERVAL_MS - (level - 1) * DROP_INTERVAL_STEP_MS,
  );
}

export function spawnPiece(random: () => number = Math.random): ActivePiece {
  const type = TETROMINO_TYPES[Math.floor(random() * TETROMINO_TYPES.length)];
  const shape = TETROMINOES[type][0];
  const col = Math.floor((BOARD_WIDTH - shape[0].length) / 2);
  return { type, rotation: 0, position: { row: 0, col } };
}

export function moveLeft(state: GameState): GameState {
  return moveHorizontal(state, -1);
}

export function moveRight(state: GameState): GameState {
  return moveHorizontal(state, 1);
}

function moveHorizontal(state: GameState, delta: number): GameState {
  const shape = TETROMINOES[state.piece.type][state.piece.rotation];
  const position: Position = {
    row: state.piece.position.row,
    col: state.piece.position.col + delta,
  };

  if (hasCollision(shape, position, state.board)) {
    return state;
  }

  return { board: state.board, piece: { ...state.piece, position } };
}

export function rotate(state: GameState): GameState {
  const rotation = (state.piece.rotation + 1) % 4;
  const shape = TETROMINOES[state.piece.type][rotation];

  if (hasCollision(shape, state.piece.position, state.board)) {
    return state;
  }

  return { board: state.board, piece: { ...state.piece, rotation } };
}

export function step(
  state: GameState,
  random: () => number = Math.random,
): GameState {
  const shape = TETROMINOES[state.piece.type][state.piece.rotation];
  const droppedPosition: Position = {
    row: state.piece.position.row + 1,
    col: state.piece.position.col,
  };

  if (!hasCollision(shape, droppedPosition, state.board)) {
    return {
      ...state,
      piece: { ...state.piece, position: droppedPosition },
    };
  }

  const lockedBoard = placePiece(shape, state.piece.position, state.board);
  const clearedRowCount = filledRows(lockedBoard).length;
  const board = clearRows(lockedBoard);
  const linesCleared = state.linesCleared + clearedRowCount;

  return {
    board,
    piece: spawnPiece(random),
    score: state.score + LINE_CLEAR_SCORES[clearedRowCount] * state.level,
    level: Math.floor(linesCleared / LINES_PER_LEVEL) + 1,
    linesCleared,
  };
}
