"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { computePageMetrics, paginatePlainText } from "@/lib/reader/paginate-text";

export function usePaginatedChapterText(text: string, fontSizePx = 18) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const [metrics, setMetrics] = useState<{ charsPerLine: number; linesPerPage: number } | null>(
    null,
  );
  const [pageIndex, setPageIndexState] = useState(0);

  const containerRef = useCallback(
    (node: HTMLDivElement | null) => {
      elRef.current = node;
      if (!node) return;
      setMetrics(computePageMetrics(node, fontSizePx));
    },
    [fontSizePx],
  );

  useEffect(() => {
    if (!elRef.current) return;
    const observer = new ResizeObserver(() => {
      if (elRef.current) setMetrics(computePageMetrics(elRef.current, fontSizePx));
    });
    observer.observe(elRef.current);
    return () => observer.disconnect();
  }, [fontSizePx]);

  const pages = useMemo(() => {
    if (!metrics) return [text];
    return paginatePlainText(text, metrics.charsPerLine, metrics.linesPerPage);
  }, [text, metrics]);

  useEffect(() => {
    setPageIndexState(0);
  }, [text]);

  const clamp = useCallback((i: number) => Math.max(0, Math.min(i, pages.length - 1)), [pages.length]);
  const setPageIndex = useCallback((i: number) => setPageIndexState(clamp(i)), [clamp]);
  // nextPage/prevPage use the functional setState form (not the `pageIndex`
  // closure) so that several calls fired synchronously in the same batch
  // (e.g. a fast page-turn gesture, or a test loop) each see the
  // not-yet-committed value instead of all reading the same stale index.
  const nextPage = useCallback(() => setPageIndexState((prev) => clamp(prev + 1)), [clamp]);
  const prevPage = useCallback(() => setPageIndexState((prev) => clamp(prev - 1)), [clamp]);

  return { containerRef, pages, pageIndex, setPageIndex, nextPage, prevPage };
}
