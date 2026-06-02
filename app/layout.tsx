import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WeatherCast Studio · AI 날씨송 스튜디오",
  description: "케이웨더 데이터 기반 AI 날씨송·영상·썸네일 반자동 생성 대시보드",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
