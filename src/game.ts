import { BOARD_WIDTH, hasCollision, placePiece, type Position } from "./board";
import { TETROMINOES, TETROMINO_TYPES, type Grid, type TetrominoType } from "./tetromino";

export interface ActivePiece {
  type: TetrominoType;
  rotation: number;
  position: Position;
}

export interface GameState {
  board: Grid;
  piece: ActivePiece;
}

export function spawnPiece(random: () => number = Math.random): ActivePiece {
  const type = TETROMINO_TYPES[Math.floor(random() * TETROMINO_TYPES.length)];
  const shape = TETROMINOES[type][0];
  const col = Math.floor((BOARD_WIDTH - shape[0].length) / 2);
  return { type, rotation: 0, position: { row: 0, col } };
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
      board: state.board,
      piece: { ...state.piece, position: droppedPosition },
    };
  }

  const board = placePiece(shape, state.piece.position, state.board);
  return { board, piece: spawnPiece(random) };
}
