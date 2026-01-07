import type { Metadata } from "next";
import "./globals.css";
import { MainLayout } from "@/components/layout";

export const metadata: Metadata = {
  title: "Splunk Training Tool",
  description: "Splunkの操作を学習するための疑似トレーニング環境",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}
