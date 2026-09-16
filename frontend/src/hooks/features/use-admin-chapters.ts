"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { createChapter, updateChapter, deleteChapter } from "@/lib/actions/chapter.actions";
import { uploadToR2 } from "@/lib/r2/upload";
import { toast } from "sonner";

export interface ChapterItem {
  id: string;
  story_id: string;
  chapter_number: number;
  title: string;
  created_at: string;
  content_url?: string;
}

export interface ComicSimple {
  id: string;
  title: string;
}

async function fetchMaxChapterNumber(storyId: string): Promise<number | null> {
  const supabase = getSupabaseBrowserClient();
  for (let attempt = 0; attempt < 2; attempt++) {
    const { data } = await supabase
      .from("chapters")
      .select("chapter_number")
      .eq("story_id", storyId)
      .order("chapter_number", { ascending: false })
      .limit(1);
    if (data) return data[0]?.chapter_number ?? 0;
  }
  return null;
}

export function useAdminChapters(initialComicId: string = "all") {
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [comics, setComics] = useState<ComicSimple[]>([]);
  const [selectedComicId, setSelectedComicId] = useState<string>(initialComicId);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<ChapterItem | null>(null);

  const [targetComicId, setTargetComicId] = useState("");
  const [chapterNumber, setChapterNumber] = useState(1);
  const [title, setTitle] = useState("");
  const [contentUrl, setContentUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleContentFileSelected = async (file: File) => {
    setUploading(true);
    try {
      const res = await uploadToR2(file, "chapters");
      if (res.success && res.url) {
        setContentUrl(res.url);
      } else {
        toast.error(res.error || "Tải lên tệp nội dung thất bại");
      }
    } finally {
      setUploading(false);
    }
  };

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();

      const { data: comicsData } = await supabase.from("stories").select("id, title").order("title").limit(500);
      if (comicsData) {
        setComics(comicsData);
        if (!targetComicId && comicsData.length > 0) setTargetComicId(comicsData[0].id);
      }

      let query = supabase
        .from("chapters")
        .select("id, story_id, chapter_number, title, created_at, content")
        .order("chapter_number", { ascending: true });
      // ponytail: no pagination, PostgREST caps ~1000 rows; add real paging when a story exceeds that

      if (selectedComicId !== "all") query = query.eq("story_id", selectedComicId);

      const { data: chaptersData } = await query;
      if (chaptersData) {
        setChapters(
          chaptersData.map((row) => ({
            ...row,
            content_url: (row as { content?: string | null }).content ?? "",
          })) as ChapterItem[],
        );
      }
    } catch (err) {
      console.error("Failed to load admin chapters:", err);
      toast.error("Không thể tải danh sách chương");
    } finally {
      setLoading(false);
    }
  }, [selectedComicId, targetComicId]);

  useEffect(() => {
    loadInitialData();
  }, [selectedComicId, loadInitialData]);

  const handleOpenCreateModal = async () => {
    setEditingChapter(null);
    setTitle("");
    setContentUrl("");
    const targetId = selectedComicId !== "all" ? selectedComicId : comics[0]?.id ?? "";
    setTargetComicId(targetId);
    const max = targetId ? await fetchMaxChapterNumber(targetId) : null;
    if (max === null) {
      toast.error("Không thể xác định số chương kế tiếp. Hãy nhập số chương thủ công.");
    }
    setChapterNumber((max ?? 0) + 1);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (chapter: ChapterItem) => {
    setEditingChapter(chapter);
    setTargetComicId(chapter.story_id);
    setChapterNumber(chapter.chapter_number);
    setTitle(chapter.title || "");
    setContentUrl(chapter.content_url || "");
    setIsModalOpen(true);
  };

  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetComicId) {
      toast.error("Vui lòng chọn truyện");
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    try {
      const payload = { chapter_number: Number(chapterNumber), title, content_url: contentUrl };
      const res = editingChapter
        ? await updateChapter(editingChapter.id, targetComicId, payload)
        : await createChapter({ story_id: targetComicId, ...payload });
      if (res.success === false) {
        toast.error(res.error);
        return;
      }
      toast.success("Lưu chương thành công");
      await loadInitialData();
      setEditingChapter(null);
      setIsModalOpen(false);
    } catch (err) {
      toast.error((err as Error).message || "Không thể lưu chương");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteChapter = async (id: string, chNum: number, storyId: string) => {
    if (!window.confirm(`Xóa chương #${chNum}?`)) return;
    try {
      const res = await deleteChapter(id, storyId);
      if (res.success === false) {
        toast.error(res.error);
        return;
      }
      toast.success("Đã xóa chương");
      await loadInitialData();
    } catch (err) {
      toast.error((err as Error).message || "Không thể xóa chương");
    }
  };

  const filteredChapters = chapters.filter((ch) => {
    return ch.title.toLowerCase().includes(search.toLowerCase()) || String(ch.chapter_number).includes(search);
  });

  return {
    chapters: filteredChapters,
    comics,
    selectedComicId,
    setSelectedComicId,
    loading,
    search,
    setSearch,
    isModalOpen,
    setIsModalOpen,
    editingChapter,
    targetComicId,
    setTargetComicId,
    chapterNumber,
    setChapterNumber,
    title,
    setTitle,
    contentUrl,
    setContentUrl,
    uploading,
    handleContentFileSelected,
    submitting,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleSaveChapter,
    handleDeleteChapter,
    refresh: loadInitialData,
  };
}
