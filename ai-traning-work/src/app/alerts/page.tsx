"use client";

import { useState } from "react";
import { useAppStore, Alert } from "@/lib/store";

export default function AlertsPage() {
  const [activeTab, setActiveTab] = useState<"rules" | "history">("rules");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAlertName, setNewAlertName] = useState("");
  const [newAlertQuery, setNewAlertQuery] = useState("");
  const [newAlertCondition, setNewAlertCondition] = useState<Alert["condition"]>("gt");
  const [newAlertThreshold, setNewAlertThreshold] = useState(0);

  const { alerts, alertHistory, createAlert, updateAlert, deleteAlert, isDataLoaded } = useAppStore();

  const handleCreateAlert = () => {
    if (newAlertName.trim() && newAlertQuery.trim()) {
      createAlert({
        name: newAlertName.trim(),
        query: newAlertQuery.trim(),
        condition: newAlertCondition,
        threshold: newAlertThreshold,
        enabled: true,
      });
      setShowCreateModal(false);
      setNewAlertName("");
      setNewAlertQuery("");
      setNewAlertCondition("gt");
      setNewAlertThreshold(0);
    }
  };

  const handleToggleAlert = (id: string, enabled: boolean) => {
    updateAlert(id, { enabled: !enabled });
  };

  const handleDeleteAlert = (id: string) => {
    if (confirm("このアラートを削除しますか？")) {
      deleteAlert(id);
    }
  };

  const conditionLabels: Record<Alert["condition"], string> = {
    gt: ">",
    lt: "<",
    eq: "=",
    ne: "≠",
    gte: "≥",
    lte: "≤",
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">アラート</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            条件に基づくアラートを設定・管理します
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          disabled={!isDataLoaded}
          className="px-4 py-2 bg-[var(--accent-primary)] text-[var(--bg-primary)] rounded font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          + 新規作成
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-[var(--border-color)]">
        <button
          type="button"
          onClick={() => setActiveTab("rules")}
          className={`px-4 py-2 -mb-px ${
            activeTab === "rules"
              ? "text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)]"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          アラートルール ({alerts.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 -mb-px ${
            activeTab === "history"
              ? "text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)]"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          アラート履歴 ({alertHistory.length})
        </button>
      </div>

      {/* Rules Tab */}
      {activeTab === "rules" && (
        <>
          {alerts.length === 0 ? (
            <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-[var(--bg-tertiary)] rounded-lg flex items-center justify-center">
                <AlertIcon className="w-8 h-8 text-[var(--text-muted)]" />
              </div>
              <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
                アラートがありません
              </h3>
              <p className="text-[var(--text-secondary)] mb-4">
                SPLクエリに基づくアラートルールを作成して、異常を監視しましょう
              </p>
              {!isDataLoaded && (
                <p className="text-sm text-[var(--text-muted)]">
                  アラートを作成するには、まずデータを読み込んでください
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-[var(--text-primary)]">
                          {alert.name}
                        </h3>
                        <span
                          className={`px-2 py-0.5 text-xs rounded ${
                            alert.enabled
                              ? "bg-[var(--accent-secondary)]/20 text-[var(--accent-secondary)]"
                              : "bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
                          }`}
                        >
                          {alert.enabled ? "有効" : "無効"}
                        </span>
                      </div>
                      <p className="text-sm font-mono text-[var(--text-muted)] mt-1">
                        {alert.query}
                      </p>
                      <p className="text-sm text-[var(--text-secondary)] mt-2">
                        条件: 結果 {conditionLabels[alert.condition]} {alert.threshold}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleAlert(alert.id, alert.enabled)}
                        className="px-3 py-1 text-sm bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded hover:bg-[var(--bg-hover)]"
                      >
                        {alert.enabled ? "無効化" : "有効化"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAlert(alert.id)}
                        className="px-3 py-1 text-sm text-[var(--accent-danger)] hover:bg-[var(--accent-danger)]/10 rounded"
                      >
                        削除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <>
          {alertHistory.length === 0 ? (
            <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-8 text-center">
              <p className="text-[var(--text-muted)]">アラート履歴がありません</p>
            </div>
          ) : (
            <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">
                      発火日時
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">
                      アラート名
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">
                      メッセージ
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-[var(--text-secondary)]">
                      値
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {alertHistory.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)]"
                    >
                      <td className="px-4 py-3 text-[var(--text-primary)]">
                        {new Date(item.triggeredAt).toLocaleString("ja-JP")}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-primary)]">
                        {item.alertName}
                      </td>
                      <td className="px-4 py-3 text-[var(--text-secondary)]">
                        {item.message}
                      </td>
                      <td className="px-4 py-3 text-[var(--accent-danger)]">
                        {item.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Create Alert Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-secondary)] rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              新規アラート
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">名前</label>
                <input
                  type="text"
                  value={newAlertName}
                  onChange={(e) => setNewAlertName(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                  placeholder="アラート名"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">
                  SPLクエリ
                </label>
                <textarea
                  value={newAlertQuery}
                  onChange={(e) => setNewAlertQuery(e.target.value)}
                  className="w-full h-20 px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] font-mono text-sm focus:border-[var(--accent-primary)] focus:outline-none resize-none"
                  placeholder="例: level=error | stats count"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">条件</label>
                  <select
                    value={newAlertCondition}
                    onChange={(e) => setNewAlertCondition(e.target.value as Alert["condition"])}
                    className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                  >
                    <option value="gt">より大きい (&gt;)</option>
                    <option value="gte">以上 (≥)</option>
                    <option value="lt">より小さい (&lt;)</option>
                    <option value="lte">以下 (≤)</option>
                    <option value="eq">等しい (=)</option>
                    <option value="ne">等しくない (≠)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">閾値</label>
                  <input
                    type="number"
                    value={newAlertThreshold}
                    onChange={(e) => setNewAlertThreshold(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleCreateAlert}
                disabled={!newAlertName.trim() || !newAlertQuery.trim()}
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

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}
