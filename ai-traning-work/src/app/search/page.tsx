"use client";

import { Suspense, useState, useCallback, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAppStore } from "@/lib/store";
import Link from "next/link";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import SearchResultChart from "@/components/SearchResultChart";
import { SPL_TEMPLATES, getCategories, getCategoryLabel, getDifficultyLabel, type SPLTemplate } from "@/lib/spl/templates";
import { SPL_COMMANDS } from "@/lib/spl/help";
import { SearchBar } from "@/components/search/SearchBar";
import { TimeRangePicker } from "@/components/search/TimeRangePicker";
import { FieldSidebar } from "@/components/search/FieldSidebar";
import { EventRow } from "@/components/search/EventRow";
import { EventTimeline } from "@/components/search/EventTimeline";
import { PatternsTab } from "@/components/search/PatternsTab";
import { JobInspector } from "@/components/search/JobInspector";
import { SPLAutocomplete } from "@/components/search/SPLAutocomplete";

const PAGE_SIZE_OPTIONS = [25, 50, 100, 200];

function SearchPageContent() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);

  useEffect(() => {
    const q = searchParams.get("q");
    const t = searchParams.get("t");
    if (q) setQuery(decodeURIComponent(q));
    if (t) setTimeRange(t);
  }, [searchParams]);

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showJobInspector, setShowJobInspector] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveDescription, setSaveDescription] = useState("");
  const [activeTab, setActiveTab] = useState<"events" | "patterns" | "stats" | "visualization">("events");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [timeRange, setTimeRange] = useState("all");
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState<SPLTemplate["category"] | "all">("all");
  const [selectedHelpCategory, setSelectedHelpCategory] = useState<"search" | "stats" | "transform" | "join" | "utility" | "all">("all");
  const [showFieldSidebar, setShowFieldSidebar] = useState(true);

  const {
    isDataLoaded,
    logs,
    executeSearch,
    currentSearchResult,
    addSearchHistory,
    saveSearch,
    searchHistory,
    savedSearches,
    selectedFields,
    toggleSelectedField,
  } = useAppStore();

  // ロード済みデータからフィールド名を抽出（最大200件サンプリング）
  const availableFields = useMemo(() => {
    const sample = logs.slice(0, 200);
    const fieldSet = new Set<string>();
    for (const log of sample) {
      if (log.parsed) {
        for (const key of Object.keys(log.parsed)) {
          fieldSet.add(key);
        }
      }
    }
    const fromResult = currentSearchResult?.fields ?? [];
    for (const f of fromResult) fieldSet.add(f);
    return Array.from(fieldSet);
  }, [logs, currentSearchResult?.fields]);

  const handleExecute = useCallback(() => {
    if (!query.trim() || !isDataLoaded || isExecuting) return;

    setIsExecuting(true);
    setCurrentPage(1);
    setShowAutocomplete(false);

    setTimeout(() => {
      try {
        const result = executeSearch(query, { timeRange });
        addSearchHistory(query, result.count);
      } finally {
        setIsExecuting(false);
      }
    }, 50);
  }, [query, timeRange, isDataLoaded, isExecuting, executeSearch, addSearchHistory]);

  const paginatedData = useMemo(() => {
    if (!currentSearchResult?.data) return [];
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return currentSearchResult.data.slice(start, end);
  }, [currentSearchResult?.data, currentPage, pageSize]);

  const totalPages = useMemo(() => {
    if (!currentSearchResult?.data) return 0;
    return Math.ceil(currentSearchResult.data.length / pageSize);
  }, [currentSearchResult?.data, pageSize]);

  const exportToCSV = useCallback(() => {
    if (!currentSearchResult?.data || currentSearchResult.data.length === 0) return;
    const fields = currentSearchResult.fields;
    const csvHeader = fields.join(",");
    const csvRows = currentSearchResult.data.map(row =>
      fields.map(field => {
        const value = row[field];
        const str = value === null || value === undefined ? "" : String(value);
        if (str.includes(",") || str.includes("\n") || str.includes('"')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(",")
    );
    const csv = [csvHeader, ...csvRows].join("\n");
    downloadFile(csv, "search-results.csv", "text/csv");
  }, [currentSearchResult]);

  const exportToJSON = useCallback(() => {
    if (!currentSearchResult?.data || currentSearchResult.data.length === 0) return;
    const json = JSON.stringify(currentSearchResult.data, null, 2);
    downloadFile(json, "search-results.json", "application/json");
  }, [currentSearchResult]);

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

  const handleAutocompleteSelect = (value: string) => {
    const beforeCursor = query.slice(0, cursorPosition);
    const afterCursor = query.slice(cursorPosition);
    const wordMatch = beforeCursor.match(/[\w.]+$/);
    const wordStart = wordMatch ? cursorPosition - wordMatch[0].length : cursorPosition;
    const newQuery = query.slice(0, wordStart) + value + " " + afterCursor;
    setQuery(newQuery);
    setShowAutocomplete(false);
  };

  const handleAddFieldToSearch = (field: string, value: string) => {
    const addTerm = `${field}="${value}"`;
    setQuery((prev) => prev ? `${prev} ${addTerm}` : addTerm);
  };

  return (
    <div className="space-y-3">
      <LoadingOverlay isLoading={isExecuting} message="検索を実行中..." />

      {!isDataLoaded && (
        <div className="bg-[var(--accent-warning)]/10 border border-[var(--accent-warning)] rounded-lg p-4">
          <p className="text-[var(--text-primary)]">
            検索を実行するには、まずサンプルデータを読み込んでください。
          </p>
          <Link href="/data" className="inline-block mt-2 text-[var(--accent-info)] hover:underline">
            データ取り込みページへ →
          </Link>
        </div>
      )}

      {/* Search Bar Area */}
      <div className="space-y-2">
        {/* Top bar with time picker and actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TimeRangePicker value={timeRange} onChange={setTimeRange} />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTemplateModal(true)}
              className="px-3 py-1.5 text-sm bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
            >
              テンプレート
            </button>
            <button
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="px-3 py-1.5 text-sm bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors"
            >
              ヘルプ
            </button>
            <button
              type="button"
              onClick={() => setShowSaveModal(true)}
              disabled={!query.trim()}
              className="px-3 py-1.5 text-sm bg-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              保存
            </button>
          </div>
        </div>

        {/* Splunk-style search bar */}
        <div className="relative">
          <SearchBar
            query={query}
            onQueryChange={(q) => {
              setQuery(q);
              setShowAutocomplete(q.length > 0);
            }}
            onExecute={handleExecute}
            isExecuting={isExecuting}
            disabled={!isDataLoaded}
          />
          <SPLAutocomplete
            query={query}
            cursorPosition={cursorPosition}
            onSelect={handleAutocompleteSelect}
            visible={showAutocomplete && !isExecuting}
            onClose={() => setShowAutocomplete(false)}
            fields={availableFields}
          />
        </div>

        <div className="text-xs text-[var(--text-muted)]">
          Ctrl+Enter で検索実行 | Tab で補完候補選択
        </div>
      </div>

      {/* Results Area */}
      {currentSearchResult && (
        <div className="flex gap-0">
          {/* Field Sidebar */}
          {showFieldSidebar && currentSearchResult.success && currentSearchResult.data.length > 0 && (
            <FieldSidebar
              data={currentSearchResult.data}
              selectedFields={selectedFields}
              onToggleField={toggleSelectedField}
              onAddToSearch={handleAddFieldToSearch}
            />
          )}

          {/* Main Results */}
          <div className="flex-1 min-w-0">
            {/* Result Status Bar */}
            <div className="flex items-center justify-between bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-t px-4 py-2">
              <div className="flex items-center gap-4">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    currentSearchResult.success
                      ? "bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]"
                      : "bg-[var(--accent-danger)]/20 text-[var(--accent-danger)]"
                  }`}
                >
                  {currentSearchResult.success ? "完了" : "エラー"}
                </span>
                <span className="text-sm text-[var(--text-primary)] font-medium">
                  {currentSearchResult.count.toLocaleString()} 件
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  {currentSearchResult.executionTime.toFixed(2)} ms
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowFieldSidebar(!showFieldSidebar)}
                  className={`px-2 py-1 text-xs rounded ${showFieldSidebar ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)]"} hover:bg-[var(--bg-hover)]`}
                  title="フィールドサイドバー"
                >
                  |||
                </button>
                <button
                  type="button"
                  onClick={() => setShowJobInspector(!showJobInspector)}
                  className={`px-2 py-1 text-xs rounded ${showJobInspector ? "text-[var(--accent-primary)]" : "text-[var(--text-muted)]"} hover:bg-[var(--bg-hover)]`}
                  title="ジョブインスペクタ"
                >
                  info
                </button>
                {/* Tab buttons */}
                <div className="flex gap-1 ml-3">
                  {(["events", "patterns", "stats", "visualization"] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1 text-xs rounded transition-colors ${
                        activeTab === tab
                          ? "bg-[var(--accent-primary)] text-white"
                          : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                      }`}
                    >
                      {tab === "events" ? "イベント" : tab === "patterns" ? "パターン" : tab === "stats" ? "統計" : "可視化"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Error Display */}
            {currentSearchResult.error && (
              <div className="p-4 bg-[var(--accent-danger)]/10 text-[var(--accent-danger)] border-x border-[var(--border-color)]">
                <p className="font-medium text-sm">エラー</p>
                <p className="text-sm mt-1">{currentSearchResult.error.message}</p>
                {currentSearchResult.error.suggestion && (
                  <p className="text-sm mt-1 opacity-80">Hint: {currentSearchResult.error.suggestion}</p>
                )}
              </div>
            )}

            {/* Job Inspector */}
            {showJobInspector && (
              <div className="border-x border-[var(--border-color)]">
                <JobInspector result={currentSearchResult} query={query} timeRange={timeRange} />
              </div>
            )}

            {/* Event Timeline */}
            {currentSearchResult.success && currentSearchResult.data.length > 0 && activeTab === "events" && (
              <div className="border-x border-[var(--border-color)] p-2 bg-[var(--bg-primary)]">
                <EventTimeline data={currentSearchResult.data} />
              </div>
            )}

            {/* Events Tab */}
            {currentSearchResult.success && activeTab === "events" && currentSearchResult.data.length > 0 && (
              <div className="border border-[var(--border-color)] border-t-0 bg-[var(--bg-primary)]">
                {/* Table Controls */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                      表示:
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="px-2 py-0.5 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] text-xs"
                      >
                        {PAGE_SIZE_OPTIONS.map(size => (
                          <option key={size} value={size}>{size}件</option>
                        ))}
                      </select>
                    </label>
                    <span className="text-xs text-[var(--text-muted)]">
                      {((currentPage - 1) * pageSize + 1).toLocaleString()} - {Math.min(currentPage * pageSize, currentSearchResult.data.length).toLocaleString()} / {currentSearchResult.data.length.toLocaleString()} 件
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={exportToCSV} className="px-2 py-0.5 text-xs bg-[var(--bg-primary)] border border-[var(--border-color)] rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]">
                      CSV
                    </button>
                    <button type="button" onClick={exportToJSON} className="px-2 py-0.5 text-xs bg-[var(--bg-primary)] border border-[var(--border-color)] rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]">
                      JSON
                    </button>
                  </div>
                </div>

                {/* Event Rows */}
                <div>
                  {paginatedData.map((row, i) => (
                    <EventRow
                      key={i}
                      event={row}
                      fields={currentSearchResult.fields}
                      query={query}
                      index={(currentPage - 1) * pageSize + i}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 p-3 border-t border-[var(--border-color)]">
                    <button type="button" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-2 py-1 text-xs bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded hover:bg-[var(--bg-hover)] disabled:opacity-40 text-[var(--text-secondary)]">
                      最初
                    </button>
                    <button type="button" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-2 py-1 text-xs bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded hover:bg-[var(--bg-hover)] disabled:opacity-40 text-[var(--text-secondary)]">
                      前へ
                    </button>
                    <span className="px-3 py-1 text-xs text-[var(--text-primary)]">
                      {currentPage} / {totalPages}
                    </span>
                    <button type="button" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-2 py-1 text-xs bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded hover:bg-[var(--bg-hover)] disabled:opacity-40 text-[var(--text-secondary)]">
                      次へ
                    </button>
                    <button type="button" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="px-2 py-1 text-xs bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded hover:bg-[var(--bg-hover)] disabled:opacity-40 text-[var(--text-secondary)]">
                      最後
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Patterns Tab */}
            {currentSearchResult.success && activeTab === "patterns" && (
              <div className="border border-[var(--border-color)] border-t-0 bg-[var(--bg-primary)]">
                <PatternsTab
                  data={currentSearchResult.data}
                  onPatternClick={(sample) => setQuery(`search "${sample.slice(0, 50)}"`)}
                />
              </div>
            )}

            {/* Stats Tab */}
            {currentSearchResult.success && activeTab === "stats" && currentSearchResult.data.length > 0 && (
              <div className="border border-[var(--border-color)] border-t-0 bg-[var(--bg-primary)]">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--border-color)]">
                        {currentSearchResult.fields.slice(0, 10).map((field: string) => (
                          <th key={field} className="px-4 py-2 text-left font-medium text-[var(--text-secondary)] bg-[var(--bg-tertiary)] text-xs">
                            {field}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((row: Record<string, unknown>, i: number) => (
                        <tr key={i} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)]">
                          {currentSearchResult.fields.slice(0, 10).map((field: string) => (
                            <td key={field} className="px-4 py-2 text-[var(--text-primary)] text-xs max-w-[300px] truncate font-mono">
                              {formatValue(row[field])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Visualization Tab */}
            {currentSearchResult.success && activeTab === "visualization" && (
              <div className="border border-[var(--border-color)] border-t-0 bg-[var(--bg-primary)] p-4">
                <SearchResultChart result={currentSearchResult} />
              </div>
            )}

            {/* Empty State */}
            {currentSearchResult.success && currentSearchResult.data.length === 0 && (
              <div className="border border-[var(--border-color)] border-t-0 p-8 text-center text-[var(--text-muted)] bg-[var(--bg-primary)]">
                検索結果がありません
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Section: History & Saved Searches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Search History */}
        <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3 uppercase tracking-wider">
            検索履歴
          </h2>
          {searchHistory.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] py-4 text-center">検索履歴がありません</p>
          ) : (
            <div className="space-y-1 max-h-[250px] overflow-y-auto">
              {searchHistory.slice(0, 20).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => loadSavedSearch(item.query)}
                  className="w-full text-left p-2 rounded hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <p className="text-xs font-mono text-[var(--text-primary)] truncate">{item.query}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {item.resultCount} 件 | {new Date(item.executedAt).toLocaleString("ja-JP")}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Saved Searches */}
        <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-4">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3 uppercase tracking-wider">
            保存済み検索
          </h2>
          {savedSearches.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)] py-4 text-center">保存済み検索がありません</p>
          ) : (
            <div className="space-y-1 max-h-[250px] overflow-y-auto">
              {savedSearches.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => loadSavedSearch(item.query)}
                  className="w-full text-left p-2 rounded hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <p className="text-xs font-medium text-[var(--text-primary)]">{item.name}</p>
                  <p className="text-xs font-mono text-[var(--text-muted)] truncate mt-0.5">{item.query}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SPL Quick Reference */}
      <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-4">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3 uppercase tracking-wider">
          SPLクイックリファレンス
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
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
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">検索を保存</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">名前</label>
                <input type="text" value={saveName} onChange={(e) => setSaveName(e.target.value)} className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none" placeholder="検索名を入力" />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">説明（任意）</label>
                <input type="text" value={saveDescription} onChange={(e) => setSaveDescription(e.target.value)} className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none" placeholder="説明を入力" />
              </div>
              <div className="bg-[var(--bg-tertiary)] p-2 rounded">
                <p className="text-xs text-[var(--text-muted)]">クエリ:</p>
                <p className="text-sm font-mono text-[var(--text-primary)] mt-1 truncate">{query}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={() => setShowSaveModal(false)} className="px-4 py-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded">キャンセル</button>
              <button type="button" onClick={handleSave} disabled={!saveName.trim()} className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded disabled:opacity-50">保存</button>
            </div>
          </div>
        </div>
      )}

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-secondary)] rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">SPLテンプレート</h2>
              <button type="button" onClick={() => setShowTemplateModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl">x</button>
            </div>
            <div className="flex gap-2 mb-4 flex-wrap">
              <button type="button" onClick={() => setSelectedTemplateCategory("all")} className={`px-3 py-1 text-sm rounded ${selectedTemplateCategory === "all" ? "bg-[var(--accent-primary)] text-white" : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"}`}>
                すべて
              </button>
              {getCategories().map((cat) => (
                <button key={cat} type="button" onClick={() => setSelectedTemplateCategory(cat)} className={`px-3 py-1 text-sm rounded ${selectedTemplateCategory === cat ? "bg-[var(--accent-primary)] text-white" : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"}`}>
                  {getCategoryLabel(cat)}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {SPL_TEMPLATES.filter((t) => selectedTemplateCategory === "all" || t.category === selectedTemplateCategory).map((template) => (
                <div key={template.id} className="p-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded hover:border-[var(--accent-primary)] cursor-pointer transition-colors" onClick={() => { setQuery(template.query); setShowTemplateModal(false); }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-[var(--text-primary)] text-sm">{template.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${template.difficulty === "beginner" ? "bg-green-500/20 text-green-400" : template.difficulty === "intermediate" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>
                      {getDifficultyLabel(template.difficulty)}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mb-2">{template.description}</p>
                  <code className="block text-xs font-mono bg-[var(--bg-tertiary)] p-2 rounded text-[var(--text-muted)] overflow-x-auto">{template.query}</code>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-secondary)] rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">SPLコマンドヘルプ</h2>
              <button type="button" onClick={() => setShowHelpModal(false)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xl">x</button>
            </div>
            <div className="flex gap-2 mb-4 flex-wrap">
              {(["all", "search", "stats", "transform", "join", "utility"] as const).map((cat) => (
                <button key={cat} type="button" onClick={() => setSelectedHelpCategory(cat)} className={`px-3 py-1 text-sm rounded ${selectedHelpCategory === cat ? "bg-[var(--accent-primary)] text-white" : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"}`}>
                  {cat === "all" ? "すべて" : cat === "search" ? "検索" : cat === "stats" ? "統計" : cat === "transform" ? "変換" : cat === "join" ? "結合" : "ユーティリティ"}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {Object.values(SPL_COMMANDS).filter((cmd) => selectedHelpCategory === "all" || cmd.category === selectedHelpCategory).map((cmd) => (
                <div key={cmd.name} className="p-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded">
                  <div className="flex items-center justify-between mb-1">
                    <code className="font-bold text-[var(--accent-primary)]">{cmd.name}</code>
                    <span className="text-xs px-2 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]">{cmd.category}</span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] mb-2">{cmd.description}</p>
                  <div className="text-xs mb-2">
                    <span className="text-[var(--text-muted)]">構文: </span>
                    <code className="font-mono text-[var(--text-primary)]">{cmd.syntax}</code>
                  </div>
                  <div className="text-xs">
                    <span className="text-[var(--text-muted)]">例:</span>
                    <div className="mt-1 space-y-1">
                      {cmd.examples.slice(0, 3).map((ex, i) => (
                        <code key={i} className="block font-mono bg-[var(--bg-tertiary)] px-2 py-1 rounded text-[var(--text-primary)] cursor-pointer hover:bg-[var(--bg-hover)]" onClick={() => { setQuery(ex); setShowHelpModal(false); }}>
                          {ex}
                        </code>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[200px] text-[var(--text-muted)]">読み込み中...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (value instanceof Date) return value.toLocaleString("ja-JP");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
