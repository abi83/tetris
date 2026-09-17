import { describe, expect, it } from "vitest";
import { BOARD_HEIGHT, BOARD_WIDTH, createEmptyBoard, placePiece } from "./board";
import {
  dropIntervalForLevel,
  hardDrop,
  landingPosition,
  moveLeft,
  moveRight,
  rotate,
  spawnPiece,
  step,
  type GameState,
} from "./game";
import { TETROMINOES, TETROMINO_TYPES } from "./tetromino";

function randomFor(type: (typeof TETROMINO_TYPES)[number]): () => number {
  const index = TETROMINO_TYPES.indexOf(type);
  return () => index / TETROMINO_TYPES.length;
}

function fillRow(board: ReturnType<typeof createEmptyBoard>, row: number) {
  return board.map((r, index) => (index === row ? r.map(() => 1 as const) : r));
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

describe("landingPosition", () => {
  it("drops straight to the floor on an empty board", () => {
    const piece = { type: "O", rotation: 0, position: { row: 0, col: 4 } } as const;

    expect(landingPosition(piece, createEmptyBoard())).toEqual({
      row: BOARD_HEIGHT - 2,
      col: 4,
    });
  });

  it("stops on top of settled cells", () => {
    const settled = placePiece(TETROMINOES.O[0], { row: 15, col: 4 }, createEmptyBoard());
    const piece = { type: "O", rotation: 0, position: { row: 0, col: 4 } } as const;

    expect(landingPosition(piece, settled)).toEqual({ row: 13, col: 4 });
  });

  it("tracks the piece's current column and rotation", () => {
    const piece = { type: "I", rotation: 1, position: { row: 0, col: 6 } } as const;

    expect(landingPosition(piece, createEmptyBoard())).toEqual({
      row: BOARD_HEIGHT - 4,
      col: 6,
    });
  });

  it("does not mutate the board passed in", () => {
    const board = createEmptyBoard();
    const snapshot = board.map((row) => [...row]);
    const piece = { type: "T", rotation: 0, position: { row: 0, col: 3 } } as const;

    landingPosition(piece, board);

    expect(board).toEqual(snapshot);
  });
});

describe("hardDrop", () => {
  const baseState = { score: 0, level: 1, linesCleared: 0 };

  it("moves the piece straight to its landing position and locks it", () => {
    const state: GameState = {
      ...baseState,
      board: createEmptyBoard(),
      piece: { type: "O", rotation: 0, position: { row: 0, col: 4 } },
    };

    const next = hardDrop(state, randomFor("L"));

    expect(next.board).toEqual(
      placePiece(TETROMINOES.O[0], { row: BOARD_HEIGHT - 2, col: 4 }, state.board),
    );
    expect(next.piece).toEqual(spawnPiece(randomFor("L")));
  });

  it("clears completed rows and awards score the same as a normal lock", () => {
    let board = createEmptyBoard();
    board = fillRow(board, BOARD_HEIGHT - 1).map((row, index) =>
      index === BOARD_HEIGHT - 1 ? row.map((_, col) => (col === 4 || col === 5 ? 0 : 1) as const) : row,
    );
    const state: GameState = {
      ...baseState,
      board,
      piece: { type: "O", rotation: 0, position: { row: 0, col: 4 } },
    };

    const next = hardDrop(state, randomFor("L"));

    expect(next.linesCleared).toBe(1);
    expect(next.score).toBe(100);
    expect(next.level).toBe(1);
  });
});

describe("step", () => {
  const baseState = { score: 0, level: 1, linesCleared: 0 };

  it("moves the piece down one row when the row below is clear", () => {
    const state: GameState = {
      ...baseState,
      board: createEmptyBoard(),
      piece: { type: "T", rotation: 0, position: { row: 0, col: 3 } },
    };

    const next = step(state);

    expect(next.piece.position).toEqual({ row: 1, col: 3 });
    expect(next.piece.type).toBe("T");
    expect(next.board).toBe(state.board);
    expect(next.score).toBe(0);
    expect(next.level).toBe(1);
    expect(next.linesCleared).toBe(0);
  });

  it("does not mutate the board passed in", () => {
    const board = createEmptyBoard();
    const snapshot = board.map((row) => [...row]);
    step({
      ...baseState,
      board,
      piece: { type: "T", rotation: 0, position: { row: 0, col: 3 } },
    });
    expect(board).toEqual(snapshot);
  });

  it("locks the piece and spawns a new one when the drop is blocked by the floor", () => {
    const shape = TETROMINOES.O[0];
    const position = { row: BOARD_HEIGHT - 2, col: 4 };
    const state: GameState = {
      ...baseState,
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
      ...baseState,
      board: settled,
      piece: { type: "O", rotation: 0, position },
    };

    const next = step(state, randomFor("I"));

    expect(next.board).toEqual(placePiece(TETROMINOES.O[0], position, settled));
    expect(next.piece).toEqual(spawnPiece(randomFor("I")));
  });

  it("does not clear rows or award score when locking a piece completes nothing", () => {
    const position = { row: BOARD_HEIGHT - 2, col: 4 };
    const state: GameState = {
      ...baseState,
      board: createEmptyBoard(),
      piece: { type: "O", rotation: 0, position },
    };

    const next = step(state, randomFor("L"));

    expect(next.score).toBe(0);
    expect(next.linesCleared).toBe(0);
    expect(next.level).toBe(1);
  });

  it("clears a single completed row and awards score for it", () => {
    let board = createEmptyBoard();
    board = fillRow(board, BOARD_HEIGHT - 1).map((row, index) =>
      index === BOARD_HEIGHT - 1 ? row.map((_, col) => (col === 4 || col === 5 ? 0 : 1) as const) : row,
    );
    const position = { row: BOARD_HEIGHT - 2, col: 4 };
    const state: GameState = {
      ...baseState,
      board,
      piece: { type: "O", rotation: 0, position },
    };

    const next = step(state, randomFor("L"));

    expect(next.linesCleared).toBe(1);
    expect(next.score).toBe(100);
    expect(next.level).toBe(1);
    expect(next.board[0].every((cell) => cell === 0)).toBe(true);
  });

  it("clears multiple completed rows at once and awards the matching score", () => {
    let board = createEmptyBoard();
    for (const row of [BOARD_HEIGHT - 2, BOARD_HEIGHT - 1]) {
      board = fillRow(board, row).map((r, index) =>
        index === row ? r.map((_, col) => (col === 4 || col === 5 ? 0 : 1) as const) : r,
      );
    }
    const position = { row: BOARD_HEIGHT - 2, col: 4 };
    const state: GameState = {
      ...baseState,
      board,
      piece: { type: "O", rotation: 0, position },
    };

    const next = step(state, randomFor("L"));

    expect(next.linesCleared).toBe(2);
    expect(next.score).toBe(300);
  });

  it("increases the level once enough lines have cleared", () => {
    let board = createEmptyBoard();
    board = fillRow(board, BOARD_HEIGHT - 1).map((row, index) =>
      index === BOARD_HEIGHT - 1 ? row.map((_, col) => (col === 4 || col === 5 ? 0 : 1) as const) : row,
    );
    const position = { row: BOARD_HEIGHT - 2, col: 4 };
    const state: GameState = {
      score: 0,
      level: 1,
      linesCleared: 9,
      board,
      piece: { type: "O", rotation: 0, position },
    };

    const next = step(state, randomFor("L"));

    expect(next.linesCleared).toBe(10);
    expect(next.level).toBe(2);
  });

  it("scales score for a clear by the level active when it happened", () => {
    let board = createEmptyBoard();
    board = fillRow(board, BOARD_HEIGHT - 1).map((row, index) =>
      index === BOARD_HEIGHT - 1 ? row.map((_, col) => (col === 4 || col === 5 ? 0 : 1) as const) : row,
    );
    const position = { row: BOARD_HEIGHT - 2, col: 4 };
    const state: GameState = {
      score: 500,
      level: 3,
      linesCleared: 20,
      board,
      piece: { type: "O", rotation: 0, position },
    };

    const next = step(state, randomFor("L"));

    expect(next.score).toBe(500 + 100 * 3);
  });
});

describe("dropIntervalForLevel", () => {
  it("returns the base interval at level 1", () => {
    expect(dropIntervalForLevel(1)).toBe(1000);
  });

  it("decreases as the level increases", () => {
    expect(dropIntervalForLevel(2)).toBe(900);
    expect(dropIntervalForLevel(5)).toBe(600);
  });

  it("never drops below the minimum interval", () => {
    expect(dropIntervalForLevel(50)).toBe(100);
  });
});
