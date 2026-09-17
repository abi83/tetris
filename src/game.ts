import {
  BOARD_WIDTH,
  clearRows,
  createEmptyBoard,
  filledRows,
  hasCollision,
  placePiece,
  type Position,
} from "./board";
import { TETROMINOES, TETROMINO_TYPES, type Grid, type TetrominoType } from "./tetromino";

export interface ActivePiece {
  type: TetrominoType;
  rotation: number;
  position: Position;
}

export type GameStatus = "playing" | "paused" | "gameOver";

export interface GameState {
  board: Grid;
  piece: ActivePiece;
  score: number;
  level: number;
  linesCleared: number;
  status: GameStatus;
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

export function restart(random: () => number = Math.random): GameState {
  return {
    board: createEmptyBoard(),
    piece: spawnPiece(random),
    score: 0,
    level: 1,
    linesCleared: 0,
    status: "playing",
  };
}

export function togglePause(state: GameState): GameState {
  if (state.status === "gameOver") {
    return state;
  }

  return { ...state, status: state.status === "paused" ? "playing" : "paused" };
}

export function moveLeft(state: GameState): GameState {
  return moveHorizontal(state, -1);
}

export function moveRight(state: GameState): GameState {
  return moveHorizontal(state, 1);
}

function moveHorizontal(state: GameState, delta: number): GameState {
  if (state.status !== "playing") {
    return state;
  }

  const shape = TETROMINOES[state.piece.type][state.piece.rotation];
  const position: Position = {
    row: state.piece.position.row,
    col: state.piece.position.col + delta,
  };

  if (hasCollision(shape, position, state.board)) {
    return state;
  }

  return { ...state, piece: { ...state.piece, position } };
}

export function rotate(state: GameState): GameState {
  if (state.status !== "playing") {
    return state;
  }

  const rotation = (state.piece.rotation + 1) % 4;
  const shape = TETROMINOES[state.piece.type][rotation];

  if (hasCollision(shape, state.piece.position, state.board)) {
    return state;
  }

  return { ...state, piece: { ...state.piece, rotation } };
}

// Repeatedly applies hasCollision to find the lowest legal row for the
// piece's current column/rotation, without mutating the piece or board.
export function landingPosition(piece: ActivePiece, board: Grid): Position {
  const shape = TETROMINOES[piece.type][piece.rotation];
  let position = piece.position;

  while (!hasCollision(shape, { row: position.row + 1, col: position.col }, board)) {
    position = { row: position.row + 1, col: position.col };
  }

  return position;
}

function lockPiece(
  state: GameState,
  shape: Grid,
  position: Position,
  random: () => number,
): GameState {
  const lockedBoard = placePiece(shape, position, state.board);
  const clearedRowCount = filledRows(lockedBoard).length;
  const board = clearRows(lockedBoard);
  const linesCleared = state.linesCleared + clearedRowCount;
  const piece = spawnPiece(random);
  const pieceShape = TETROMINOES[piece.type][piece.rotation];
  const status: GameStatus = hasCollision(pieceShape, piece.position, board)
    ? "gameOver"
    : "playing";

  return {
    board,
    piece,
    score: state.score + LINE_CLEAR_SCORES[clearedRowCount] * state.level,
    level: Math.floor(linesCleared / LINES_PER_LEVEL) + 1,
    linesCleared,
    status,
  };
}

export function step(
  state: GameState,
  random: () => number = Math.random,
): GameState {
  if (state.status !== "playing") {
    return state;
  }

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

  return lockPiece(state, shape, state.piece.position, random);
}

export function hardDrop(
  state: GameState,
  random: () => number = Math.random,
): GameState {
  if (state.status !== "playing") {
    return state;
  }

  const shape = TETROMINOES[state.piece.type][state.piece.rotation];
  const position = landingPosition(state.piece, state.board);

  return lockPiece(state, shape, position, random);
}
