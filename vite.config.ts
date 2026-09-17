import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "/tetris/",
  test: {
    environment: "jsdom",
  },
});
