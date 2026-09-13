import { describe, expect, it } from "vitest";
import { TETROMINO_TYPES, TETROMINOES, type Grid } from "./tetromino";

function rotateClockwise(grid: Grid): Grid {
  const size = grid.length;
  return grid.map((row, r) => row.map((_, c) => grid[size - 1 - c][r]));
}

function countFilled(grid: Grid): number {
  return grid.reduce(
    (sum, row) => sum + row.reduce((rowSum, cell) => rowSum + cell, 0),
    0,
  );
}

describe("TETROMINOES", () => {
  it("defines all 7 tetromino types", () => {
    expect(TETROMINO_TYPES).toHaveLength(7);
    expect(Object.keys(TETROMINOES).sort()).toEqual(
      [...TETROMINO_TYPES].sort(),
    );
  });

  it.each(TETROMINO_TYPES)("gives %s exactly 4 rotation states", (type) => {
    expect(TETROMINOES[type]).toHaveLength(4);
  });

  it.each(TETROMINO_TYPES)("keeps %s rotations as square grids", (type) => {
    for (const grid of TETROMINOES[type]) {
      for (const row of grid) {
        expect(row).toHaveLength(grid.length);
      }
    }
  });

  it.each(TETROMINO_TYPES)("covers exactly 4 cells in every %s rotation", (type) => {
    for (const grid of TETROMINOES[type]) {
      expect(countFilled(grid)).toBe(4);
    }
  });

  it.each(TETROMINO_TYPES)(
    "rotates %s 90° clockwise between consecutive states",
    (type) => {
      const rotations = TETROMINOES[type];
      for (let i = 0; i < rotations.length; i++) {
        const next = rotations[(i + 1) % rotations.length];
        expect(rotateClockwise(rotations[i])).toEqual(next);
      }
    },
  );
});
