import { describe, expect, it } from "vitest";
import { BOARD_HEIGHT, BOARD_WIDTH, createEmptyBoard, placePiece } from "./board";
import { moveLeft, moveRight, rotate, spawnPiece, step, type GameState } from "./game";
import { TETROMINOES, TETROMINO_TYPES } from "./tetromino";

function randomFor(type: (typeof TETROMINO_TYPES)[number]): () => number {
  const index = TETROMINO_TYPES.indexOf(type);
  return () => index / TETROMINO_TYPES.length;
}

describe("spawnPiece", () => {
  it("picks a type using the given random source", () => {
    expect(spawnPiece(randomFor("L")).type).toBe("L");
  });

  it("starts at rotation 0", () => {
    expect(spawnPiece(randomFor("T")).rotation).toBe(0);
  });

  it("starts at the top of the board", () => {
    expect(spawnPiece(randomFor("T")).position.row).toBe(0);
  });

  it.each(TETROMINO_TYPES)("centers %s horizontally", (type) => {
    const piece = spawnPiece(randomFor(type));
    const shapeWidth = TETROMINOES[type][0][0].length;
    expect(piece.position.col).toBe(Math.floor((BOARD_WIDTH - shapeWidth) / 2));
  });
});

describe("moveLeft", () => {
  it("moves the piece one column left when unobstructed", () => {
    const state: GameState = {
      board: createEmptyBoard(),
      piece: { type: "T", rotation: 0, position: { row: 0, col: 3 } },
    };

    const next = moveLeft(state);

    expect(next.piece.position).toEqual({ row: 0, col: 2 });
    expect(next.board).toBe(state.board);
  });

  it("does not move past the left edge", () => {
    const state: GameState = {
      board: createEmptyBoard(),
      piece: { type: "T", rotation: 0, position: { row: 0, col: 0 } },
    };

    const next = moveLeft(state);

    expect(next).toBe(state);
  });

  it("does not move into a settled cell", () => {
    const settled = placePiece(TETROMINOES.O[0], { row: 0, col: 2 }, createEmptyBoard());
    const state: GameState = {
      board: settled,
      piece: { type: "T", rotation: 0, position: { row: 0, col: 3 } },
    };

    const next = moveLeft(state);

    expect(next).toBe(state);
  });
});

describe("moveRight", () => {
  it("moves the piece one column right when unobstructed", () => {
    const state: GameState = {
      board: createEmptyBoard(),
      piece: { type: "T", rotation: 0, position: { row: 0, col: 3 } },
    };

    const next = moveRight(state);

    expect(next.piece.position).toEqual({ row: 0, col: 4 });
    expect(next.board).toBe(state.board);
  });

  it("does not move past the right edge", () => {
    const state: GameState = {
      board: createEmptyBoard(),
      piece: { type: "T", rotation: 0, position: { row: 0, col: BOARD_WIDTH - 3 } },
    };

    const next = moveRight(state);

    expect(next).toBe(state);
  });
});

describe("rotate", () => {
  it("advances to the next rotation state when unobstructed", () => {
    const state: GameState = {
      board: createEmptyBoard(),
      piece: { type: "T", rotation: 0, position: { row: 3, col: 3 } },
    };

    const next = rotate(state);

    expect(next.piece.rotation).toBe(1);
    expect(next.piece.type).toBe("T");
    expect(next.board).toBe(state.board);
  });

  it("wraps from rotation 3 back to 0", () => {
    const state: GameState = {
      board: createEmptyBoard(),
      piece: { type: "T", rotation: 3, position: { row: 3, col: 3 } },
    };

    const next = rotate(state);

    expect(next.piece.rotation).toBe(0);
  });

  it("is a no-op when the rotated shape would collide with the board edge", () => {
    const state: GameState = {
      board: createEmptyBoard(),
      piece: { type: "I", rotation: 1, position: { row: 0, col: BOARD_WIDTH - 3 } },
    };

    const next = rotate(state);

    expect(next).toBe(state);
  });

  it("is a no-op when the rotated shape would collide with a settled cell", () => {
    const settled = placePiece([[1]], { row: 5, col: 4 }, createEmptyBoard());
    const state: GameState = {
      board: settled,
      piece: { type: "T", rotation: 0, position: { row: 3, col: 3 } },
    };

    const next = rotate(state);

    expect(next).toBe(state);
  });
});

describe("step", () => {
  it("moves the piece down one row when the row below is clear", () => {
    const state: GameState = {
      board: createEmptyBoard(),
      piece: { type: "T", rotation: 0, position: { row: 0, col: 3 } },
    };

    const next = step(state);

    expect(next.piece.position).toEqual({ row: 1, col: 3 });
    expect(next.piece.type).toBe("T");
    expect(next.board).toBe(state.board);
  });

  it("does not mutate the board passed in", () => {
    const board = createEmptyBoard();
    const snapshot = board.map((row) => [...row]);
    step({ board, piece: { type: "T", rotation: 0, position: { row: 0, col: 3 } } });
    expect(board).toEqual(snapshot);
  });

  it("locks the piece and spawns a new one when the drop is blocked by the floor", () => {
    const shape = TETROMINOES.O[0];
    const position = { row: BOARD_HEIGHT - 2, col: 4 };
    const state: GameState = {
      board: createEmptyBoard(),
      piece: { type: "O", rotation: 0, position },
    };

    const next = step(state, randomFor("L"));

    expect(next.board).toEqual(placePiece(shape, position, state.board));
    expect(next.piece).toEqual(spawnPiece(randomFor("L")));
  });

  it("locks the piece and spawns a new one when the drop is blocked by another piece", () => {
    const settled = placePiece(TETROMINOES.O[0], { row: 10, col: 4 }, createEmptyBoard());
    const position = { row: 8, col: 4 };
    const state: GameState = {
      board: settled,
      piece: { type: "O", rotation: 0, position },
    };

    const next = step(state, randomFor("I"));

    expect(next.board).toEqual(placePiece(TETROMINOES.O[0], position, settled));
    expect(next.piece).toEqual(spawnPiece(randomFor("I")));
  });
});
