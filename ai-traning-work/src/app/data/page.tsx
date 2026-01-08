"use client";

import { useState, useCallback, useRef } from "react";
import { useAppStore } from "@/lib/store";
import { LoadingOverlay } from "@/components/LoadingOverlay";

const sampleDataTypes = [
  {
    id: "web",
    name: "Webサーバーログ",
    description: "Apache/Nginx形式のアクセスログ（約2,000件）",
  },
  {
    id: "app",
    name: "ECサイトログ",
    description: "JSON形式のアプリケーションログ（約1,000件）",
  },
  {
    id: "security",
    name: "セキュリティログ",
    description: "syslog形式のセキュリティイベント（約600件）",
  },
  {
    id: "gc",
    name: "JVM GCログ",
    description: "G1GC/ParallelGC形式のGCログ（約400件）",
  },
  {
    id: "k8s",
    name: "Kubernetesログ",
    description: "コンテナログ形式（約600件）",
  },
  {
    id: "db",
    name: "データベースログ",
    description: "MySQL slow query形式（約400件）",
  },
];

export default function DataPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("読み込み中...");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { sources, logs, isDataLoaded, loadSampleData, loadCustomData, clearData } = useAppStore();

  const parseCSV = useCallback((text: string): Record<string, unknown>[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
    const data: Record<string, unknown>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
      const row: Record<string, unknown> = {};
      headers.forEach((header, index) => {
        let value: string | number = values[index]?.replace(/^"|"$/g, "") || "";
        // Try to parse as number
        const num = Number(value);
        if (!isNaN(num) && value !== "") {
          row[header] = num;
        } else {
          row[header] = value;
        }
      });
      if (Object.keys(row).length > 0) {
        data.push(row);
      }
    }
    return data;
  }, []);

  const parseJSON = useCallback((text: string): Record<string, unknown>[] => {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    // If it's a single object, wrap in array
    return [parsed];
  }, []);

  const parseLogLines = useCallback((text: string): Record<string, unknown>[] => {
    const lines = text.trim().split("\n").filter(line => line.trim());
    return lines.map((line, index) => ({
      _raw: line,
      _time: new Date().toISOString(),
      lineNumber: index + 1,
    }));
  }, []);

  const processFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setUploadError(null);
    setLoadingMessage(`${file.name} を読み込み中...`);

    try {
      const text = await file.text();
      let data: Record<string, unknown>[] = [];
      let format = "text";

      if (file.name.endsWith(".json")) {
        data = parseJSON(text);
        format = "JSON";
      } else if (file.name.endsWith(".csv")) {
        data = parseCSV(text);
        format = "CSV";
      } else {
        data = parseLogLines(text);
        format = "Log";
      }

      if (data.length === 0) {
        throw new Error("ファイルにデータがありません");
      }

      // Use setTimeout to allow UI to update
      setTimeout(() => {
        loadCustomData(file.name, data, format);
        setIsLoading(false);
      }, 100);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "ファイルの読み込みに失敗しました");
      setIsLoading(false);
    }
  }, [parseJSON, parseCSV, parseLogLines, loadCustomData]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [processFile]);

  const handleLoadSampleData = async () => {
    setIsLoading(true);
    setLoadingMessage("サンプルデータを読み込み中...");
    // 少し遅延を入れてUIの反応性を示す
    await new Promise((resolve) => setTimeout(resolve, 500));
    loadSampleData();
    setIsLoading(false);
  };

  const handleClearData = () => {
    if (confirm("すべてのデータを削除しますか？")) {
      clearData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Loading Overlay */}
      <LoadingOverlay isLoading={isLoading} message={loadingMessage} />

      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          データ取り込み
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">
          ログファイルをアップロードするか、サンプルデータを読み込みます
        </p>
      </div>

      {/* Error Display */}
      {uploadError && (
        <div className="bg-[var(--accent-danger)]/10 border border-[var(--accent-danger)] rounded-lg p-4 flex items-center justify-between">
          <p className="text-[var(--accent-danger)]">{uploadError}</p>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-[var(--accent-danger)] hover:opacity-70"
          >
            ×
          </button>
        </div>
      )}

      {/* Status Banner */}
      {isDataLoaded && (
        <div className="bg-[var(--accent-secondary)]/10 border border-[var(--accent-secondary)] rounded-lg p-4 flex items-center justify-between">
          <div>
            <p className="text-[var(--text-primary)] font-medium">
              サンプルデータ読み込み済み
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              {logs.length.toLocaleString()} 件のログ、{sources.length} 個のデータソース
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearData}
            className="px-4 py-2 text-[var(--accent-danger)] hover:bg-[var(--accent-danger)]/10 rounded transition-colors"
          >
            データを削除
          </button>
        </div>
      )}

      {/* File Upload */}
      <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          ファイルアップロード
        </h2>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10"
              : "border-[var(--border-color)]"
          }`}
        >
          <UploadIcon className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)]" />
          <p className="text-[var(--text-primary)] mb-2">
            ファイルをドラッグ&ドロップ
          </p>
          <p className="text-sm text-[var(--text-muted)] mb-4">または</p>
          <label className="px-4 py-2 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded cursor-pointer hover:bg-[var(--bg-hover)] transition-colors">
            ファイルを選択
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".log,.txt,.json,.csv"
              onChange={handleFileSelect}
            />
          </label>
          <p className="text-xs text-[var(--text-muted)] mt-4">
            対応形式: .log, .txt, .json, .csv
          </p>
        </div>
      </div>

      {/* Sample Data */}
      <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          サンプルデータ
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          トレーニング用のサンプルデータを読み込んで学習を始めましょう
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sampleDataTypes.map((type) => (
            <div
              key={type.id}
              className="p-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg"
            >
              <p className="font-medium text-[var(--text-primary)]">
                {type.name}
              </p>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                {type.description}
              </p>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={handleLoadSampleData}
          disabled={isDataLoaded || isLoading}
          className="mt-4 px-6 py-2 bg-[var(--accent-primary)] text-[var(--bg-primary)] rounded font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <LoadingSpinner />
              読み込み中...
            </>
          ) : isDataLoaded ? (
            "読み込み済み"
          ) : (
            "すべて読み込む"
          )}
        </button>
      </div>

      {/* Data Sources */}
      <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          取り込み済みデータソース
        </h2>
        {sources.length === 0 ? (
          <div className="text-center py-8 text-[var(--text-muted)]">
            <p>データソースがありません</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">
                    名前
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">
                    タイプ
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">
                    フォーマット
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">
                    ログ数
                  </th>
                </tr>
              </thead>
              <tbody>
                {sources.map((source) => {
                  const logCount = logs.filter((l) => l.sourceId === source.id).length;
                  return (
                    <tr
                      key={source.id}
                      className="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)]"
                    >
                      <td className="px-4 py-3 text-[var(--text-primary)]">
                        {source.name}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">
                        <span className="px-2 py-1 bg-[var(--bg-tertiary)] rounded text-xs">
                          {source.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">
                        {source.format}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">
                        {logCount.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function UploadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
      />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
