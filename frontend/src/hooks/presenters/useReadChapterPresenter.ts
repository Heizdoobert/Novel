"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ROUTES } from "@/lib/constants/routes";
import { apiClient } from "@/lib/api/apiClient";
import { ComicContext as Comic } from "@/services/comics/comic.service";
import { Chapter } from "@/types/entities";
import { toast } from "sonner";
import { useTheme } from "@/context/ThemeContext";
import { saveReadingProgress } from "@/actions/reading-history.actions";
import { proxiedR2ImageUrl } from "@/services/comics/comicCms.service";
import { decryptFieldClient } from "@/lib/security/encryption";
import { getChapterContentUrl } from "@/lib/r2/chapter-content";
import { usePaginatedChapterText } from "@/hooks/features/use-paginated-chapter-text";

import { fetchStoryById } from "@/services/comics/story.service";
import { fetchChaptersByStoryId } from "@/services/comics/chapter.service";
import { supabase } from "@/lib/supabase/client";

export interface ReaderChapterListItem {
  id: string;
  chapter_number?: number;
  title?: string;
  created_at?: string;
}

export interface ReaderInitialData {
  comic: Comic | null;
  allChapters: ReaderChapterListItem[];
  currentChapter: Chapter | null;
}

async function resolveChapterContent(currentData: Chapter | null): Promise<string> {
  if (!currentData?.content) return "";
  const rawContent =
    typeof currentData.content === "string" && currentData.content.startsWith("ENCv1:")
      ? await decryptFieldClient(currentData.content)
      : currentData.content;
  const contentUrl = getChapterContentUrl(rawContent);
  if (!contentUrl) return "";
  const res = await fetch(proxiedR2ImageUrl(contentUrl));
  if (!res.ok) throw new Error(`Failed to fetch chapter text (${res.status})`);
  return res.text();
}

