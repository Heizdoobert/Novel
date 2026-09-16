import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Danh Sách Truyện - Đọc Truyện Chữ Online | Light Story',
  description:
    'Danh sách truyện chữ Manga, Manhua, Manhwa mới nhất và phổ biến nhất tại Light Story.',
};

export default function ComicsListLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}