export function wrapLines(text: string, charsPerLine: number): string[] {
  const paragraphs = text.split("\n");
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    if (paragraph.length === 0) {
      lines.push("");
      continue;
    }
    const words = paragraph.split(" ");
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length > charsPerLine && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    lines.push(current);
  }

  return lines;
}

export function paginateLines(lines: string[], linesPerPage: number): string[] {
  const pages: string[] = [];
  for (let i = 0; i < lines.length; i += linesPerPage) {
    pages.push(lines.slice(i, i + linesPerPage).join("\n"));
  }
  return pages.length > 0 ? pages : [""];
}

export function paginatePlainText(
  text: string,
  charsPerLine: number,
  linesPerPage: number,
): string[] {
  return paginateLines(wrapLines(text, charsPerLine), linesPerPage);
}

export function computePageMetrics(
  container: { clientWidth: number; clientHeight: number },
  fontSizePx: number,
  lineHeightMultiplier = 1.5,
): { charsPerLine: number; linesPerPage: number } {
  // ponytail: 0.55 average-char-width ratio is a heuristic (no canvas
  // measureText in this environment), tune per-font if pages visibly
  // over/underflow in QA.
  const avgCharWidth = fontSizePx * 0.55;
  const charsPerLine = Math.max(1, Math.floor(container.clientWidth / avgCharWidth));
  const linesPerPage = Math.max(
    1,
    Math.floor(container.clientHeight / (fontSizePx * lineHeightMultiplier)),
  );
  return { charsPerLine, linesPerPage };
}
