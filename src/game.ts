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
  queue: readonly TetrominoType[];
  hold: TetrominoType | null;
  canHold: boolean;
  score: number;
  level: number;
  linesCleared: number;
  status: GameStatus;
}

export const LINES_PER_LEVEL = 10;

// How many upcoming pieces the next-queue panel displays.
export const NEXT_QUEUE_SIZE = 3;

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

// Fisher-Yates shuffle of one of each tetromino type: the 7-bag randomizer,
// so every type is drawn exactly once before any type repeats.
function shuffledBag(random: () => number): TetrominoType[] {
  const bag = [...TETROMINO_TYPES];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return bag;
}

// Draws the next piece type from the front of the queue, topping it up with
// a freshly shuffled bag whenever it runs low so at least NEXT_QUEUE_SIZE
// pieces remain queued after every draw.
export function drawPiece(
  queue: readonly TetrominoType[],
  random: () => number = Math.random,
): { type: TetrominoType; queue: TetrominoType[] } {
  const filled = queue.length > NEXT_QUEUE_SIZE ? queue : [...queue, ...shuffledBag(random)];
  const [type, ...rest] = filled;
  return { type, queue: rest };
}

export function spawnPiece(type: TetrominoType): ActivePiece {
  const shape = TETROMINOES[type][0];
  const col = Math.floor((BOARD_WIDTH - shape[0].length) / 2);
  return { type, rotation: 0, position: { row: 0, col } };
}

export function createGameState(random: () => number = Math.random): GameState {
  const { type, queue } = drawPiece([], random);

  return {
    board: createEmptyBoard(),
    piece: spawnPiece(type),
    queue,
    hold: null,
    canHold: true,
    score: 0,
    level: 1,
    linesCleared: 0,
    status: "playing",
  };
}

export function restart(random: () => number = Math.random): GameState {
  return createGameState(random);
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
  const { type, queue } = drawPiece(state.queue, random);
  const piece = spawnPiece(type);
  const pieceShape = TETROMINOES[piece.type][piece.rotation];
  const status: GameStatus = hasCollision(pieceShape, piece.position, board)
    ? "gameOver"
    : "playing";

  return {
    board,
    piece,
    queue,
    hold: state.hold,
    canHold: true,
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

// Swaps the active piece into the hold slot, drawing a replacement from the
// queue the first time hold is used. Guideline hold rules: at most one swap
// per piece, re-enabled by lockPiece once the piece locks.
export function holdPiece(
  state: GameState,
  random: () => number = Math.random,
): GameState {
  if (!state.canHold) {
    return state;
  }

  if (state.hold === null) {
    const { type, queue } = drawPiece(state.queue, random);
    return {
      ...state,
      piece: spawnPiece(type),
      queue,
      hold: state.piece.type,
      canHold: false,
    };
  }

  return {
    ...state,
    piece: spawnPiece(state.hold),
    hold: state.piece.type,
    canHold: false,
  };
}
