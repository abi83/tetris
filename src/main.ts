import {
  dropIntervalForLevel,
  hardDrop,
  landingPosition,
  moveLeft,
  moveRight,
  restart,
  rotate,
  step,
  togglePause,
  type GameState,
} from "./game";
import { drawBoard, drawGhostPiece, drawOverlayText, drawPiece, sizeCanvas } from "./render";
import { TETROMINOES } from "./tetromino";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("#app element not found");
}

const canvas = document.createElement("canvas");
app.appendChild(canvas);
sizeCanvas(canvas);

const ctx = canvas.getContext("2d");

let state: GameState = restart();

function render(): void {
  if (!ctx) return;
  const shape = TETROMINOES[state.piece.type][state.piece.rotation];
  drawBoard(ctx, state.board);
  drawGhostPiece(ctx, shape, landingPosition(state.piece, state.board));
  drawPiece(ctx, shape, state.piece.position);

  if (state.status === "paused") {
    drawOverlayText(ctx, "Paused");
  } else if (state.status === "gameOver") {
    drawOverlayText(ctx, "Game Over");
  }
}

render();

let dropIntervalId = setInterval(tick, dropIntervalForLevel(state.level));

function tick(): void {
  const previousLevel = state.level;
  state = step(state);
  render();

  if (state.level !== previousLevel) {
    clearInterval(dropIntervalId);
    dropIntervalId = setInterval(tick, dropIntervalForLevel(state.level));
  }
}

document.addEventListener("keydown", (event) => {
  switch (event.key) {
    case "ArrowLeft":
      state = moveLeft(state);
      break;
    case "ArrowRight":
      state = moveRight(state);
      break;
    case "ArrowUp":
      state = rotate(state);
      break;
    case "ArrowDown":
      state = step(state);
      break;
    case " ":
      state = hardDrop(state);
      break;
    case "p":
      state = togglePause(state);
      break;
    case "r":
      state = restart();
      break;
    default:
      return;
  }
  render();
});
