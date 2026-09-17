import { describe, expect, it } from "vitest";
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  clearRows,
  createEmptyBoard,
  filledRows,
  hasCollision,
  placePiece,
  type Position,
} from "./board";
import { TETROMINOES, type Grid } from "./tetromino";

function fillRow(board: Grid, row: number): Grid {
  return board.map((r, index) =>
    index === row ? r.map(() => 1 as const) : r,
  );
}

describe("createEmptyBoard", () => {
  it("creates a grid with standard Tetris dimensions", () => {
    const board = createEmptyBoard();
    expect(board).toHaveLength(BOARD_HEIGHT);
    for (const row of board) {
      expect(row).toHaveLength(BOARD_WIDTH);
    }
  });

  it("fills every cell with 0", () => {
    const board = createEmptyBoard();
    for (const row of board) {
      for (const cell of row) {
        expect(cell).toBe(0);
      }
    }
  });
});

describe("hasCollision", () => {
  const shape = TETROMINOES.O[0];

  it("allows a valid position within empty bounds", () => {
    const board = createEmptyBoard();
    expect(hasCollision(shape, { row: 0, col: 0 }, board)).toBe(false);
  });

  it.each<[string, Position]>([
    ["off the left edge", { row: 0, col: -1 }],
    ["off the right edge", { row: 0, col: BOARD_WIDTH - 1 }],
    ["off the top edge", { row: -1, col: 0 }],
    ["off the bottom edge", { row: BOARD_HEIGHT - 1, col: 0 }],
  ])("flags a position %s as out of bounds", (_label, position) => {
    const board = createEmptyBoard();
    expect(hasCollision(shape, position, board)).toBe(true);
  });

  it("flags a position overlapping an occupied cell", () => {
    const board = placePiece(shape, { row: 5, col: 5 }, createEmptyBoard());
    expect(hasCollision(shape, { row: 5, col: 5 }, board)).toBe(true);
  });

  it("allows a position that doesn't overlap occupied cells", () => {
    const board = placePiece(shape, { row: 5, col: 5 }, createEmptyBoard());
    expect(hasCollision(shape, { row: 10, col: 0 }, board)).toBe(false);
  });
});

describe("placePiece", () => {
  it("sets the piece's cells into the board at the given position", () => {
    const shape = TETROMINOES.T[0];
    const board = placePiece(shape, { row: 2, col: 3 }, createEmptyBoard());

    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        expect(board[2 + r][3 + c]).toBe(shape[r][c]);
      }
    }
  });

  it("does not mutate the board passed in", () => {
    const before = createEmptyBoard();
    const snapshot = before.map((row) => [...row]);
    placePiece(TETROMINOES.O[0], { row: 0, col: 0 }, before);
    expect(before).toEqual(snapshot);
  });

  it("does not mutate the tetromino shape data", () => {
    const snapshot = TETROMINOES.T.map((grid) => grid.map((row) => [...row]));
    placePiece(TETROMINOES.T[0], { row: 0, col: 0 }, createEmptyBoard());
    expect(TETROMINOES.T).toEqual(snapshot);
  });
});

describe("filledRows", () => {
  it("returns no rows for an empty board", () => {
    expect(filledRows(createEmptyBoard())).toEqual([]);
  });

  it("returns the index of a single complete row", () => {
    const board = fillRow(createEmptyBoard(), 19);
    expect(filledRows(board)).toEqual([19]);
  });

  it("returns indices of multiple complete rows", () => {
    let board = fillRow(createEmptyBoard(), 0);
    board = fillRow(board, 5);
    board = fillRow(board, 19);
    expect(filledRows(board)).toEqual([0, 5, 19]);
  });

  it("does not report a row with even one empty cell", () => {
    const board = createEmptyBoard().map((row, index) =>
      index === 0 ? row.map((_, col) => (col === 3 ? 0 : 1) as const) : row,
    );
    expect(filledRows(board)).toEqual([]);
  });
});

describe("clearRows", () => {
  it("returns an equivalent board when no rows are full", () => {
    const board = placePiece(TETROMINOES.T[0], { row: 5, col: 3 }, createEmptyBoard());
    expect(clearRows(board)).toEqual(board);
  });

  it("removes a single full row and inserts an empty row at the top", () => {
    const board = fillRow(createEmptyBoard(), 19);
    const cleared = clearRows(board);

    expect(cleared).toHaveLength(BOARD_HEIGHT);
    expect(cleared[0]).toEqual(Array(BOARD_WIDTH).fill(0));
    expect(filledRows(cleared)).toEqual([]);
  });

  it("shifts rows above a cleared row down by one", () => {
    let board = createEmptyBoard();
    board = placePiece(TETROMINOES.T[0], { row: 5, col: 3 }, board);
    board = fillRow(board, 19);

    const cleared = clearRows(board);

    expect(cleared[6]).toEqual(placePiece(TETROMINOES.T[0], { row: 5, col: 3 }, createEmptyBoard())[5]);
  });

  it("clears multiple full rows at once and backfills that many empty rows", () => {
    let board = fillRow(createEmptyBoard(), 17);
    board = fillRow(board, 18);
    board = fillRow(board, 19);

    const cleared = clearRows(board);

    expect(cleared).toHaveLength(BOARD_HEIGHT);
    expect(cleared.slice(0, 3)).toEqual([
      Array(BOARD_WIDTH).fill(0),
      Array(BOARD_WIDTH).fill(0),
      Array(BOARD_WIDTH).fill(0),
    ]);
    expect(filledRows(cleared)).toEqual([]);
  });

  it("does not mutate the board passed in", () => {
    const board = fillRow(createEmptyBoard(), 19);
    const snapshot = board.map((row) => [...row]);
    clearRows(board);
    expect(board).toEqual(snapshot);
  });
});
