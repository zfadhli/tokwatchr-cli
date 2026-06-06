import { describe, expect, it } from "bun:test";
import { executeWatch } from "../../src/commands/watch";
import { registerSignalHandlers } from "../../src/utils/active-downloader";

describe("executeWatch", () => {
  it("is a function", () => {
    expect(typeof executeWatch).toBe("function");
  });

  it("accepts a username and options", () => {
    expect(executeWatch.length).toBe(2);
  });
});

describe("registerSignalHandlers", () => {
  it("is a function", () => {
    expect(typeof registerSignalHandlers).toBe("function");
  });

  it("accepts no arguments", () => {
    expect(registerSignalHandlers.length).toBe(0);
  });
});