export function useReadChapterPresenter(initialData?: ReaderInitialData | null) {
  const params = useParams();
  const router = useRouter();

  const comicId = params.comicId as string;
  const chapterId = params.chapterId as string;

  const [comic, setComic] = useState<Comic | null>(initialData?.comic ?? null);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(initialData?.currentChapter ?? null);
  const [allChapters, setAllChapters] = useState<ReaderChapterListItem[]>(initialData?.allChapters ?? []);
  const [chapterText, setChapterText] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const [reseededChapterId, setReseededChapterId] = useState<string | null>(
    initialData?.currentChapter?.id ?? null,
  );

  const [showToolbar, setShowToolbar] = useState(true);
  const [showChapterMenu, setShowChapterMenu] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const { containerRef, pages, pageIndex, setPageIndex, nextPage, prevPage } =
    usePaginatedChapterText(chapterText, 18);

  const restoreDoneRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const foundIdx = allChapters.findIndex((c) => c.id === chapterId);
  const currentIndex = foundIdx >= 0 ? foundIdx : 0;
  const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null;

  const loadChapterText = useCallback(async (chapter: Chapter | null) => {
    try {
      setChapterText(await resolveChapterContent(chapter));
    } catch (err) {
      console.error("[ReadChapterPage] Failed to load chapter text", err);
      toast.error("Không thể tải nội dung chương truyện.");
    }
  }, []);

  // Render-phase reseed: RSC navigation delivers new initialData; sync state
  // during render (React derived-state pattern) so no spinner ever paints.
  if (initialData && initialData.currentChapter?.id !== reseededChapterId) {
    setReseededChapterId(initialData.currentChapter?.id ?? null);
    setComic(initialData.comic);
    setCurrentChapter(initialData.currentChapter);
    setAllChapters(initialData.allChapters);
    setLoading(false);
    restoreDoneRef.current = false;
    void loadChapterText(initialData.currentChapter);
  }

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;
      const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
      const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
      touchStartRef.current = null;
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      const target = dx > 0 ? prevChapter : nextChapter;
      if (target) router.push(ROUTES.CHAPTER_READER(comicId, target.id));
    },
    [comicId, prevChapter, nextChapter, router],
  );

  useEffect(() => {
    // RSC is the source of truth when initialData is present; fetch only when
    // the server failed entirely (no initialData) to preserve client recovery.
    if (initialData) return;

    setLoading(true);
    const fetchReadingData = async () => {
      try {
        const [comicData, chaptersData] = await Promise.all([
          fetchStoryById(comicId).catch(() => null),
          fetchChaptersByStoryId(comicId).catch(() => []),
        ]);
        if (comicData) setComic(comicData as any);

        const sortedChapters = (chaptersData || []).sort((a, b) => {
          if (a.chapter_number && b.chapter_number) return a.chapter_number - b.chapter_number;
          return new Date(a.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        });
        setAllChapters(sortedChapters);

        let currentData: Chapter | null = null;
        try {
          const currentRes = await apiClient
            .get<any>(`/api/novels/${comicId}/chapters/${chapterId}`)
            .catch(() => null);
          if (currentRes) {
            currentData = Array.isArray(currentRes) ? currentRes[0] : currentRes?.chapter || currentRes;
          }
        } catch {}

        if (!currentData) {
          currentData = sortedChapters.find((ch) => ch.id === chapterId) || null;
        }

        if (!currentData && supabase) {
          try {
            const { data } = await supabase.from("chapters").select("*").eq("id", chapterId).maybeSingle();
            if (data) currentData = data as Chapter;
          } catch {}
        }

        setCurrentChapter(currentData);
        await loadChapterText(currentData);
      } catch {
        toast.error("Không thể tải nội dung chương truyện.");
      } finally {
        setLoading(false);
      }
    };

    if (comicId && chapterId) fetchReadingData();
  }, [comicId, chapterId, initialData, loadChapterText]);

  // Reading progress must persist on both the SSR-seeded and client-fetch paths.
  useEffect(() => {
    if (currentChapter && comicId && chapterId) {
      saveReadingProgress({
        comicId,
        chapterId,
        chapterNumber: currentChapter.chapter_number || 1,
      });
    }
  }, [comicId, chapterId, currentChapter?.id]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`reader:page:${chapterId}`);
      if (saved && !restoreDoneRef.current && pages.length > 0) {
        restoreDoneRef.current = true;
        const idx = parseInt(saved, 10);
        if (!isNaN(idx)) setPageIndex(idx);
      }
    } catch {}
  }, [chapterId, pages.length, setPageIndex]);

  useEffect(() => {
    try {
      localStorage.setItem(`reader:page:${chapterId}`, String(pageIndex));
    } catch {}
  }, [chapterId, pageIndex]);

  const handleSelectChapter = (selectedId: string) => {
    setShowChapterMenu(false);
    if (selectedId) router.push(ROUTES.CHAPTER_READER(comicId, selectedId));
  };

  const goToNextPage = useCallback(() => {
    if (pageIndex < pages.length - 1) {
      nextPage();
    } else if (nextChapter) {
      router.push(ROUTES.CHAPTER_READER(comicId, nextChapter.id));
    }
  }, [pageIndex, pages.length, nextPage, nextChapter, comicId, router]);

  const goToPrevPage = useCallback(() => {
    if (pageIndex > 0) {
      prevPage();
    } else if (prevChapter) {
      router.push(ROUTES.CHAPTER_READER(comicId, prevChapter.id));
    }
  }, [pageIndex, prevPage, prevChapter, comicId, router]);

  const handleDownload = async () => {
    const contentUrl = currentChapter?.content ? getChapterContentUrl(currentChapter.content) : null;
    if (downloading || !contentUrl) return;
    setDownloading(true);
    try {
      const cache = await caches.open("reader-pages");
      const res = await fetch(proxiedR2ImageUrl(contentUrl), { cache: "force-cache" });
      if (res.ok) {
        await cache.put(proxiedR2ImageUrl(contentUrl), res.clone());
        toast.success("Đã lưu offline.");
      } else {
        toast.error("Lỗi lưu offline.");
      }
    } catch {
      toast.error("Lỗi lưu offline.");
    } finally {
      setDownloading(false);
    }
  };

  return {
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
    theme,
    toggleTheme,
    handleTouchStart,
    handleTouchEnd,
    handleSelectChapter,
    handleDownload,
    containerRef,
    pageContent: pages[pageIndex] ?? "",
    pageIndex,
    totalPages: pages.length,
    progress: pages.length > 0 ? ((pageIndex + 1) / pages.length) * 100 : 0,
    goToNextPage,
    goToPrevPage,
    prevChapter,
    nextChapter,
  };
}
