"use client";

import { useMemo, useState } from "react";
import type { ExecutionResult } from "@/lib/spl/types";

interface SearchStatsPanelProps {
  result: ExecutionResult;
}

interface FieldStats {
  field: string;
  count: number;
  distinctCount: number;
  topValues: { value: string; count: number; percent: number }[];
  type: "string" | "number" | "date" | "mixed";
  numericStats?: {
    min: number;
    max: number;
    avg: number;
    sum: number;
    median: number;
  };
}

export default function SearchStatsPanel({ result }: SearchStatsPanelProps) {
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "count" | "distinct">("name");

  const fieldStats = useMemo(() => {
    if (!result.data || result.data.length === 0) return [];

    const stats: FieldStats[] = [];

    for (const field of result.fields) {
      const values = result.data
        .map((row) => row[field])
        .filter((v) => v !== null && v !== undefined);

      const count = values.length;
      const valueCounts = new Map<string, number>();

      let isNumeric = true;
      let isDate = true;
      const numValues: number[] = [];

      for (const val of values) {
        const strVal = String(val);
        valueCounts.set(strVal, (valueCounts.get(strVal) || 0) + 1);

        const num = Number(val);
        if (isNaN(num) || val === "" || val === true || val === false) {
          isNumeric = false;
        } else {
          numValues.push(num);
        }

        if (!(val instanceof Date) && isNaN(Date.parse(String(val)))) {
          isDate = false;
        }
      }

      const distinctCount = valueCounts.size;

      // Top values (上位10件)
      const topValues = Array.from(valueCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([value, cnt]) => ({
          value: value.length > 50 ? value.substring(0, 50) + "..." : value,
          count: cnt,
          percent: count > 0 ? Math.round((cnt / count) * 10000) / 100 : 0,
        }));

      let type: FieldStats["type"] = "string";
      let numericStats: FieldStats["numericStats"] | undefined;

      if (isNumeric && numValues.length > 0) {
        type = "number";
        const sorted = [...numValues].sort((a, b) => a - b);
        numericStats = {
          min: sorted[0],
          max: sorted[sorted.length - 1],
          avg: numValues.reduce((a, b) => a + b, 0) / numValues.length,
          sum: numValues.reduce((a, b) => a + b, 0),
          median:
            sorted.length % 2 === 0
              ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
              : sorted[Math.floor(sorted.length / 2)],
        };
      } else if (isDate) {
        type = "date";
      }

      stats.push({ field, count, distinctCount, topValues, type, numericStats });
    }

    // ソート
    if (sortBy === "count") {
      stats.sort((a, b) => b.count - a.count);
    } else if (sortBy === "distinct") {
      stats.sort((a, b) => b.distinctCount - a.distinctCount);
    } else {
      stats.sort((a, b) => a.field.localeCompare(b.field));
    }

    return stats;
  }, [result, sortBy]);

  const selected = selectedField
    ? fieldStats.find((s) => s.field === selectedField)
    : null;

  return (
    <div className="flex gap-4 p-4 min-h-[400px]">
      {/* フィールド一覧 */}
      <div className="w-1/3 space-y-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            フィールド ({fieldStats.length})
          </h3>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "name" | "count" | "distinct")}
            className="text-xs px-2 py-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-[var(--text-secondary)]"
          >
            <option value="name">名前順</option>
            <option value="count">出現数順</option>
            <option value="distinct">ユニーク数順</option>
          </select>
        </div>
        <div className="space-y-1 max-h-[500px] overflow-y-auto">
          {fieldStats.map((stat) => (
            <button
              key={stat.field}
              type="button"
              onClick={() => setSelectedField(stat.field)}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                selectedField === stat.field
                  ? "bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)] text-[var(--text-primary)]"
                  : "hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono truncate mr-2">{stat.field}</span>
                <span className="flex items-center gap-2 text-xs text-[var(--text-muted)] shrink-0">
                  <span
                    className={`px-1.5 py-0.5 rounded ${
                      stat.type === "number"
                        ? "bg-blue-500/20 text-blue-400"
                        : stat.type === "date"
                        ? "bg-purple-500/20 text-purple-400"
                        : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {stat.type === "number" ? "#" : stat.type === "date" ? "T" : "A"}
                  </span>
                  <span>{stat.distinctCount}</span>
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* フィールド詳細 */}
      <div className="flex-1 bg-[var(--bg-primary)] rounded-lg border border-[var(--border-color)] p-4">
        {selected ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] font-mono">
                {selected.field}
              </h3>
              <div className="flex gap-4 mt-2 text-sm text-[var(--text-secondary)]">
                <span>
                  出現数: <strong className="text-[var(--text-primary)]">{selected.count.toLocaleString()}</strong>
                </span>
                <span>
                  ユニーク値: <strong className="text-[var(--text-primary)]">{selected.distinctCount.toLocaleString()}</strong>
                </span>
                <span>
                  型:{" "}
                  <strong className="text-[var(--text-primary)]">
                    {selected.type === "number" ? "数値" : selected.type === "date" ? "日時" : "文字列"}
                  </strong>
                </span>
              </div>
            </div>

            {/* 数値統計 */}
            {selected.numericStats && (
              <div className="bg-[var(--bg-secondary)] rounded-lg p-3">
                <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">数値統計</h4>
                <div className="grid grid-cols-5 gap-3 text-sm">
                  <div>
                    <span className="text-[var(--text-muted)] text-xs">最小</span>
                    <p className="text-[var(--text-primary)] font-mono">
                      {formatNumber(selected.numericStats.min)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] text-xs">最大</span>
                    <p className="text-[var(--text-primary)] font-mono">
                      {formatNumber(selected.numericStats.max)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] text-xs">平均</span>
                    <p className="text-[var(--text-primary)] font-mono">
                      {formatNumber(selected.numericStats.avg)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] text-xs">中央値</span>
                    <p className="text-[var(--text-primary)] font-mono">
                      {formatNumber(selected.numericStats.median)}
                    </p>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] text-xs">合計</span>
                    <p className="text-[var(--text-primary)] font-mono">
                      {formatNumber(selected.numericStats.sum)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Top Values */}
            <div>
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">
                上位の値 (上位{selected.topValues.length}件)
              </h4>
              <div className="space-y-1">
                {selected.topValues.map((tv, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[var(--text-primary)] truncate">
                          {tv.value}
                        </span>
                      </div>
                      <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-1.5 mt-1">
                        <div
                          className="bg-[var(--accent-primary)] rounded-full h-1.5 transition-all"
                          style={{ width: `${Math.max(tv.percent, 1)}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-[var(--text-muted)] text-xs shrink-0 w-16 text-right">
                      {tv.count.toLocaleString()} ({tv.percent}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
            <div className="text-center">
              <p className="text-lg mb-2">フィールドを選択してください</p>
              <p className="text-sm">左のリストからフィールドを選択すると、統計情報が表示されます</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatNumber(n: number): string {
  if (Number.isInteger(n)) return n.toLocaleString();
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
