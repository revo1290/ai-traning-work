"use client";

import { useEffect } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { useAppStore } from "@/lib/store";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { theme, sidebarCollapsed, isDataLoaded, loadSampleData } = useAppStore();

  // テーマ設定
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // 初回起動時にサンプルデータを自動読み込み
  useEffect(() => {
    if (!isDataLoaded) {
      console.log("初回起動: サンプルデータ（8種類×1000件）を読み込み中...");
      loadSampleData();
      console.log("サンプルデータの読み込みが完了しました");
    }
  }, [isDataLoaded, loadSampleData]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar collapsed={sidebarCollapsed} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6 bg-[var(--bg-primary)]">
          {children}
        </main>
      </div>
    </div>
  );
}
