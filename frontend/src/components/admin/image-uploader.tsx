"use client";

import React, { useRef, useState } from "react";
import { Upload, X, CheckCircle2 } from "lucide-react";
import { uploadToR2 } from "@/lib/r2/upload";
import { resizeImageFile } from "@/lib/r2/resize";
import { getR2ImageUrl } from "@/lib/utils/image-url";
import { toast } from "sonner";

export interface ImageUploaderProps {
  onImagesUploaded?: (urls: string[]) => void;
  folder?: string;
}

export function ImageUploader({ onImagesUploaded, folder = "chapters" }: ImageUploaderProps) {
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (files: FileList | File[]) => {
    if (isUploading) return;
    const list = Array.from(files);
    if (list.length === 0) return;

    setIsUploading(true);
    setProgressMsg("");
    const uploadedUrls: string[] = [];

    let idx = 0;
    for (const file of list) {
      idx += 1;
      setProgressMsg(`Đang tải lên ảnh ${idx}/${list.length}...`);
      const resized = await resizeImageFile(file);
      const res = await uploadToR2(resized.file, folder);
      if (res.success && res.url) {
        uploadedUrls.push(res.url);
      } else {
        toast.error(`Tải lên ảnh ${file.name} thất bại`);
      }
    }

    setIsUploading(false);
    setProgressMsg("");
    if (inputRef.current) inputRef.current.value = "";
    if (uploadedUrls.length > 0) {
      setPreviews((prev) => [...prev, ...uploadedUrls]);
      onImagesUploaded?.(uploadedUrls);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    void processFiles(e.target.files ?? []);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    void processFiles(e.dataTransfer.files);
  };

  const removePreview = (index: number) => {
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer group ${
          isDragging
            ? "border-orange-500 bg-orange-500/10"
            : "border-slate-300 dark:border-slate-700 hover:border-orange-500 dark:hover:border-orange-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"
        }`}
      >
        <Upload size={32} className="text-slate-400 group-hover:text-orange-500 transition-colors mb-2" />
        <span className="text-sm font-bold text-slate-700 dark:text-slate-200 text-center">
          Kéo thả hoặc chọn ảnh
        </span>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>

      {isUploading && (
        <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl flex items-center gap-3 text-xs font-semibold text-orange-500 animate-pulse">
          <span>{progressMsg || "Đang tải lên..."}</span>
        </div>
      )}

      {previews.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
            <span className="flex items-center gap-1.5 text-emerald-500">
              <CheckCircle2 size={14} /> Đã tải lên {previews.length} ảnh
            </span>
            <button type="button" onClick={() => setPreviews([])} className="text-rose-500 hover:underline">
              Xóa tất cả
            </button>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 max-h-80 overflow-y-auto p-2 bg-slate-950/40 rounded-xl border border-slate-800">
            {previews.map((src, i) => (
              <div key={i} className="relative aspect-[3/4] rounded-xl overflow-hidden border border-slate-700 bg-slate-900 group">
                <img src={getR2ImageUrl(src)} alt={`Ảnh ${i + 1}`} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePreview(i)}
                  className="absolute top-1 right-1 p-1 bg-black/80 text-white rounded-full hover:bg-red-600 transition-colors"
                  title="Xóa ảnh này"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageUploader;
