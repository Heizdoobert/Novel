import { describe, it, expect } from "vitest";
import { getChapterContentUrl } from "./chapter-content";

describe("getChapterContentUrl", () => {
  it("returns the trimmed URL for a plain string", () => {
    expect(getChapterContentUrl("chapters/abc/1.txt")).toBe("chapters/abc/1.txt");
    expect(getChapterContentUrl("  chapters/abc/1.txt  ")).toBe("chapters/abc/1.txt");
  });

  it("returns null for empty, null, or non-string content", () => {
    expect(getChapterContentUrl("")).toBeNull();
    expect(getChapterContentUrl("   ")).toBeNull();
    expect(getChapterContentUrl(null)).toBeNull();
    expect(getChapterContentUrl(undefined)).toBeNull();
    expect(getChapterContentUrl(42)).toBeNull();
  });
});
