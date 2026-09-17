import { describe, expect, it } from "vitest";
import { BOARD_HEIGHT, BOARD_WIDTH, createEmptyBoard, placePiece } from "./board";
import {
  createGameState,
  drawPiece,
  dropIntervalForLevel,
  hardDrop,
  holdPiece,
  landingPosition,
  moveLeft,
  moveRight,
  NEXT_QUEUE_SIZE,
  rotate,
  spawnPiece,
  step,
  type GameState,
} from "./game";
import { TETROMINOES, TETROMINO_TYPES, type TetrominoType } from "./tetromino";

function stateWith(overrides: Partial<GameState> = {}): GameState {
  return {
    board: createEmptyBoard(),
    piece: { type: "T", rotation: 0, position: { row: 0, col: 3 } },
    queue: ["I", "O", "S", "Z"],
    hold: null,
    canHold: true,
    score: 0,
    level: 1,
    linesCleared: 0,
    ...overrides,
  };
}

function fillRow(board: ReturnType<typeof createEmptyBoard>, row: number) {
  return board.map((r, index) => (index === row ? r.map(() => 1 as const) : r));
}

describe("spawnPiece", () => {
  it("sets the piece type", () => {
    expect(spawnPiece("L").type).toBe("L");
  });

  it("starts at rotation 0", () => {
    expect(spawnPiece("T").rotation).toBe(0);
  });

  it("starts at the top of the board", () => {
    expect(spawnPiece("T").position.row).toBe(0);
  });

  it.each(TETROMINO_TYPES)("centers %s horizontally", (type) => {
    const piece = spawnPiece(type);
    const shapeWidth = TETROMINOES[type][0][0].length;
    expect(piece.position.col).toBe(Math.floor((BOARD_WIDTH - shapeWidth) / 2));
  });
});

describe("drawPiece (7-bag randomizer)", () => {
  it("draws every tetromino type exactly once per bag before any type repeats", () => {
    let queue: TetrominoType[] = [];
    const draws: TetrominoType[] = [];

    for (let i = 0; i < TETROMINO_TYPES.length * 50; i++) {
      const result = drawPiece(queue);
      draws.push(result.type);
      queue = result.queue;
    }

    for (let bagStart = 0; bagStart < draws.length; bagStart += TETROMINO_TYPES.length) {
      const bag = draws.slice(bagStart, bagStart + TETROMINO_TYPES.length);
      expect([...bag].sort()).toEqual([...TETROMINO_TYPES].sort());
    }
  });

  it("keeps at least NEXT_QUEUE_SIZE pieces queued after every draw", () => {
    let queue: TetrominoType[] = [];

    for (let i = 0; i < 30; i++) {
      const result = drawPiece(queue);
      queue = result.queue;
      expect(queue.length).toBeGreaterThanOrEqual(NEXT_QUEUE_SIZE);
    }
  });

  it("does not draw from the bag while the queue still has more than NEXT_QUEUE_SIZE pieces", () => {
    const queue: TetrominoType[] = ["I", "O", "S", "Z"];

    const result = drawPiece(queue, () => {
      throw new Error("random should not be called");
    });

    expect(result.type).toBe("I");
    expect(result.queue).toEqual(["O", "S", "Z"]);
  });
});

describe("createGameState", () => {
  it("starts with an empty board, no hold, and default score/level", () => {
    const state = createGameState(() => 0);

    expect(state.board).toEqual(createEmptyBoard());
    expect(state.hold).toBeNull();
    expect(state.canHold).toBe(true);
    expect(state.score).toBe(0);
    expect(state.level).toBe(1);
    expect(state.linesCleared).toBe(0);
  });

  it("draws the active piece and queue from the same first bag", () => {
    const state = createGameState(() => 0);
    const firstBag = [state.piece.type, ...state.queue.slice(0, TETROMINO_TYPES.length - 1)];

    expect([...firstBag].sort()).toEqual([...TETROMINO_TYPES].sort());
  });

  it("keeps at least NEXT_QUEUE_SIZE pieces queued", () => {
    const state = createGameState(() => 0);

    expect(state.queue.length).toBeGreaterThanOrEqual(NEXT_QUEUE_SIZE);
  });
});

