import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ChapterTextPage } from "./ChapterTextPage";

describe("ChapterTextPage", () => {
  it("renders the page content and page counter", () => {
    render(<ChapterTextPage content="Once upon a time." pageNumber={2} totalPages={5} />);
    expect(screen.getByText("Once upon a time.")).toBeDefined();
    expect(screen.getByText("Trang 2/5")).toBeDefined();
  });
});
