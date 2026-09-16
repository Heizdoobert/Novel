import { describe, it, expect } from "vitest";
import { wrapLines, paginateLines, paginatePlainText, computePageMetrics } from "./paginate-text";

describe("wrapLines", () => {
  it("wraps long text at word boundaries within charsPerLine", () => {
    const lines = wrapLines("The quick brown fox jumps over the lazy dog", 15);
    expect(lines).toEqual(["The quick brown", "fox jumps over", "the lazy dog"]);
    for (const line of lines) expect(line.length).toBeLessThanOrEqual(15);
  });

  it("preserves paragraph breaks as separate line groups", () => {
    const lines = wrapLines("Hello world\n\nSecond paragraph", 20);
    expect(lines).toEqual(["Hello world", "", "Second paragraph"]);
  });

  it("returns a single empty line for empty input", () => {
    expect(wrapLines("", 10)).toEqual([""]);
  });
});

describe("paginateLines", () => {
  it("groups lines into pages of linesPerPage, joined by newline", () => {
    const lines = ["a", "b", "c", "d", "e"];
    expect(paginateLines(lines, 2)).toEqual(["a\nb", "c\nd", "e"]);
  });

  it("returns one page for input shorter than a page", () => {
    expect(paginateLines(["a", "b"], 10)).toEqual(["a\nb"]);
  });
});

describe("paginatePlainText", () => {
  it("wraps then paginates in one call", () => {
    const pages = paginatePlainText("one two three four five six", 11, 1);
    // wrapLines(11) -> ["one two", "three four", "five six"]; 1 line/page -> 3 pages
    expect(pages).toEqual(["one two", "three four", "five six"]);
  });
});

describe("computePageMetrics", () => {
  it("derives charsPerLine and linesPerPage from container size and font", () => {
    // ponytail: 0.55 average-char-width ratio is a heuristic, not measured glyph
    // metrics; tune against real fonts if pagination visibly over/underflows.
    const metrics = computePageMetrics({ clientWidth: 660, clientHeight: 900 }, 20, 1.5);
    expect(metrics.charsPerLine).toBe(60); // floor(660 / (20 * 0.55))
    expect(metrics.linesPerPage).toBe(30); // floor(900 / (20 * 1.5))
  });

  it("never returns zero (avoids divide-by-zero/infinite-page bugs downstream)", () => {
    const metrics = computePageMetrics({ clientWidth: 0, clientHeight: 0 }, 16, 1.5);
    expect(metrics.charsPerLine).toBeGreaterThanOrEqual(1);
    expect(metrics.linesPerPage).toBeGreaterThanOrEqual(1);
  });
});
