import { createEmptyBoard } from "./board";
import { drawBoard, drawPiece, sizeCanvas } from "./render";
import { TETROMINOES } from "./tetromino";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("#app element not found");
}

const canvas = document.createElement("canvas");
app.appendChild(canvas);
sizeCanvas(canvas);

const ctx = canvas.getContext("2d");

if (ctx) {
  drawBoard(ctx, createEmptyBoard());
  drawPiece(ctx, TETROMINOES.T[0], { row: 0, col: 3 });
}
