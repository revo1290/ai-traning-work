"use client";

import { useState, useCallback, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import Link from "next/link";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveDescription, setSaveDescription] = useState("");
  const [activeTab, setActiveTab] = useState<"events" | "stats" | "visualization">("events");

  const {
    isDataLoaded,
    resultLimit,
    executeSearch,
    currentSearchResult,
    addSearchHistory,
    saveSearch,
    searchHistory,
    savedSearches,
  } = useAppStore();

  const handleExecute = useCallback(() => {
    if (!query.trim() || !isDataLoaded) return;

    setIsExecuting(true);
    try {
      const result = executeSearch(query);
      addSearchHistory(query, result.count);
    } finally {
      setIsExecuting(false);
    }
  }, [query, isDataLoaded, executeSearch, addSearchHistory]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleExecute();
    }
  };

  const handleSave = () => {
    if (saveName.trim() && query.trim()) {
      saveSearch(saveName.trim(), query, saveDescription.trim() || undefined);
      setShowSaveModal(false);
      setSaveName("");
      setSaveDescription("");
    }
  };

  const loadSavedSearch = (savedQuery: string) => {
    setQuery(savedQuery);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">検索</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          SPLクエリを使用してログを検索・分析します
        </p>
      </div>

      {!isDataLoaded && (
        <div className="bg-[var(--accent-warning)]/10 border border-[var(--accent-warning)] rounded-lg p-4">
          <p className="text-[var(--text-primary)]">
            検索を実行するには、まずサンプルデータを読み込んでください。
          </p>
          <Link
            href="/data"
            className="inline-block mt-2 text-[var(--accent-info)] hover:underline"
          >
            データ取り込みページへ →
          </Link>
        </div>
      )}

      {/* Search Input */}
      <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-4">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="SPLクエリを入力してください... (例: search error | stats count by host)"
          className="w-full h-24 px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none font-mono resize-none"
          disabled={!isDataLoaded}
        />
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-[var(--text-muted)]">
            Ctrl+Enter で検索実行 | 基本コマンド: search, where, stats, table, sort, head
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowSaveModal(true)}
              disabled={!query.trim()}
              className="px-4 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded font-medium hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              保存
            </button>
            <button
              type="button"
              onClick={handleExecute}
              disabled={!isDataLoaded || !query.trim() || isExecuting}
              className="px-6 py-2 bg-[var(--accent-primary)] text-[var(--bg-primary)] rounded font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExecuting ? "実行中..." : "検索実行"}
            </button>
          </div>
        </div>
      </div>

      {/* Results Area */}
      {currentSearchResult && (
        <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)]">
          {/* Result Header */}
          <div className="flex items-center justify-between border-b border-[var(--border-color)] p-4">
            <div className="flex items-center gap-4">
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  currentSearchResult.success
                    ? "bg-[var(--accent-secondary)]/20 text-[var(--accent-secondary)]"
                    : "bg-[var(--accent-danger)]/20 text-[var(--accent-danger)]"
                }`}
              >
                {currentSearchResult.success ? "成功" : "エラー"}
              </span>
              <span className="text-sm text-[var(--text-secondary)]">
                {currentSearchResult.count.toLocaleString()} 件
              </span>
              <span className="text-sm text-[var(--text-muted)]">
                {currentSearchResult.executionTime.toFixed(2)} ms
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("events")}
                className={`px-3 py-1 text-sm rounded ${
                  activeTab === "events"
                    ? "bg-[var(--accent-primary)] text-[var(--bg-primary)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                }`}
              >
                イベント
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("stats")}
                className={`px-3 py-1 text-sm rounded ${
                  activeTab === "stats"
                    ? "bg-[var(--accent-primary)] text-[var(--bg-primary)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                }`}
              >
                統計
              </button>
            </div>
          </div>

          {/* Error Display */}
          {currentSearchResult.error && (
            <div className="p-4 bg-[var(--accent-danger)]/10 text-[var(--accent-danger)]">
              <p className="font-medium">エラー</p>
              <p className="text-sm mt-1">{currentSearchResult.error}</p>
            </div>
          )}

          {/* Results Table */}
          {currentSearchResult.success && currentSearchResult.data.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    {currentSearchResult.fields.slice(0, 10).map((field) => (
                      <th
                        key={field}
                        className="px-4 py-3 text-left font-medium text-[var(--text-secondary)] bg-[var(--bg-tertiary)]"
                      >
                        {field}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentSearchResult.data.slice(0, resultLimit).map((row, i) => (
                    <tr
                      key={i}
                      className="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)]"
                    >
                      {currentSearchResult.fields.slice(0, 10).map((field) => (
                        <td
                          key={field}
                          className="px-4 py-3 text-[var(--text-primary)] max-w-[300px] truncate"
                        >
                          {formatValue(row[field])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {currentSearchResult.data.length > resultLimit && (
                <div className="p-4 text-center text-sm text-[var(--text-muted)]">
                  表示: {resultLimit} / {currentSearchResult.data.length} 件
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {currentSearchResult.success && currentSearchResult.data.length === 0 && (
            <div className="p-8 text-center text-[var(--text-muted)]">
              検索結果がありません
            </div>
          )}
        </div>
      )}

      {/* Sidebar Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Search History */}
        <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            検索履歴
          </h2>
          {searchHistory.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] py-4 text-center">
              検索履歴がありません
            </p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {searchHistory.slice(0, 20).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => loadSavedSearch(item.query)}
                  className="w-full text-left p-2 rounded hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <p className="text-sm font-mono text-[var(--text-primary)] truncate">
                    {item.query}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {item.resultCount} 件 •{" "}
                    {new Date(item.executedAt).toLocaleString("ja-JP")}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Saved Searches */}
        <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            保存済み検索
          </h2>
          {savedSearches.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] py-4 text-center">
              保存済み検索がありません
            </p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {savedSearches.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => loadSavedSearch(item.query)}
                  className="w-full text-left p-2 rounded hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {item.name}
                  </p>
                  <p className="text-xs font-mono text-[var(--text-muted)] truncate mt-1">
                    {item.query}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SPL Quick Reference */}
      <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          SPLクイックリファレンス
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <h3 className="font-medium text-[var(--text-primary)] mb-2">検索</h3>
            <ul className="space-y-1 text-[var(--text-secondary)]">
              <li><code className="bg-[var(--bg-tertiary)] px-1 rounded">error</code> - キーワード検索</li>
              <li><code className="bg-[var(--bg-tertiary)] px-1 rounded">status=404</code> - フィールド検索</li>
              <li><code className="bg-[var(--bg-tertiary)] px-1 rounded">host=web*</code> - ワイルドカード</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-[var(--text-primary)] mb-2">フィルタ</h3>
            <ul className="space-y-1 text-[var(--text-secondary)]">
              <li><code className="bg-[var(--bg-tertiary)] px-1 rounded">| where status &gt; 400</code></li>
              <li><code className="bg-[var(--bg-tertiary)] px-1 rounded">| head 10</code></li>
              <li><code className="bg-[var(--bg-tertiary)] px-1 rounded">| dedup user</code></li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-[var(--text-primary)] mb-2">集計</h3>
            <ul className="space-y-1 text-[var(--text-secondary)]">
              <li><code className="bg-[var(--bg-tertiary)] px-1 rounded">| stats count by host</code></li>
              <li><code className="bg-[var(--bg-tertiary)] px-1 rounded">| top 5 status</code></li>
              <li><code className="bg-[var(--bg-tertiary)] px-1 rounded">| timechart count</code></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-secondary)] rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              検索を保存
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">
                  名前
                </label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                  placeholder="検索名を入力"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">
                  説明（任意）
                </label>
                <input
                  type="text"
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                  placeholder="説明を入力"
                />
              </div>
              <div className="bg-[var(--bg-tertiary)] p-2 rounded">
                <p className="text-xs text-[var(--text-muted)]">クエリ:</p>
                <p className="text-sm font-mono text-[var(--text-primary)] mt-1 truncate">
                  {query}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!saveName.trim()}
                className="px-4 py-2 bg-[var(--accent-primary)] text-[var(--bg-primary)] rounded disabled:opacity-50"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (value instanceof Date) return value.toLocaleString("ja-JP");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