describe("moveLeft", () => {
  it("moves the piece one column left when unobstructed", () => {
    const state = stateWith({ piece: { type: "T", rotation: 0, position: { row: 0, col: 3 } } });

    const next = moveLeft(state);

    expect(next.piece.position).toEqual({ row: 0, col: 2 });
    expect(next.board).toBe(state.board);
  });

  it("does not move past the left edge", () => {
    const state = stateWith({ piece: { type: "T", rotation: 0, position: { row: 0, col: 0 } } });

    const next = moveLeft(state);

    expect(next).toBe(state);
  });

  it("does not move into a settled cell", () => {
    const settled = placePiece(TETROMINOES.O[0], { row: 0, col: 2 }, createEmptyBoard());
    const state = stateWith({
      board: settled,
      piece: { type: "T", rotation: 0, position: { row: 0, col: 3 } },
    });

    const next = moveLeft(state);

    expect(next).toBe(state);
  });

  it("preserves queue, hold, and canHold", () => {
    const state = stateWith({
      piece: { type: "T", rotation: 0, position: { row: 0, col: 3 } },
      queue: ["I", "O", "S"],
      hold: "J",
      canHold: false,
    });

    const next = moveLeft(state);

    expect(next.queue).toBe(state.queue);
    expect(next.hold).toBe(state.hold);
    expect(next.canHold).toBe(state.canHold);
  });
});

describe("moveRight", () => {
  it("moves the piece one column right when unobstructed", () => {
    const state = stateWith({ piece: { type: "T", rotation: 0, position: { row: 0, col: 3 } } });

    const next = moveRight(state);

    expect(next.piece.position).toEqual({ row: 0, col: 4 });
    expect(next.board).toBe(state.board);
  });

  it("does not move past the right edge", () => {
    const state = stateWith({
      piece: { type: "T", rotation: 0, position: { row: 0, col: BOARD_WIDTH - 3 } },
    });

    const next = moveRight(state);

    expect(next).toBe(state);
  });
});

