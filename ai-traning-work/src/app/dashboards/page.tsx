"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";

export default function DashboardsPage() {
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [newDashboardName, setNewDashboardName] = useState("");
  const [newDashboardDescription, setNewDashboardDescription] = useState("");

  const { dashboards, createDashboard, deleteDashboard } = useAppStore();

  const handleCreateDashboard = () => {
    if (newDashboardName.trim()) {
      const id = createDashboard(newDashboardName.trim(), newDashboardDescription.trim() || undefined);
      setShowCreateModal(false);
      setNewDashboardName("");
      setNewDashboardDescription("");
      router.push(`/dashboards/${id}`);
    }
  };

  const handleConfirmDelete = () => {
    if (showDeleteConfirm) {
      deleteDashboard(showDeleteConfirm);
      setShowDeleteConfirm(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">ダッシュボード</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">検索結果を可視化してダッシュボードにまとめます</p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="px-3 py-1.5 text-xs bg-[var(--accent-primary)] text-white rounded font-medium hover:brightness-110 transition-all"
        >
          + 新規作成
        </button>
      </div>

      {dashboards.length === 0 ? (
        <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-12 text-center">
          <p className="text-[var(--text-muted)] mb-4">ダッシュボードがありません</p>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded text-sm font-medium hover:brightness-110"
          >
            最初のダッシュボードを作成
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboards.map((dashboard) => (
            <div
              key={dashboard.id}
              className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-4 hover:border-[var(--accent-primary)] transition-colors"
            >
              <button
                type="button"
                className="w-full text-left"
                onClick={() => router.push(`/dashboards/${dashboard.id}`)}
              >
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">{dashboard.name}</h3>
                {dashboard.description && (
                  <p className="text-xs text-[var(--text-muted)] mt-1">{dashboard.description}</p>
                )}
                <p className="text-xs text-[var(--text-secondary)] mt-2">
                  パネル数: {dashboard.panels.length}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  更新: {new Date(dashboard.updatedAt).toLocaleString("ja-JP")}
                </p>
              </button>
              <div className="flex justify-end mt-3 pt-3 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(dashboard.id)}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--accent-danger)]"
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-secondary)] rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">新規ダッシュボード</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">名前</label>
                <input
                  type="text"
                  value={newDashboardName}
                  onChange={(e) => setNewDashboardName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateDashboard()}
                  className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                  placeholder="ダッシュボード名"
                  autoFocus
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
              <button type="button" onClick={handleCreateDashboard} disabled={!newDashboardName.trim()} className="px-4 py-2 bg-[var(--accent-primary)] text-white rounded disabled:opacity-50">作成</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-secondary)] rounded-lg p-6 w-full max-w-sm mx-4">
            <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2">ダッシュボードを削除しますか？</h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6">この操作は取り消せません。</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowDeleteConfirm(null)} className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded">キャンセル</button>
              <button type="button" onClick={handleConfirmDelete} className="px-4 py-2 text-sm bg-[var(--accent-danger)] text-white rounded hover:brightness-110">削除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
