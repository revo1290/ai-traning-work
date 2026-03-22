"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAppStore, Panel } from "@/lib/store";
import { ExecutionResult } from "@/lib/spl/types";
import {
  LineChart, Line,
  BarChart, Bar,
  AreaChart, Area,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const CHART_COLORS = [
  "var(--chart-1, #65a637)",
  "var(--chart-2, #6cb8ea)",
  "var(--chart-3, #f2b827)",
  "var(--chart-4, #d94f4f)",
  "var(--chart-5, #a87bbd)",
  "var(--chart-6, #ed8440)",
  "var(--chart-7, #4fa4c0)",
  "var(--chart-8, #ec5e8a)",
];

const PANEL_WIDTH_OPTIONS = [
  { label: "1/4", value: 3 },
  { label: "1/3", value: 4 },
  { label: "1/2", value: 6 },
  { label: "3/4", value: 9 },
  { label: "全幅", value: 12 },
];

export default function DashboardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [showPanelModal, setShowPanelModal] = useState(false);
  const [editingPanel, setEditingPanel] = useState<Panel | null>(null);
  const [showDeletePanelConfirm, setShowDeletePanelConfirm] = useState<string | null>(null);
  const [newPanelTitle, setNewPanelTitle] = useState("");
  const [newPanelQuery, setNewPanelQuery] = useState("");
  const [newPanelType, setNewPanelType] = useState<Panel["type"]>("bar");
  const [newPanelWidth, setNewPanelWidth] = useState(6);

  const {
    dashboards,
    addPanel,
    updatePanel,
    deletePanel,
    executeSearch,
    isDataLoaded,
    dashboardEditMode,
    setDashboardEditMode,
  } = useAppStore();

  const dashboard = useMemo(() => dashboards.find((d) => d.id === id), [dashboards, id]);

  if (!dashboard) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <p className="text-[var(--text-muted)]">ダッシュボードが見つかりません</p>
        <Link href="/dashboards" className="text-sm text-[var(--accent-primary)] hover:underline">
          ← ダッシュボード一覧に戻る
        </Link>
      </div>
    );
  }

  const handleAddPanel = () => {
    if (!newPanelTitle.trim() || !newPanelQuery.trim()) return;
    if (editingPanel) {
      updatePanel(dashboard.id, editingPanel.id, {
        title: newPanelTitle.trim(),
        query: newPanelQuery.trim(),
        type: newPanelType,
        position: { ...editingPanel.position, w: newPanelWidth },
      });
    } else {
      addPanel(dashboard.id, {
        title: newPanelTitle.trim(),
        query: newPanelQuery.trim(),
        type: newPanelType,
        position: { x: 0, y: 0, w: newPanelWidth, h: 4 },
      });
    }
    handleCloseModal();
  };

  const handleEditPanel = (panel: Panel) => {
    setEditingPanel(panel);
    setNewPanelTitle(panel.title);
    setNewPanelQuery(panel.query);
    setNewPanelType(panel.type);
    setNewPanelWidth(panel.position.w);
    setShowPanelModal(true);
  };

  const handleCloseModal = () => {
    setShowPanelModal(false);
    setEditingPanel(null);
    setNewPanelTitle("");
    setNewPanelQuery("");
    setNewPanelType("bar");
    setNewPanelWidth(6);
  };

  const handleDrilldown = (field: string, value: string) => {
    const query = encodeURIComponent(`${field}="${value}"`);
    router.push(`/search?q=${query}`);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Link href="/dashboards" className="text-xs text-[var(--text-muted)] hover:text-[var(--accent-primary)] mb-1 inline-block">
            ← ダッシュボード一覧
          </Link>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">{dashboard.name}</h1>
          {dashboard.description && (
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{dashboard.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDashboardEditMode(!dashboardEditMode)}
            className={`px-3 py-1.5 text-xs rounded transition-colors ${
              dashboardEditMode
                ? "bg-[var(--accent-primary)] text-white"
                : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
            }`}
          >
            {dashboardEditMode ? "編集完了" : "編集"}
          </button>
          {dashboardEditMode && (
            <button
              type="button"
              onClick={() => setShowPanelModal(true)}
              disabled={!isDataLoaded}
              className="px-3 py-1.5 text-xs bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded hover:bg-[var(--bg-hover)] disabled:opacity-50"
            >
              + パネル追加
            </button>
          )}
        </div>
      </div>

      {/* Panels */}
      {dashboard.panels.length === 0 ? (
        <div className="bg-[var(--bg-secondary)] rounded border border-[var(--border-color)] p-12 text-center">
          <p className="text-[var(--text-muted)]">パネルがありません</p>
          {!isDataLoaded ? (
            <p className="text-xs text-[var(--text-muted)] mt-2">パネルを追加するには、まずデータを読み込んでください</p>
          ) : (
            <button
              type="button"
              onClick={() => { setDashboardEditMode(true); setShowPanelModal(true); }}
              className="mt-4 px-4 py-2 text-sm bg-[var(--accent-primary)] text-white rounded hover:brightness-110"
            >
              最初のパネルを追加
            </button>
          )}
        </div>
      ) : (
        <div className="dashboard-grid">
          {dashboard.panels.map((panel) => (
            <div key={panel.id} className="dashboard-panel" style={{ gridColumn: `span ${panel.position.w}` }}>
              <PanelComponent
                panel={panel}
                executeSearch={executeSearch}
                editMode={dashboardEditMode}
                onEdit={() => handleEditPanel(panel)}
                onDelete={() => setShowDeletePanelConfirm(panel.id)}
                onDrilldown={handleDrilldown}
              />
            </div>
          ))}
        </div>
      )}

      {/* Panel Delete Confirmation */}
      {showDeletePanelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-secondary)] rounded-lg p-6 w-full max-w-sm mx-4">
            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">パネルを削除しますか？</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6">この操作は取り消せません。</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowDeletePanelConfirm(null)} className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded">キャンセル</button>
              <button
                type="button"
                onClick={() => { deletePanel(dashboard.id, showDeletePanelConfirm); setShowDeletePanelConfirm(null); }}
                className="px-4 py-2 text-sm bg-[var(--accent-danger)] text-white rounded hover:brightness-110"
              >
                削除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Panel Modal */}
      {showPanelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-secondary)] rounded-lg p-6 w-full max-w-lg mx-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              {editingPanel ? "パネル編集" : "パネル追加"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">タイトル</label>
                <input type="text" value={newPanelTitle} onChange={(e) => setNewPanelTitle(e.target.value)} className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none" placeholder="パネルタイトル" autoFocus />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">SPLクエリ</label>
                <textarea value={newPanelQuery} onChange={(e) => setNewPanelQuery(e.target.value)} className="w-full h-24 px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] font-mono text-sm focus:border-[var(--accent-primary)] focus:outline-none resize-none" placeholder="例: * | stats count by level" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">可視化タイプ</label>
                  <select value={newPanelType} onChange={(e) => setNewPanelType(e.target.value as Panel["type"])} className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none">
                    <option value="bar">棒グラフ</option>
                    <option value="line">折れ線グラフ</option>
                    <option value="area">エリアチャート</option>
                    <option value="pie">円グラフ</option>
                    <option value="table">テーブル</option>
                    <option value="single">シングル値</option>
                    <option value="gauge">ゲージ</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">パネル幅</label>
                  <select value={newPanelWidth} onChange={(e) => setNewPanelWidth(Number(e.target.value))} className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none">
                    {PANEL_WIDTH_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded">キャンセル</button>
              <button type="button" onClick={handleAddPanel} disabled={!newPanelTitle.trim() || !newPanelQuery.trim()} className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded disabled:opacity-50">
                {editingPanel ? "更新" : "追加"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PanelComponent({
  panel,
  executeSearch,
  editMode,
  onEdit,
  onDelete,
  onDrilldown,
}: {
  panel: Panel;
  executeSearch: (query: string) => ExecutionResult;
  editMode: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onDrilldown: (field: string, value: string) => void;
}) {
  const result = useMemo(() => executeSearch(panel.query), [panel.query, executeSearch]);

  return (
    <>
      <div className="panel-header">
        <h3 className="text-xs font-medium text-[var(--text-primary)]">{panel.title}</h3>
        {editMode && (
          <div className="flex gap-1">
            <button type="button" onClick={onEdit} className="text-[var(--text-muted)] hover:text-[var(--accent-info)] text-xs px-1">Edit</button>
            <button type="button" onClick={onDelete} className="text-[var(--text-muted)] hover:text-[var(--accent-danger)] text-xs px-1">x</button>
          </div>
        )}
      </div>
      <div className="panel-body">
        {!result.success ? (
          <div className="text-[var(--accent-danger)] text-xs p-4">エラー: {result.error?.message || "Unknown error"}</div>
        ) : result.data.length === 0 ? (
          <div className="text-[var(--text-muted)] text-xs p-4 text-center">データがありません</div>
        ) : (
          <div className="h-56">
            {panel.type === "bar" && <BarChartPanel data={result.data} onDrilldown={onDrilldown} />}
            {panel.type === "line" && <LineChartPanel data={result.data} onDrilldown={onDrilldown} />}
            {panel.type === "area" && <AreaChartPanel data={result.data} />}
            {panel.type === "pie" && <PieChartPanel data={result.data} onDrilldown={onDrilldown} />}
            {panel.type === "table" && <TablePanel data={result.data} onDrilldown={onDrilldown} />}
            {panel.type === "single" && <SingleValuePanel data={result.data} />}
            {panel.type === "gauge" && <GaugePanel data={result.data} />}
          </div>
        )}
        <p className="text-[10px] text-[var(--text-muted)] mt-1 font-mono truncate px-1">{panel.query}</p>
      </div>
    </>
  );
}

function BarChartPanel({ data, onDrilldown }: { data: Record<string, unknown>[]; onDrilldown: (field: string, value: string) => void }) {
  const keys = Object.keys(data[0] || {}).filter((k) => !k.startsWith("_"));
  const valueKey = keys.find((k) => typeof data[0][k] === "number") || keys[1];
  const labelKey = keys.find((k) => k !== valueKey) || keys[0];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data.slice(0, 20)} onClick={(e: unknown) => {
        const payload = (e as { activePayload?: { payload: Record<string, unknown> }[] })?.activePayload?.[0]?.payload;
        if (payload && labelKey) onDrilldown(labelKey, String(payload[labelKey]));
      }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
        <XAxis dataKey={labelKey} tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
        <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
        <Tooltip contentStyle={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "4px", fontSize: 11 }} cursor={{ fill: "var(--bg-hover)" }} />
        <Bar dataKey={valueKey} fill={CHART_COLORS[0]} style={{ cursor: "pointer" }} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function LineChartPanel({ data, onDrilldown }: { data: Record<string, unknown>[]; onDrilldown: (field: string, value: string) => void }) {
  const keys = Object.keys(data[0] || {}).filter((k) => !k.startsWith("_"));
  const valueKeys = keys.filter((k) => typeof data[0][k] === "number");
  const labelKey = keys.find((k) => !valueKeys.includes(k)) || "_time";

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} onClick={(e: unknown) => {
        const payload = (e as { activePayload?: { payload: Record<string, unknown> }[] })?.activePayload?.[0]?.payload;
        if (payload && labelKey) onDrilldown(labelKey, String(payload[labelKey]));
      }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
        <XAxis dataKey={labelKey} tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
        <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
        <Tooltip contentStyle={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "4px", fontSize: 11 }} />
        <Legend wrapperStyle={{ fontSize: 10 }} />
        {valueKeys.map((key, i) => (
          <Line key={key} type="monotone" dataKey={key} stroke={CHART_COLORS[i % CHART_COLORS.length]} strokeWidth={2} dot={false} style={{ cursor: "pointer" }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

function AreaChartPanel({ data }: { data: Record<string, unknown>[] }) {
  const keys = Object.keys(data[0] || {}).filter((k) => !k.startsWith("_"));
  const valueKeys = keys.filter((k) => typeof data[0][k] === "number");
  const labelKey = keys.find((k) => !valueKeys.includes(k)) || "_time";

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
        <XAxis dataKey={labelKey} tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
        <YAxis tick={{ fill: "var(--text-muted)", fontSize: 10 }} />
        <Tooltip contentStyle={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "4px", fontSize: 11 }} />
        <Legend wrapperStyle={{ fontSize: 10 }} />
        {valueKeys.map((key, i) => (
          <Area key={key} type="monotone" dataKey={key} stroke={CHART_COLORS[i % CHART_COLORS.length]} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.3} />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

function PieChartPanel({ data, onDrilldown }: { data: Record<string, unknown>[]; onDrilldown: (field: string, value: string) => void }) {
  const keys = Object.keys(data[0] || {}).filter((k) => !k.startsWith("_"));
  const valueKey = keys.find((k) => typeof data[0][k] === "number") || keys[1];
  const labelKey = keys.find((k) => k !== valueKey) || keys[0];
  const chartData = data.slice(0, 10).map((item) => ({ name: String(item[labelKey]), value: Number(item[valueKey]) }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={70}
          label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
          labelLine={false}
          style={{ fontSize: 10, cursor: "pointer" }}
          onClick={(entry) => onDrilldown(labelKey, String(entry.name))}
        >
          {chartData.map((_, index) => (
            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "4px", fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function TablePanel({ data, onDrilldown }: { data: Record<string, unknown>[]; onDrilldown: (field: string, value: string) => void }) {
  const keys = Object.keys(data[0] || {}).filter((k) => !k.startsWith("_")).slice(0, 6);
  return (
    <div className="overflow-auto h-full">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[var(--border-color)]">
            {keys.map((key) => (
              <th key={key} className="px-2 py-1 text-left text-[var(--text-secondary)] bg-[var(--bg-tertiary)]">{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 10).map((row, i) => (
            <tr key={i} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)] cursor-pointer" onClick={() => {
              const firstKey = keys[0];
              if (firstKey) onDrilldown(firstKey, String(row[firstKey]));
            }}>
              {keys.map((key) => (
                <td key={key} className="px-2 py-1 text-[var(--text-primary)]">{formatValue(row[key])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SingleValuePanel({ data }: { data: Record<string, unknown>[] }) {
  const keys = Object.keys(data[0] || {}).filter((k) => !k.startsWith("_"));
  const valueKey = keys.find((k) => typeof data[0][k] === "number") || keys[0];
  const value = data[0]?.[valueKey];

  let trendPercent: number | null = null;
  if (data.length >= 2 && typeof data[0][valueKey] === "number" && typeof data[1][valueKey] === "number") {
    const current = Number(data[0][valueKey]);
    const previous = Number(data[1][valueKey]);
    if (previous !== 0) trendPercent = ((current - previous) / previous) * 100;
  }

  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <p className="text-3xl font-bold text-[var(--accent-primary)]">{formatValue(value)}</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">{valueKey}</p>
        {trendPercent !== null && (
          <p className={`text-xs mt-1 ${trendPercent >= 0 ? "text-[var(--accent-danger)]" : "text-[var(--accent-primary)]"}`}>
            {trendPercent >= 0 ? "+" : ""}{trendPercent.toFixed(1)}%
          </p>
        )}
      </div>
    </div>
  );
}

function GaugePanel({ data }: { data: Record<string, unknown>[] }) {
  const keys = Object.keys(data[0] || {}).filter((k) => !k.startsWith("_"));
  const valueKey = keys.find((k) => typeof data[0][k] === "number") || keys[0];
  const value = Number(data[0]?.[valueKey] ?? 0);
  const percentage = Math.min((value / 100) * 100, 100);
  const color = percentage > 80 ? "var(--accent-danger)" : percentage > 50 ? "var(--accent-secondary)" : "var(--accent-primary)";

  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-32 h-16 mx-auto overflow-hidden">
          <div className="absolute inset-0 border-[8px] border-[var(--bg-tertiary)] rounded-t-full border-b-0" />
          <div className="absolute inset-0 border-[8px] rounded-t-full border-b-0" style={{ borderColor: color, clipPath: `polygon(0 100%, 0 0, ${percentage}% 0, ${percentage}% 100%)` }} />
        </div>
        <p className="text-2xl font-bold mt-1" style={{ color }}>{value}</p>
        <p className="text-xs text-[var(--text-muted)]">{valueKey}</p>
      </div>
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
