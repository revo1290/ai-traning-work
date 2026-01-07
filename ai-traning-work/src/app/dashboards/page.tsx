"use client";

import { useState, useMemo } from "react";
import { useAppStore, Panel } from "@/lib/store";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#65d26e", "#5bc0de", "#f0ad4e", "#d9534f", "#6366f1", "#8b5cf6"];

export default function DashboardsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPanelModal, setShowPanelModal] = useState(false);
  const [selectedDashboard, setSelectedDashboard] = useState<string | null>(null);
  const [newDashboardName, setNewDashboardName] = useState("");
  const [newDashboardDescription, setNewDashboardDescription] = useState("");
  const [newPanelTitle, setNewPanelTitle] = useState("");
  const [newPanelQuery, setNewPanelQuery] = useState("");
  const [newPanelType, setNewPanelType] = useState<Panel["type"]>("bar");

  const {
    dashboards,
    createDashboard,
    deleteDashboard,
    addPanel,
    deletePanel,
    executeSearch,
    isDataLoaded,
  } = useAppStore();

  const currentDashboard = useMemo(
    () => dashboards.find((d) => d.id === selectedDashboard),
    [dashboards, selectedDashboard]
  );

  const handleCreateDashboard = () => {
    if (newDashboardName.trim()) {
      const id = createDashboard(newDashboardName.trim(), newDashboardDescription.trim() || undefined);
      setSelectedDashboard(id);
      setShowCreateModal(false);
      setNewDashboardName("");
      setNewDashboardDescription("");
    }
  };

  const handleDeleteDashboard = (id: string) => {
    if (confirm("このダッシュボードを削除しますか？")) {
      deleteDashboard(id);
      if (selectedDashboard === id) {
        setSelectedDashboard(null);
      }
    }
  };

  const handleAddPanel = () => {
    if (newPanelTitle.trim() && newPanelQuery.trim() && currentDashboard) {
      addPanel(currentDashboard.id, {
        title: newPanelTitle.trim(),
        query: newPanelQuery.trim(),
        type: newPanelType,
        position: { x: 0, y: 0, w: 6, h: 4 },
      });
      setShowPanelModal(false);
      setNewPanelTitle("");
      setNewPanelQuery("");
      setNewPanelType("bar");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            ダッシュボード
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">
            検索結果を可視化してダッシュボードにまとめます
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-[var(--accent-primary)] text-[var(--bg-primary)] rounded font-medium hover:opacity-90 transition-opacity"
        >
          新規作成
        </button>
      </div>

      {/* Dashboard Tabs */}
      {dashboards.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {dashboards.map((dashboard) => (
            <button
              key={dashboard.id}
              type="button"
              onClick={() => setSelectedDashboard(dashboard.id)}
              className={`px-4 py-2 rounded transition-colors ${
                selectedDashboard === dashboard.id
                  ? "bg-[var(--accent-primary)] text-[var(--bg-primary)]"
                  : "bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
              }`}
            >
              {dashboard.name}
            </button>
          ))}
        </div>
      )}

      {/* Empty State */}
      {dashboards.length === 0 && (
        <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-8 text-center">
          <p className="text-[var(--text-muted)]">
            ダッシュボードがありません
          </p>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="mt-4 px-4 py-2 bg-[var(--accent-primary)] text-[var(--bg-primary)] rounded font-medium hover:opacity-90"
          >
            最初のダッシュボードを作成
          </button>
        </div>
      )}

      {/* Dashboard Content */}
      {currentDashboard && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-4">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {currentDashboard.name}
              </h2>
              {currentDashboard.description && (
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  {currentDashboard.description}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowPanelModal(true)}
                disabled={!isDataLoaded}
                className="px-3 py-1 bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded hover:bg-[var(--bg-hover)] disabled:opacity-50"
              >
                + パネル追加
              </button>
              <button
                type="button"
                onClick={() => handleDeleteDashboard(currentDashboard.id)}
                className="px-3 py-1 text-[var(--accent-danger)] hover:bg-[var(--accent-danger)]/10 rounded"
              >
                削除
              </button>
            </div>
          </div>

          {currentDashboard.panels.length === 0 ? (
            <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-8 text-center">
              <p className="text-[var(--text-muted)]">パネルがありません</p>
              {!isDataLoaded && (
                <p className="text-sm text-[var(--text-muted)] mt-2">
                  パネルを追加するには、まずデータを読み込んでください
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {currentDashboard.panels.map((panel) => (
                <PanelComponent
                  key={panel.id}
                  panel={panel}
                  executeSearch={executeSearch}
                  onDelete={() => deletePanel(currentDashboard.id, panel.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Dashboard Modal */}
      {showCreateModal && (
        <Modal onClose={() => setShowCreateModal(false)}>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            新規ダッシュボード
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1">名前</label>
              <input
                type="text"
                value={newDashboardName}
                onChange={(e) => setNewDashboardName(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                placeholder="ダッシュボード名"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1">説明（任意）</label>
              <input
                type="text"
                value={newDashboardDescription}
                onChange={(e) => setNewDashboardDescription(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                placeholder="説明"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded">キャンセル</button>
            <button type="button" onClick={handleCreateDashboard} disabled={!newDashboardName.trim()} className="px-4 py-2 bg-[var(--accent-primary)] text-[var(--bg-primary)] rounded disabled:opacity-50">作成</button>
          </div>
        </Modal>
      )}

      {/* Add Panel Modal */}
      {showPanelModal && (
        <Modal onClose={() => setShowPanelModal(false)}>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">パネル追加</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1">タイトル</label>
              <input type="text" value={newPanelTitle} onChange={(e) => setNewPanelTitle(e.target.value)} className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none" placeholder="パネルタイトル" />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1">SPLクエリ</label>
              <textarea value={newPanelQuery} onChange={(e) => setNewPanelQuery(e.target.value)} className="w-full h-24 px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] font-mono text-sm focus:border-[var(--accent-primary)] focus:outline-none resize-none" placeholder="例: * | stats count by level" />
            </div>
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-1">可視化タイプ</label>
              <select value={newPanelType} onChange={(e) => setNewPanelType(e.target.value as Panel["type"])} className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none">
                <option value="bar">棒グラフ</option>
                <option value="line">折れ線グラフ</option>
                <option value="pie">円グラフ</option>
                <option value="table">テーブル</option>
                <option value="single">シングル値</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button type="button" onClick={() => setShowPanelModal(false)} className="px-4 py-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded">キャンセル</button>
            <button type="button" onClick={handleAddPanel} disabled={!newPanelTitle.trim() || !newPanelQuery.trim()} className="px-4 py-2 bg-[var(--accent-primary)] text-[var(--bg-primary)] rounded disabled:opacity-50">追加</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function PanelComponent({ panel, executeSearch, onDelete }: { panel: Panel; executeSearch: (query: string) => { success: boolean; data: Record<string, unknown>[]; error?: string }; onDelete: () => void }) {
  const result = useMemo(() => executeSearch(panel.query), [panel.query, executeSearch]);

  return (
    <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-[var(--text-primary)]">{panel.title}</h3>
        <button type="button" onClick={onDelete} className="text-[var(--text-muted)] hover:text-[var(--accent-danger)] text-sm">✕</button>
      </div>
      {!result.success ? (
        <div className="text-[var(--accent-danger)] text-sm p-4">エラー: {result.error}</div>
      ) : result.data.length === 0 ? (
        <div className="text-[var(--text-muted)] text-sm p-4 text-center">データがありません</div>
      ) : (
        <div className="h-64">
          {panel.type === "bar" && <BarChartPanel data={result.data} />}
          {panel.type === "line" && <LineChartPanel data={result.data} />}
          {panel.type === "pie" && <PieChartPanel data={result.data} />}
          {panel.type === "table" && <TablePanel data={result.data} />}
          {panel.type === "single" && <SingleValuePanel data={result.data} />}
        </div>
      )}
      <p className="text-xs text-[var(--text-muted)] mt-2 font-mono truncate">{panel.query}</p>
    </div>
  );
}

function BarChartPanel({ data }: { data: Record<string, unknown>[] }) {
  const keys = Object.keys(data[0] || {}).filter((k) => !k.startsWith("_"));
  const valueKey = keys.find((k) => typeof data[0][k] === "number") || keys[1];
  const labelKey = keys.find((k) => k !== valueKey) || keys[0];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data.slice(0, 20)}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
        <XAxis dataKey={labelKey} tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
        <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
        <Tooltip contentStyle={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "4px" }} />
        <Bar dataKey={valueKey} fill="#65d26e" />
      </BarChart>
    </ResponsiveContainer>
  );
}

function LineChartPanel({ data }: { data: Record<string, unknown>[] }) {
  const keys = Object.keys(data[0] || {}).filter((k) => !k.startsWith("_"));
  const valueKeys = keys.filter((k) => typeof data[0][k] === "number");
  const labelKey = keys.find((k) => !valueKeys.includes(k)) || "_time";

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
        <XAxis dataKey={labelKey} tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
        <YAxis tick={{ fill: "var(--text-muted)", fontSize: 12 }} />
        <Tooltip contentStyle={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "4px" }} />
        <Legend />
        {valueKeys.map((key, i) => (
          <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

function PieChartPanel({ data }: { data: Record<string, unknown>[] }) {
  const keys = Object.keys(data[0] || {}).filter((k) => !k.startsWith("_"));
  const valueKey = keys.find((k) => typeof data[0][k] === "number") || keys[1];
  const labelKey = keys.find((k) => k !== valueKey) || keys[0];
  const chartData = data.slice(0, 10).map((item) => ({ name: String(item[labelKey]), value: Number(item[valueKey]) }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}>
          {chartData.map((_, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
        </Pie>
        <Tooltip contentStyle={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "4px" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function TablePanel({ data }: { data: Record<string, unknown>[] }) {
  const keys = Object.keys(data[0] || {}).filter((k) => !k.startsWith("_")).slice(0, 5);
  return (
    <div className="overflow-auto h-full">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-[var(--border-color)]">{keys.map((key) => (<th key={key} className="px-2 py-1 text-left text-[var(--text-secondary)]">{key}</th>))}</tr></thead>
        <tbody>{data.slice(0, 10).map((row, i) => (<tr key={i} className="border-b border-[var(--border-color)]">{keys.map((key) => (<td key={key} className="px-2 py-1 text-[var(--text-primary)]">{formatValue(row[key])}</td>))}</tr>))}</tbody>
      </table>
    </div>
  );
}

function SingleValuePanel({ data }: { data: Record<string, unknown>[] }) {
  const keys = Object.keys(data[0] || {}).filter((k) => !k.startsWith("_"));
  const valueKey = keys.find((k) => typeof data[0][k] === "number") || keys[0];
  const value = data[0]?.[valueKey];
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <p className="text-4xl font-bold text-[var(--accent-primary)]">{formatValue(value)}</p>
        <p className="text-sm text-[var(--text-muted)] mt-2">{valueKey}</p>
      </div>
    </div>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[var(--bg-secondary)] rounded-lg p-6 w-full max-w-md mx-4">{children}</div>
    </div>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (value instanceof Date) return value.toLocaleString("ja-JP");
  if (typeof value === "number") return value.toLocaleString();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}
