import type { Cell, Grid } from "./tetromino";

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

export interface Position {
  row: number;
  col: number;
}

export function createEmptyBoard(): Grid {
  return Array.from({ length: BOARD_HEIGHT }, () =>
    Array.from({ length: BOARD_WIDTH }, () => 0 as Cell),
  );
}

export function hasCollision(
  shape: Grid,
  position: Position,
  board: Grid,
): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] === 0) continue;

      const row = position.row + r;
      const col = position.col + c;

      if (row < 0 || row >= BOARD_HEIGHT || col < 0 || col >= BOARD_WIDTH) {
        return true;
      }
      if (board[row][col] !== 0) {
        return true;
      }
    }
  }
  return false;
}

export function placePiece(
  shape: Grid,
  position: Position,
  board: Grid,
): Grid {
  const next = board.map((row) => [...row]);

  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c] === 0) continue;
      next[position.row + r][position.col + c] = 1;
    }
  }

  return next;
}

export function filledRows(board: Grid): number[] {
  const rows: number[] = [];
  board.forEach((row, index) => {
    if (row.every((cell) => cell !== 0)) {
      rows.push(index);
    }
  });
  return rows;
}
