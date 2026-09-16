"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Home, List, Download, Sun, Moon } from "lucide-react";
import { ChapterTextPage } from "@/components/reader/ChapterTextPage";
import { AdRenderer } from "@/components/reader/AdRenderer";
import { ChapterCommentsSection } from "@/components/reader/ChapterCommentsSection";
import { useReadChapterPresenter, type ReaderInitialData } from "@/hooks/presenters/useReadChapterPresenter";
import { ROUTES } from "@/lib/constants/routes";

export interface ChapterReaderPageContentProps {
  initialData?: ReaderInitialData | null;
}

export const ChapterReaderPageContent: React.FC<ChapterReaderPageContentProps> = ({ initialData }) => {
  const {
    comicId,
    chapterId,
    comic,
    currentChapter,
    allChapters,
    loading,
    showToolbar,
    setShowToolbar,
    showChapterMenu,
    setShowChapterMenu,
    downloading,
    progress,
    theme,
    toggleTheme,
    handleTouchStart,
    handleTouchEnd,
    handleSelectChapter,
    handleDownload,
    containerRef,
    pageContent,
    pageIndex,
    totalPages,
    goToNextPage,
    goToPrevPage,
    prevChapter,
    nextChapter,
  } = useReadChapterPresenter(initialData);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goToNextPage();
      if (e.key === "ArrowLeft") goToPrevPage();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goToNextPage, goToPrevPage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentChapter) {
    return (
      <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
          Không tìm thấy chương truyện
        </h1>
        <Link href={ROUTES.HOME} className="px-6 py-2 bg-primary text-white rounded-full">
          Quay lại trang chủ
        </Link>
      </div>
    );
  }

  const chapterNavClass = (chapter: typeof prevChapter) =>
    `flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-5 py-3 rounded-xl font-bold text-xs sm:text-base transition-all flex-1 border ${
      chapter
        ? "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 hover:border-primary hover:text-primary dark:hover:border-primary dark:hover:text-primary"
        : "border-transparent bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-zinc-600 pointer-events-none"
    }`;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors flex flex-col">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="h-1 bg-slate-200 dark:bg-slate-800">
          <div className="h-full bg-primary transition-all duration-150" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto w-full px-4 py-8 text-center flex-shrink-0">
        <Link
          href={ROUTES.NOVEL_DETAIL(comicId)}
          className="inline-block text-xl sm:text-2xl font-black text-slate-900 dark:text-white hover:text-primary transition-colors mb-2"
        >
          <h1 className="inline">{comic?.title || "Tên Truyện Đang Cập Nhật"}</h1>
        </Link>
        <div className="text-slate-500 dark:text-zinc-400 font-medium text-sm sm:text-base">
          {currentChapter?.chapter_number ? `Chương ${currentChapter.chapter_number}` : "Chương ?"}
          {currentChapter?.title && ` - ${currentChapter.title}`}
        </div>

        <AdRenderer position="header" />
      </div>

      <div
        ref={containerRef}
        className="w-full max-w-[800px] mx-auto bg-white dark:bg-black flex-1 flex flex-col items-center min-h-[60vh] transition-colors shadow-sm touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={() => setShowToolbar(!showToolbar)}
      >
        {totalPages === 0 ? (
          <div className="py-20 text-slate-400 dark:text-zinc-500 font-medium">
            Chương này chưa có nội dung.
          </div>
        ) : (
          <ChapterTextPage content={pageContent} pageNumber={pageIndex + 1} totalPages={totalPages} />
        )}
      </div>

      <div className="w-full max-w-[800px] mx-auto px-2 sm:px-4 py-4 flex items-center justify-between gap-3">
        <button
          onClick={goToPrevPage}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-primary hover:text-white transition-all"
        >
          <ChevronLeft size={18} /> Trang trước
        </button>
        <button
          onClick={goToNextPage}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm hover:bg-primary hover:text-white transition-all"
        >
          Trang sau <ChevronRight size={18} />
        </button>
      </div>

      <div className="w-full max-w-[800px] mx-auto px-2 sm:px-4 mt-2">
        <AdRenderer position="sidebar" />
      </div>

      <div className="w-full max-w-[800px] mx-auto px-2 sm:px-4 py-6 sm:py-8 flex items-center justify-between gap-3 sm:gap-4 border-t border-slate-200 dark:border-white/5 mt-4">
        <Link href={prevChapter ? ROUTES.CHAPTER_READER(comicId, prevChapter.id) : "#"} className={chapterNavClass(prevChapter)}>
          <ChevronLeft size={18} /> <span className="line-clamp-1">Chương trước</span>
        </Link>
        <Link href={nextChapter ? ROUTES.CHAPTER_READER(comicId, nextChapter.id) : "#"} className={chapterNavClass(nextChapter)}>
          <span className="line-clamp-1">Chương sau</span> <ChevronRight size={18} />
        </Link>
      </div>

      <div
        className={`fixed bottom-0 left-0 right-0 z-[60] pointer-events-none transition-transform duration-300 ease-in-out ${
          showToolbar ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800 px-3 py-2 sm:py-2.5 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.08)] dark:shadow-2xl transition-colors">
          <div className="max-w-[700px] mx-auto flex items-center justify-between gap-2">
            <Link
              href={ROUTES.HOME}
              className="p-2.5 sm:p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex-shrink-0"
              title="Trang chủ"
            >
              <Home size={18} />
            </Link>

            <button
              onClick={toggleTheme}
              className="p-2.5 sm:p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex-shrink-0"
              title={theme === "dark" ? "Sáng" : "Tối"}
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="flex-1 relative max-w-[280px] sm:max-w-[380px]">
              <button
                onClick={() => setShowChapterMenu(!showChapterMenu)}
                className="w-full flex items-center justify-between gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-extrabold rounded-xl px-3.5 py-2 transition-all text-xs sm:text-sm shadow-md shadow-blue-500/25 dark:shadow-blue-900/40 hover:scale-[1.02] active:scale-[0.98] border border-white/20"
              >
                <span className="truncate tracking-wide">
                  {currentChapter?.chapter_number ? `Chương ${currentChapter.chapter_number}` : currentChapter?.title || "Chọn chương"}
                </span>
                <List size={16} className="text-white/90 flex-shrink-0" />
              </button>

              {showChapterMenu && (
                <div className="absolute bottom-full mb-3 left-0 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl max-h-[50vh] overflow-y-auto z-[70] p-1.5 transition-colors">
                  {allChapters.map((chap) => (
                    <button
                      key={chap.id}
                      onClick={() => handleSelectChapter(chap.id)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs sm:text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 ${
                        chapterId === chap.id
                          ? "text-blue-600 dark:text-blue-400 font-black bg-blue-50 dark:bg-blue-950/40"
                          : "text-slate-700 dark:text-slate-200 font-semibold"
                      }`}
                    >
                      {chap.chapter_number ? `Chương ${chap.chapter_number}` : chap.title}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleDownload}
              disabled={downloading}
              className="p-2.5 sm:p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex-shrink-0 disabled:opacity-40"
              title={downloading ? "Đang lưu..." : "Lưu offline"}
            >
              <Download size={18} />
            </button>
          </div>
        </div>
      </div>

      <ChapterCommentsSection chapterId={chapterId} comicId={comicId} />

      {showChapterMenu && (
        <div
          className="fixed inset-0 z-[55] bg-slate-900/20 dark:bg-black/50 backdrop-blur-[1px]"
          onClick={() => setShowChapterMenu(false)}
        />
      )}
    </div>
  );
};
