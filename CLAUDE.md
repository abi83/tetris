# CLAUDE.md

Guidance for agents working in this repo.

## What this is

A browser Tetris game — a proof-of-concept consumer repo for the `interns`
pipeline. Keep it small and self-contained.

## Stack

- Vite + TypeScript.
- Vitest for tests.
- No Prettier/ESLint config — match the style of the surrounding code.

## Testing

Unit-test the game logic — board, tetromino model, rotation, line clears,
scoring. Rendering and keyboard input don't need tests. A change to logic
lands with tests for it.

## One source of truth

No fallback chains and no overlapping configuration sources. A value comes
from exactly one place — a constant, a config object, or a function
parameter — never "this, or that, or the built-in default". If you catch
yourself writing `a ?? b ?? c` over config, stop and pick one owner.

## Comments

Prefer self-documenting code — clear names, small functions, obvious control
flow. Add a comment only when it carries information the code cannot: a
non-obvious *why*, a workaround and its reason, a subtle invariant. Don't
restate what the next line does, and don't write narrated section headers.

## Style

- Small functions, early returns over nested conditionals.
- `strict: true` in tsconfig.
