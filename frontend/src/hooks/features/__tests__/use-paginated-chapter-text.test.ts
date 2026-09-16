import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePaginatedChapterText } from "../use-paginated-chapter-text";

function stubContainerSize(width: number, height: number) {
  Object.defineProperty(HTMLDivElement.prototype, "clientWidth", {
    configurable: true,
    value: width,
  });
  Object.defineProperty(HTMLDivElement.prototype, "clientHeight", {
    configurable: true,
    value: height,
  });
}

// Deviation from the task brief's literal stub (660x60): against the real
// computePageMetrics/paginatePlainText from Task 4 (avgCharWidth = fontSizePx
// * 0.55), 660px wide at font 20 yields charsPerLine=60, wider than the whole
// 27-char sample string, so it never wraps into more than one line/page no
// matter the height. 100x45 forces charsPerLine=9 (wraps into 4 lines) and
// linesPerPage=1 (4 pages), which is what these tests need to exercise
// pagination/clamping at all.
describe("usePaginatedChapterText", () => {
  it("paginates the given text once the container ref is attached", () => {
    stubContainerSize(100, 45);
    const { result } = renderHook(() => usePaginatedChapterText("one two three four five six", 20));

    act(() => {
      result.current.containerRef(document.createElement("div"));
    });

    expect(result.current.pages.length).toBeGreaterThan(1);
    expect(result.current.pageIndex).toBe(0);
  });

  it("nextPage/prevPage move within bounds and clamp at the edges", () => {
    stubContainerSize(100, 45);
    const { result } = renderHook(() => usePaginatedChapterText("one two three four five six", 20));
    act(() => {
      result.current.containerRef(document.createElement("div"));
    });
    const total = result.current.pages.length;

    act(() => result.current.prevPage());
    expect(result.current.pageIndex).toBe(0); // clamped, was already at 0

    act(() => {
      for (let i = 0; i < total + 2; i++) result.current.nextPage();
    });
    expect(result.current.pageIndex).toBe(total - 1); // clamped at last page

    act(() => result.current.prevPage());
    expect(result.current.pageIndex).toBe(total - 2);
  });

  it("resets to page 0 when the text input changes", () => {
    stubContainerSize(100, 45);
    const { result, rerender } = renderHook(
      ({ text }) => usePaginatedChapterText(text, 20),
      { initialProps: { text: "one two three four five six" } },
    );
    act(() => {
      result.current.containerRef(document.createElement("div"));
    });
    act(() => result.current.nextPage());
    expect(result.current.pageIndex).toBe(1);

    rerender({ text: "a completely different chapter body" });
    expect(result.current.pageIndex).toBe(0);
  });
});
