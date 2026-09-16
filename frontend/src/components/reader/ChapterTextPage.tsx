import React from "react";

export interface ChapterTextPageProps {
  content: string;
  pageNumber: number;
  totalPages: number;
}

export const ChapterTextPage: React.FC<ChapterTextPageProps> = ({ content, pageNumber, totalPages }) => (
  <div
    data-testid="chapter-text-page"
    className="w-full max-w-2xl mx-auto px-4 py-8 whitespace-pre-wrap leading-relaxed text-base text-slate-800 dark:text-slate-100"
  >
    {content}
    <div className="mt-6 text-center text-xs text-slate-400">
      Trang {pageNumber}/{totalPages}
    </div>
  </div>
);
