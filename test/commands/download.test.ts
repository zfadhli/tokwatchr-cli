import { describe, expect, it } from "bun:test";
import { executeDownload } from "../../src/commands/download";

// We don't want to actually call tokwatchr's download() in unit tests.
// These tests verify that the command function exists and has the
// correct signature.

describe("executeDownload", () => {
  it("is a function", () => {
    expect(typeof executeDownload).toBe("function");
  });

  it("accepts a username and options", () => {
    // Just verify the function signature is correct by checking
    // its length (number of formal parameters).
    expect(executeDownload.length).toBe(2);
  });
});
