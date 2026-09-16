import { createEmptyBoard } from "./board";
import { moveLeft, moveRight, rotate, spawnPiece, step, type GameState } from "./game";
import { drawBoard, drawPiece, sizeCanvas } from "./render";
import { TETROMINOES } from "./tetromino";

const DROP_INTERVAL_MS = 1000;

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("#app element not found");
}

const canvas = document.createElement("canvas");
app.appendChild(canvas);
sizeCanvas(canvas);

const ctx = canvas.getContext("2d");

let state: GameState = { board: createEmptyBoard(), piece: spawnPiece() };

function render(): void {
  if (!ctx) return;
  drawBoard(ctx, state.board);
  drawPiece(
    ctx,
    TETROMINOES[state.piece.type][state.piece.rotation],
    state.piece.position,
  );
}

render();
setInterval(() => {
  state = step(state);
  render();
}, DROP_INTERVAL_MS);

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
    default:
      return;
  }
  render();
});