describe("rotate", () => {
  it("advances to the next rotation state when unobstructed", () => {
    const state = stateWith({ piece: { type: "T", rotation: 0, position: { row: 3, col: 3 } } });

    const next = rotate(state);

    expect(next.piece.rotation).toBe(1);
    expect(next.piece.type).toBe("T");
    expect(next.board).toBe(state.board);
  });

  it("wraps from rotation 3 back to 0", () => {
    const state = stateWith({ piece: { type: "T", rotation: 3, position: { row: 3, col: 3 } } });

    const next = rotate(state);

    expect(next.piece.rotation).toBe(0);
  });

  it("is a no-op when the rotated shape would collide with the board edge", () => {
    const state = stateWith({
      piece: { type: "I", rotation: 1, position: { row: 0, col: BOARD_WIDTH - 3 } },
    });

    const next = rotate(state);

    expect(next).toBe(state);
  });

  it("is a no-op when the rotated shape would collide with a settled cell", () => {
    const settled = placePiece([[1]], { row: 5, col: 4 }, createEmptyBoard());
    const state = stateWith({
      board: settled,
      piece: { type: "T", rotation: 0, position: { row: 3, col: 3 } },
    });

    const next = rotate(state);

    expect(next).toBe(state);
  });

  it("preserves queue, hold, and canHold", () => {
    const state = stateWith({
      piece: { type: "T", rotation: 0, position: { row: 3, col: 3 } },
      queue: ["I", "O", "S"],
      hold: "J",
      canHold: false,
    });

    const next = rotate(state);

    expect(next.queue).toBe(state.queue);
    expect(next.hold).toBe(state.hold);
    expect(next.canHold).toBe(state.canHold);
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
  it("moves the piece straight to its landing position and locks it", () => {
    const state = stateWith({
      piece: { type: "O", rotation: 0, position: { row: 0, col: 4 } },
      queue: ["L", "S", "T", "J"],
    });

    const next = hardDrop(state);

    expect(next.board).toEqual(
      placePiece(TETROMINOES.O[0], { row: BOARD_HEIGHT - 2, col: 4 }, state.board),
    );
    expect(next.piece).toEqual(spawnPiece("L"));
    expect(next.queue).toEqual(["S", "T", "J"]);
  });

  it("clears completed rows and awards score the same as a normal lock", () => {
    let board = createEmptyBoard();
    board = fillRow(board, BOARD_HEIGHT - 1).map((row, index) =>
      index === BOARD_HEIGHT - 1 ? row.map((_, col) => (col === 4 || col === 5 ? 0 : 1) as const) : row,
    );
    const state = stateWith({
      board,
      piece: { type: "O", rotation: 0, position: { row: 0, col: 4 } },
      queue: ["L", "S", "T", "J"],
    });

    const next = hardDrop(state);

    expect(next.linesCleared).toBe(1);
    expect(next.score).toBe(100);
    expect(next.level).toBe(1);
  });

  it("resets canHold to true and leaves the hold slot untouched", () => {
    const state = stateWith({
      piece: { type: "O", rotation: 0, position: { row: 0, col: 4 } },
      queue: ["L", "S", "T", "J"],
      hold: "I",
      canHold: false,
    });

    const next = hardDrop(state);

    expect(next.canHold).toBe(true);
    expect(next.hold).toBe("I");
  });
});

describe("step", () => {
  it("moves the piece down one row when the row below is clear", () => {
    const state = stateWith({ piece: { type: "T", rotation: 0, position: { row: 0, col: 3 } } });

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
    step(stateWith({ board, piece: { type: "T", rotation: 0, position: { row: 0, col: 3 } } }));
    expect(board).toEqual(snapshot);
  });

  it("locks the piece and spawns a new one when the drop is blocked by the floor", () => {
    const shape = TETROMINOES.O[0];
    const position = { row: BOARD_HEIGHT - 2, col: 4 };
    const state = stateWith({
      piece: { type: "O", rotation: 0, position },
      queue: ["L", "S", "T", "J"],
    });

    const next = step(state);

    expect(next.board).toEqual(placePiece(shape, position, state.board));
    expect(next.piece).toEqual(spawnPiece("L"));
    expect(next.queue).toEqual(["S", "T", "J"]);
  });

  it("locks the piece and spawns a new one when the drop is blocked by another piece", () => {
    const settled = placePiece(TETROMINOES.O[0], { row: 10, col: 4 }, createEmptyBoard());
    const position = { row: 8, col: 4 };
    const state = stateWith({
      board: settled,
      piece: { type: "O", rotation: 0, position },
      queue: ["I", "S", "T", "J"],
    });

    const next = step(state);

    expect(next.board).toEqual(placePiece(TETROMINOES.O[0], position, settled));
    expect(next.piece).toEqual(spawnPiece("I"));
    expect(next.queue).toEqual(["S", "T", "J"]);
  });

  it("does not clear rows or award score when locking a piece completes nothing", () => {
    const position = { row: BOARD_HEIGHT - 2, col: 4 };
    const state = stateWith({
      piece: { type: "O", rotation: 0, position },
      queue: ["L", "S", "T", "J"],
    });

    const next = step(state);

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
    const state = stateWith({
      board,
      piece: { type: "O", rotation: 0, position },
      queue: ["L", "S", "T", "J"],
    });

    const next = step(state);

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
    const state = stateWith({
      board,
      piece: { type: "O", rotation: 0, position },
      queue: ["L", "S", "T", "J"],
    });

    const next = step(state);

    expect(next.linesCleared).toBe(2);
    expect(next.score).toBe(300);
  });

  it("increases the level once enough lines have cleared", () => {
    let board = createEmptyBoard();
    board = fillRow(board, BOARD_HEIGHT - 1).map((row, index) =>
      index === BOARD_HEIGHT - 1 ? row.map((_, col) => (col === 4 || col === 5 ? 0 : 1) as const) : row,
    );
    const position = { row: BOARD_HEIGHT - 2, col: 4 };
    const state = stateWith({
      board,
      piece: { type: "O", rotation: 0, position },
      queue: ["L", "S", "T", "J"],
      linesCleared: 9,
    });

    const next = step(state);

    expect(next.linesCleared).toBe(10);
    expect(next.level).toBe(2);
  });

  it("scales score for a clear by the level active when it happened", () => {
    let board = createEmptyBoard();
    board = fillRow(board, BOARD_HEIGHT - 1).map((row, index) =>
      index === BOARD_HEIGHT - 1 ? row.map((_, col) => (col === 4 || col === 5 ? 0 : 1) as const) : row,
    );
    const position = { row: BOARD_HEIGHT - 2, col: 4 };
    const state = stateWith({
      board,
      piece: { type: "O", rotation: 0, position },
      queue: ["L", "S", "T", "J"],
      score: 500,
      level: 3,
      linesCleared: 20,
    });

    const next = step(state);

    expect(next.score).toBe(500 + 100 * 3);
  });
});

describe("holdPiece", () => {
  it("moves the active piece into an empty hold slot and draws the next piece from the queue", () => {
    const state = stateWith({
      piece: { type: "T", rotation: 2, position: { row: 5, col: 3 } },
      queue: ["L", "S", "J", "I"],
      hold: null,
      canHold: true,
    });

    const next = holdPiece(state);

    expect(next.hold).toBe("T");
    expect(next.piece).toEqual(spawnPiece("L"));
    expect(next.queue).toEqual(["S", "J", "I"]);
    expect(next.canHold).toBe(false);
  });

  it("swaps the active piece with an occupied hold slot without touching the queue", () => {
    const state = stateWith({
      piece: { type: "T", rotation: 2, position: { row: 5, col: 3 } },
      queue: ["L", "S", "J", "I"],
      hold: "O",
      canHold: true,
    });

    const next = holdPiece(state);

    expect(next.hold).toBe("T");
    expect(next.piece).toEqual(spawnPiece("O"));
    expect(next.queue).toEqual(state.queue);
    expect(next.canHold).toBe(false);
  });

  it("resets the swapped-out piece to its spawn rotation and position", () => {
    const state = stateWith({
      piece: { type: "T", rotation: 2, position: { row: 5, col: 3 } },
      queue: ["L", "S", "J", "I"],
      hold: "O",
    });

    const next = holdPiece(state);

    expect(next.piece.rotation).toBe(0);
    expect(next.piece.position).toEqual(spawnPiece("O").position);
  });

  it("is a no-op when hold has already been used for this piece", () => {
    const state = stateWith({
      piece: { type: "T", rotation: 0, position: { row: 5, col: 3 } },
      queue: ["L", "S", "J", "I"],
      hold: "O",
      canHold: false,
    });

    const next = holdPiece(state);

    expect(next).toBe(state);
  });

  it("is available again after the piece locks", () => {
    const held = holdPiece(
      stateWith({
        piece: { type: "T", rotation: 0, position: { row: 5, col: 3 } },
        queue: ["L", "S", "J", "I"],
      }),
    );
    expect(held.canHold).toBe(false);

    const position = { row: BOARD_HEIGHT - 2, col: 4 };
    const locked = hardDrop({ ...held, piece: { ...held.piece, position } });

    expect(locked.canHold).toBe(true);
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
