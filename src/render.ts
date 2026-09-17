import { BOARD_HEIGHT, BOARD_WIDTH, type Position } from "./board";
import type { Grid } from "./tetromino";

export const CELL_SIZE = 30;

const BACKGROUND_COLOR = "#111827";
const GRID_LINE_COLOR = "#374151";
const BOARD_CELL_COLOR = "#6b7280";
const PIECE_COLOR = "#38bdf8";
const GHOST_COLOR = "rgba(56, 189, 248, 0.5)";

export function sizeCanvas(canvas: HTMLCanvasElement): void {
  canvas.width = BOARD_WIDTH * CELL_SIZE;
  canvas.height = BOARD_HEIGHT * CELL_SIZE;
}

export function drawBoard(ctx: CanvasRenderingContext2D, board: Grid): void {
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fillRect(0, 0, BOARD_WIDTH * CELL_SIZE, BOARD_HEIGHT * CELL_SIZE);

  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      if (board[row][col] !== 0) {
        drawCell(ctx, row, col, BOARD_CELL_COLOR);
      }
    }
  }

  drawGridLines(ctx);
}

export function drawPiece(
  ctx: CanvasRenderingContext2D,
  shape: Grid,
  position: Position,
): void {
  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col] !== 0) {
        drawCell(ctx, position.row + row, position.col + col, PIECE_COLOR);
      }
    }
  }
}

export function drawGhostPiece(
  ctx: CanvasRenderingContext2D,
  shape: Grid,
  position: Position,
): void {
  ctx.strokeStyle = GHOST_COLOR;
  ctx.lineWidth = 2;

  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col] !== 0) {
        const x = (position.col + col) * CELL_SIZE;
        const y = (position.row + row) * CELL_SIZE;
        ctx.strokeRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
      }
    }
  }
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  row: number,
  col: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
}

function drawGridLines(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = GRID_LINE_COLOR;
  ctx.beginPath();

  for (let col = 0; col <= BOARD_WIDTH; col++) {
    const x = col * CELL_SIZE;
    ctx.moveTo(x, 0);
    ctx.lineTo(x, BOARD_HEIGHT * CELL_SIZE);
  }

  for (let row = 0; row <= BOARD_HEIGHT; row++) {
    const y = row * CELL_SIZE;
    ctx.moveTo(0, y);
    ctx.lineTo(BOARD_WIDTH * CELL_SIZE, y);
  }

  ctx.stroke();
}
