import type { Metadata } from "next";
import { SearchPageContent } from '@/components/novels/SearchPageContent';

export const metadata: Metadata = {
  title: "Truyện chữ - Light Story",
  description:
    "Khám phá bộ sưu tập truyện chữ đa dạng tại Light Story — cập nhật nhanh, đọc mượt mà trên mọi thiết bị.",
};

export default function ComicsListPage() {
  return <SearchPageContent />;
}
