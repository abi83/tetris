import {
  createGameState,
  dropIntervalForLevel,
  hardDrop,
  holdPiece,
  landingPosition,
  moveLeft,
  moveRight,
  NEXT_QUEUE_SIZE,
  restart,
  rotate,
  step,
  togglePause,
  type GameState,
} from "./game";
import {
  drawBoard,
  drawClearedRowsFlash,
  drawGhostPiece,
  drawLockedCellsFlash,
  drawOverlayText,
  drawPiece,
  drawSidePanel,
  FLASH_DURATION_MS,
  sizeCanvas,
} from "./render";
import { TETROMINOES } from "./tetromino";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("#app element not found");
}

const canvas = document.createElement("canvas");
app.appendChild(canvas);
sizeCanvas(canvas);

const ctx = canvas.getContext("2d");

let state: GameState = createGameState();

// Timestamps marking when the current clearedRows/lockedCells flash began,
// so render() can fade it out independently of how often game state changes.
let clearFlashStartedAt: number | null = null;
let lockFlashStartedAt: number | null = null;

function setState(next: GameState): void {
  if (next.clearedRows.length > 0 && next.clearedRows !== state.clearedRows) {
    clearFlashStartedAt = performance.now();
  }
  if (next.lockedCells.length > 0 && next.lockedCells !== state.lockedCells) {
    lockFlashStartedAt = performance.now();
  }
  state = next;
}

function render(): void {
  if (!ctx) return;
  const shape = TETROMINOES[state.piece.type][state.piece.rotation];

  // While the flash plays, draw the board as it looked right after the lock
  // (rows not yet collapsed) so clearedRows highlights the rows that were
  // actually completed, at the position they were completed at.
  const clearProgress =
    clearFlashStartedAt === null ? null : (performance.now() - clearFlashStartedAt) / FLASH_DURATION_MS;
  const showPreClearBoard = clearProgress !== null && clearProgress < 1 && state.preClearBoard !== null;

  drawBoard(ctx, showPreClearBoard ? state.preClearBoard! : state.board);
  drawGhostPiece(ctx, shape, landingPosition(state.piece, state.board));
  drawPiece(ctx, shape, state.piece.position);

  if (clearProgress !== null) {
    if (clearProgress < 1) {
      drawClearedRowsFlash(ctx, state.clearedRows, clearProgress);
    } else {
      clearFlashStartedAt = null;
    }
  }

  if (lockFlashStartedAt !== null) {
    const progress = (performance.now() - lockFlashStartedAt) / FLASH_DURATION_MS;
    if (progress < 1) {
      drawLockedCellsFlash(ctx, state.lockedCells, progress);
    } else {
      lockFlashStartedAt = null;
    }
  }

  drawSidePanel(ctx, state.hold, state.queue.slice(0, NEXT_QUEUE_SIZE));

  if (state.status === "paused") {
    drawOverlayText(ctx, "Paused");
  } else if (state.status === "gameOver") {
    drawOverlayText(ctx, "Game Over");
  }
}

function animate(): void {
  render();
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);

let dropIntervalId = setInterval(tick, dropIntervalForLevel(state.level));

function tick(): void {
  const previousLevel = state.level;
  setState(step(state));

  if (state.level !== previousLevel) {
    clearInterval(dropIntervalId);
    dropIntervalId = setInterval(tick, dropIntervalForLevel(state.level));
  }
}

document.addEventListener("keydown", (event) => {
  switch (event.key) {
    case "ArrowLeft":
      setState(moveLeft(state));
      break;
    case "ArrowRight":
      setState(moveRight(state));
      break;
    case "ArrowUp":
      setState(rotate(state));
      break;
    case "ArrowDown":
      setState(step(state));
      break;
    case " ":
      setState(hardDrop(state));
      break;
    case "c":
    case "C":
      setState(holdPiece(state));
      break;
    case "p":
      setState(togglePause(state));
      break;
    case "r":
      setState(restart());
      break;
    default:
      return;
  }
});
