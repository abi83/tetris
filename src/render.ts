import { BOARD_HEIGHT, BOARD_WIDTH, type Position } from "./board";
import { TETROMINOES, type Grid, type TetrominoType } from "./tetromino";

export const CELL_SIZE = 30;
export const SIDE_PANEL_WIDTH = 150;
const PANEL_PADDING = 12;
const PREVIEW_CELL_SIZE = 18;
const PREVIEW_SLOT_HEIGHT = 80;

const BACKGROUND_COLOR = "#111827";
const GRID_LINE_COLOR = "#374151";
const BOARD_CELL_COLOR = "#6b7280";
const PIECE_COLOR = "#38bdf8";
const GHOST_COLOR = "rgba(56, 189, 248, 0.5)";
const PANEL_BACKGROUND_COLOR = "#1f2937";
const PANEL_LABEL_COLOR = "#9ca3af";
const OVERLAY_BACKGROUND_COLOR = "rgba(17, 24, 39, 0.75)";
const OVERLAY_TEXT_COLOR = "#f9fafb";
const CLEAR_FLASH_COLOR = "249, 250, 251";
const LOCK_FLASH_COLOR = "255, 255, 255";

// How long the line-clear/lock flash takes to fade out, in milliseconds.
export const FLASH_DURATION_MS = 250;

export function sizeCanvas(canvas: HTMLCanvasElement): void {
  canvas.width = BOARD_WIDTH * CELL_SIZE + SIDE_PANEL_WIDTH;
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

// progress runs from 0 (just cleared, fully opaque) to 1 (faded out).
export function drawClearedRowsFlash(
  ctx: CanvasRenderingContext2D,
  rows: readonly number[],
  progress: number,
): void {
  const alpha = 1 - progress;
  ctx.fillStyle = `rgba(${CLEAR_FLASH_COLOR}, ${alpha})`;

  for (const row of rows) {
    ctx.fillRect(0, row * CELL_SIZE, BOARD_WIDTH * CELL_SIZE, CELL_SIZE);
  }
}

// progress runs from 0 (just locked, fully opaque) to 1 (faded out).
export function drawLockedCellsFlash(
  ctx: CanvasRenderingContext2D,
  cells: readonly Position[],
  progress: number,
): void {
  const alpha = 1 - progress;
  ctx.fillStyle = `rgba(${LOCK_FLASH_COLOR}, ${alpha})`;

  for (const cell of cells) {
    ctx.fillRect(cell.col * CELL_SIZE, cell.row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
  }
}

export function drawSidePanel(
  ctx: CanvasRenderingContext2D,
  hold: TetrominoType | null,
  queue: readonly TetrominoType[],
): void {
  const x = BOARD_WIDTH * CELL_SIZE;

  ctx.fillStyle = PANEL_BACKGROUND_COLOR;
  ctx.fillRect(x, 0, SIDE_PANEL_WIDTH, BOARD_HEIGHT * CELL_SIZE);

  ctx.fillStyle = PANEL_LABEL_COLOR;
  ctx.font = "14px sans-serif";
  ctx.fillText("HOLD", x + PANEL_PADDING, 20);
  drawPreviewPiece(ctx, hold, x + PANEL_PADDING, 30);

  ctx.fillStyle = PANEL_LABEL_COLOR;
  ctx.fillText("NEXT", x + PANEL_PADDING, 30 + PREVIEW_SLOT_HEIGHT + 20);
  queue.forEach((type, index) => {
    const y = 30 + PREVIEW_SLOT_HEIGHT + 30 + index * PREVIEW_SLOT_HEIGHT;
    drawPreviewPiece(ctx, type, x + PANEL_PADDING, y);
  });
}

function drawPreviewPiece(
  ctx: CanvasRenderingContext2D,
  type: TetrominoType | null,
  x: number,
  y: number,
): void {
  if (type === null) return;

  const shape = TETROMINOES[type][0];
  ctx.fillStyle = PIECE_COLOR;

  for (let row = 0; row < shape.length; row++) {
    for (let col = 0; col < shape[row].length; col++) {
      if (shape[row][col] !== 0) {
        ctx.fillRect(
          x + col * PREVIEW_CELL_SIZE,
          y + row * PREVIEW_CELL_SIZE,
          PREVIEW_CELL_SIZE - 2,
          PREVIEW_CELL_SIZE - 2,
        );
      }
    }
  }
}

export function drawOverlayText(ctx: CanvasRenderingContext2D, text: string): void {
  const width = BOARD_WIDTH * CELL_SIZE;
  const height = BOARD_HEIGHT * CELL_SIZE;

  ctx.fillStyle = OVERLAY_BACKGROUND_COLOR;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = OVERLAY_TEXT_COLOR;
  ctx.font = "24px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, width / 2, height / 2);
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
