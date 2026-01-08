"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";

export default function SettingsPage() {
  const [retentionDays, setRetentionDays] = useState(30);

  const {
    theme,
    setTheme,
    resultLimit,
    setResultLimit,
    logs,
    sources,
    dashboards,
    alerts,
    searchHistory,
    savedSearches,
    practiceProgress,
    clearData,
  } = useAppStore();

  const handleResetAll = () => {
    if (confirm("本当にすべてのデータを削除しますか？この操作は取り消せません。")) {
      clearData();
      window.location.reload();
    }
  };

  const handleResetProgress = () => {
    if (confirm("練習問題の進捗をリセットしますか？")) {
      // Reset practice progress by clearing localStorage for practice
      const state = JSON.parse(localStorage.getItem("splunk-training-store") || "{}");
      if (state.state) {
        state.state.practiceProgress = [];
        localStorage.setItem("splunk-training-store", JSON.stringify(state));
        window.location.reload();
      }
    }
  };

  const handleExportData = () => {
    const data = {
      exportDate: new Date().toISOString(),
      sources,
      logsCount: logs.length,
      dashboards,
      alerts,
      searchHistory,
      savedSearches,
      practiceProgress,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `splunk-training-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">設定</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          アプリケーションの設定を管理します
        </p>
      </div>

      {/* Stats */}
      <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          データ統計
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatItem label="ログ件数" value={logs.length.toLocaleString()} />
          <StatItem label="データソース" value={sources.length.toString()} />
          <StatItem label="ダッシュボード" value={dashboards.length.toString()} />
          <StatItem label="アラート" value={alerts.length.toString()} />
          <StatItem label="保存済み検索" value={savedSearches.length.toString()} />
          <StatItem label="検索履歴" value={searchHistory.length.toString()} />
          <StatItem
            label="練習問題完了"
            value={`${practiceProgress.filter((p) => p.status === "completed").length}/8`}
          />
        </div>
      </div>

      {/* Display Settings */}
      <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          表示設定
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2">
              テーマ
            </label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as "light" | "dark")}
              className="px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
            >
              <option value="dark">ダーク（Splunk風）</option>
              <option value="light">ライト</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2">
              検索結果の表示件数
            </label>
            <select
              value={resultLimit}
              onChange={(e) => setResultLimit(Number(e.target.value))}
              className="px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
            >
              <option value="100">100件</option>
              <option value="500">500件</option>
              <option value="1000">1,000件</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-[var(--text-secondary)] mb-2">
              データ保持期間（日）
            </label>
            <input
              type="number"
              value={retentionDays}
              onChange={(e) => setRetentionDays(Number(e.target.value))}
              min={1}
              max={365}
              className="w-32 px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">
              ※ この設定はトレーニング環境では使用されません
            </p>
          </div>
        </div>
      </div>

      {/* Export */}
      <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          データエクスポート
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          ダッシュボード、アラート、保存済み検索などの設定をJSONファイルとしてエクスポートします。
        </p>
        <button
          type="button"
          onClick={handleExportData}
          className="px-4 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded hover:bg-[var(--bg-hover)] transition-colors"
        >
          エクスポート
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--accent-danger)] p-6">
        <h2 className="text-lg font-semibold text-[var(--accent-danger)] mb-4">
          危険な操作
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[var(--text-primary)]">練習問題の進捗をリセット</p>
              <p className="text-sm text-[var(--text-muted)]">
                すべての練習問題を未完了状態に戻します
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetProgress}
              className="px-4 py-2 bg-transparent border border-[var(--accent-danger)] text-[var(--accent-danger)] rounded hover:bg-[var(--accent-danger)] hover:text-white transition-colors"
            >
              リセット
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[var(--text-primary)]">すべてのデータを削除</p>
              <p className="text-sm text-[var(--text-muted)]">
                ログ、ダッシュボード、アラート、設定をすべて初期化します
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetAll}
              className="px-4 py-2 bg-transparent border border-[var(--accent-danger)] text-[var(--accent-danger)] rounded hover:bg-[var(--accent-danger)] hover:text-white transition-colors"
            >
              初期化
            </button>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          このアプリについて
        </h2>
        <div className="text-sm text-[var(--text-secondary)] space-y-2">
          <p>Splunk Training Tool v1.0.0</p>
          <p>SPL (Search Processing Language) の学習用トレーニングツールです。</p>
          <p>サンプルデータを使用して、実際のSplunkに近い操作を体験できます。</p>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-[var(--bg-primary)] rounded">
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className="text-lg font-semibold text-[var(--text-primary)] mt-1">{value}</p>
    </div>
  );
}
