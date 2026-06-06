import { describe, expect, it } from "bun:test";
import { formatBytes, formatDuration, formatSpeed } from "../../src/utils/format";

describe("formatBytes", () => {
  it("formats bytes", () => {
    expect(formatBytes(0)).toBe("0.0 B");
  });

  it("formats kilobytes", () => {
    expect(formatBytes(1024)).toBe("1.0 KB");
  });

  it("formats megabytes", () => {
    expect(formatBytes(1_048_576)).toBe("1.0 MB");
  });

  it("formats gigabytes", () => {
    expect(formatBytes(1_073_741_824)).toBe("1.0 GB");
  });

  it("rounds to one decimal", () => {
    expect(formatBytes(1_500_000)).toBe("1.4 MB");
  });
});

describe("formatDuration", () => {
  it("formats seconds only", () => {
    expect(formatDuration(42)).toBe("42s");
  });

  it("formats minutes and seconds", () => {
    expect(formatDuration(125)).toBe("2m 5s");
  });

  it("formats hours, minutes, seconds", () => {
    expect(formatDuration(3661)).toBe("1h 1m 1s");
  });

  it("formats zero", () => {
    expect(formatDuration(0)).toBe("0s");
  });
});

describe("formatSpeed", () => {
  it("formats bytes per second", () => {
    expect(formatSpeed(500)).toBe("500.0 B/s");
  });

  it("formats megabytes per second", () => {
    expect(formatSpeed(3_200_000)).toBe("3.1 MB/s");
  });
});
