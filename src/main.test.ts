import { beforeEach, describe, expect, it } from "vitest";

describe("main", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  it("mounts a canvas into #app", async () => {
    await import("./main");

    expect(document.querySelector("#app canvas")).not.toBeNull();
  });
});
