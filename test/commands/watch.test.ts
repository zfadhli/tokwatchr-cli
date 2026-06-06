import { describe, expect, it } from "bun:test";
import { executeWatch } from "../../src/commands/watch";

describe("executeWatch", () => {
  it("is a function", () => {
    expect(typeof executeWatch).toBe("function");
  });

  it("accepts a username and options", () => {
    expect(executeWatch.length).toBe(2);
  });
});
