import { describe, expect, it } from "bun:test";
import { executeWatch, registerSigintHandler } from "../../src/commands/watch";

describe("executeWatch", () => {
  it("is a function", () => {
    expect(typeof executeWatch).toBe("function");
  });

  it("accepts a username and options", () => {
    expect(executeWatch.length).toBe(2);
  });
});

describe("registerSigintHandler", () => {
  it("is a function", () => {
    expect(typeof registerSigintHandler).toBe("function");
  });

  it("accepts no arguments", () => {
    expect(registerSigintHandler.length).toBe(0);
  });
});
