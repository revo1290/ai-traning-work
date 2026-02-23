"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";

export default function LookupsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTableName, setNewTableName] = useState("");
  const [newTableData, setNewTableData] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);

  const { lookupTables, addLookupTable, deleteLookupTable } = useAppStore();

  const handleCreateTable = () => {
    setParseError(null);
    if (!newTableName.trim()) return;
    try {
      const parsed = JSON.parse(newTableData.trim());
      const rows = Array.isArray(parsed) ? parsed : parsed.rows ?? parsed.data ?? [parsed];
      if (rows.length === 0) {
        setParseError("少なくとも1行のデータが必要です");
        return;
      }
      const columns = [...new Set(rows.flatMap((r: Record<string, unknown>) => Object.keys(r)))];
      addLookupTable({
        name: newTableName.trim(),
        columns,
        rows: rows as Record<string, unknown>[],
      });
      setShowCreateModal(false);
      setNewTableName("");
      setNewTableData("");
    } catch {
      setParseError("有効なJSON配列を入力してください。例: [{\"key\":\"value\"}]");
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("このLookupテーブルを削除しますか？")) {
      deleteLookupTable(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Lookupテーブル</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            lookup / inputlookup コマンドで参照するテーブルを管理します
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowCreateModal(true);
            setParseError(null);
          }}
          className="px-4 py-2 bg-[var(--accent-primary)] text-[var(--bg-primary)] rounded font-medium hover:opacity-90"
        >
          + 新規作成
        </button>
      </div>

      {lookupTables.length === 0 ? (
        <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-12 text-center">
          <p className="text-[var(--text-muted)] mb-2">Lookupテーブルがありません</p>
          <p className="text-sm text-[var(--text-muted)] mb-4">
            サンプルデータ読み込み時に host_owners が自動作成されます。または新規作成で追加できます。
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            使用例: <code className="bg-[var(--bg-tertiary)] px-1 rounded">| lookup host_owners host</code>
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {lookupTables.map((table) => (
            <div
              key={table.id}
              className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] overflow-hidden"
            >
              <div className="flex justify-between items-center p-4 border-b border-[var(--border-color)]">
                <h3 className="font-medium text-[var(--text-primary)]">{table.name}</h3>
                <button
                  type="button"
                  onClick={() => handleDelete(table.id)}
                  className="px-3 py-1 text-sm text-[var(--accent-danger)] hover:bg-[var(--accent-danger)]/10 rounded"
                >
                  削除
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border-color)]">
                      {table.columns.map((col) => (
                        <th
                          key={col}
                          className="px-4 py-2 text-left font-medium text-[var(--text-secondary)] bg-[var(--bg-tertiary)]"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.slice(0, 10).map((row, i) => (
                      <tr key={i} className="border-b border-[var(--border-color)]">
                        {table.columns.map((col) => (
                          <td key={col} className="px-4 py-2 text-[var(--text-primary)]">
                            {String(row[col] ?? "-")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {table.rows.length > 10 && (
                <p className="p-2 text-xs text-[var(--text-muted)]">
                  ...他 {table.rows.length - 10} 件
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-secondary)] rounded-lg p-6 w-full max-w-lg mx-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              新規Lookupテーブル
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">テーブル名</label>
                <input
                  type="text"
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                  placeholder="例: my_lookup"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">
                  JSONデータ（配列形式）
                </label>
                <textarea
                  value={newTableData}
                  onChange={(e) => setNewTableData(e.target.value)}
                  className="w-full h-40 px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] font-mono text-sm focus:border-[var(--accent-primary)] focus:outline-none resize-none"
                  placeholder={'[{"host":"web-01","owner":"ops"},{"host":"app-01","owner":"dev"}]'}
                />
                {parseError && (
                  <p className="text-sm text-[var(--accent-danger)] mt-1">{parseError}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setParseError(null);
                }}
                className="px-4 py-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleCreateTable}
                disabled={!newTableName.trim() || !newTableData.trim()}
                className="px-4 py-2 bg-[var(--accent-primary)] text-[var(--bg-primary)] rounded disabled:opacity-50"
              >
                作成
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
