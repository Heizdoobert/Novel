"use client";

import { useSearchParams } from "next/navigation";
import { Layers, Plus, Edit, Trash2, Search, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminChapters } from "@/hooks/features/use-admin-chapters";
import { Modal } from "@/components/ui/modal";

export default function AdminChaptersPage() {
  const searchParams = useSearchParams();
  const initialComicId = searchParams.get("comicId") || "all";

  const {
    chapters,
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
    uploading,
    handleContentFileSelected,
    submitting,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleSaveChapter,
    handleDeleteChapter,
  } = useAdminChapters(initialComicId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="text-orange-500" size={28} />
            Quản Lý Các Chương Truyện
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Quản lý, tạo chương mới và tải ảnh trang đọc trực tiếp lên Cloudflare R2
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleOpenCreateModal} className="gap-2 bg-orange-500 hover:bg-orange-600 font-bold shrink-0">
            <Plus size={18} /> Thêm Chương Mới
          </Button>
        </div>
      </div>

      {/* Comic Selector & Search Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-100 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <BookOpen size={16} className="text-orange-500" />
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Chọn Truyện:</span>
          <label className="sr-only" htmlFor="chapter-comic-select">Chọn bộ truyện</label>
          <select
            id="chapter-comic-select"
            value={selectedComicId}
            onChange={(e) => setSelectedComicId(e.target.value)}
            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-orange-500 cursor-pointer max-w-xs"
          >
            <option value="all">Tất cả bộ truyện ({comics.length})</option>
            {comics.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        <div className="relative flex-1 w-full">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm số chương, tên chương..."
            aria-label="Tìm kiếm chương"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      {/* Chapters Table */}
      <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4">Số Chương</th>
                <th className="p-4">Tên Chương</th>
                <th className="p-4">Tệp Nội Dung</th>
                <th className="p-4">Ngày Tạo</th>
                <th className="p-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {chapters.length > 0 ? (
                chapters.map((ch) => (
                  <tr key={ch.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-bold text-orange-400">Chapter {ch.chapter_number}</td>
                    <td className="p-4 font-semibold text-slate-900 dark:text-white">{ch.title || `Chương ${ch.chapter_number}`}</td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-800 text-cyan-400 font-mono font-bold">
                        {ch.content_url ? "Đã có" : "Chưa có"}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">
                      {ch.created_at ? new Date(ch.created_at).toLocaleDateString("vi-VN") : "-"}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEditModal(ch)}
                          title="Sửa chương"
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDeleteChapter(ch.id, ch.chapter_number, ch.story_id)}
                          title="Xóa chương"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 dark:text-slate-400">
                    {loading ? "Đang tải danh sách chương..." : "Chưa có chương nào cho bộ truyện này."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Chapter Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        variant="dark"
        className="max-w-xl"
        title={editingChapter ? "Chỉnh Sửa Chương" : "Thêm Chương Mới"}
      >
        <form onSubmit={handleSaveChapter} className="space-y-4">
              <div>
                <label htmlFor="chapter-comic" className="block text-xs font-semibold text-slate-300 mb-1">Chọn Bộ Truyện *</label>
                <select
                  id="chapter-comic"
                  disabled={!!editingChapter}
                  value={targetComicId}
                  onChange={(e) => setTargetComicId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                >
                  {comics.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="chapter-number" className="block text-xs font-semibold text-slate-300 mb-1">Số Chương *</label>
                  <input
                    id="chapter-number"
                    type="number"
                    required
                    min={1}
                    value={chapterNumber}
                    onChange={(e) => setChapterNumber(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label htmlFor="chapter-title" className="block text-xs font-semibold text-slate-300 mb-1">Tên Chương</label>
                  <input
                    id="chapter-title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ví dụ: Chương mở đầu..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="chapter-content-file" className="block text-xs font-semibold text-slate-300 mb-1">
                  Tệp Nội Dung Chương (.txt/.md)
                </label>
                <input
                  id="chapter-content-file"
                  type="file"
                  accept=".txt,.md,text/plain,text/markdown"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleContentFileSelected(file);
                  }}
                  className="w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-orange-500 file:text-white file:font-bold file:cursor-pointer"
                />
                {uploading && <p className="text-[11px] text-orange-400 mt-1">Đang tải lên...</p>}
                {contentUrl && !uploading && <p className="text-[11px] text-emerald-400 mt-1">Đã tải lên: {contentUrl}</p>}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={submitting} className="bg-orange-500 hover:bg-orange-600">
                  {submitting ? "Đang lưu..." : "Lưu Chương"}
                </Button>
              </div>
            </form>
      </Modal>
    </div>
  );
}
