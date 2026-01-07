"use client";

import { useState } from "react";
import { useAppStore, FieldExtraction } from "@/lib/store";

export default function FieldsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldPattern, setNewFieldPattern] = useState("");
  const [newFieldType, setNewFieldType] = useState<FieldExtraction["type"]>("string");
  const [testText, setTestText] = useState("");
  const [testResult, setTestResult] = useState<string | null>(null);

  const { fieldExtractions, addFieldExtraction, deleteFieldExtraction, sources } = useAppStore();

  const handleCreateField = () => {
    if (newFieldName.trim() && newFieldPattern.trim()) {
      addFieldExtraction({
        name: newFieldName.trim(),
        pattern: newFieldPattern.trim(),
        type: newFieldType,
      });
      setShowCreateModal(false);
      setNewFieldName("");
      setNewFieldPattern("");
      setNewFieldType("string");
      setTestText("");
      setTestResult(null);
    }
  };

  const handleTestPattern = () => {
    if (!newFieldPattern.trim() || !testText.trim()) return;
    try {
      const regex = new RegExp(newFieldPattern);
      const match = testText.match(regex);
      if (match) {
        if (match.groups) {
          setTestResult(`マッチ: ${JSON.stringify(match.groups)}`);
        } else {
          setTestResult(`マッチ: ${match[0]}`);
        }
      } else {
        setTestResult("マッチなし");
      }
    } catch {
      setTestResult("無効な正規表現です");
    }
  };

  const handleDeleteField = (id: string) => {
    if (confirm("このフィールド抽出ルールを削除しますか？")) {
      deleteFieldExtraction(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">フィールド抽出</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            正規表現を使用してカスタムフィールドを抽出します
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-[var(--accent-primary)] text-[var(--bg-primary)] rounded font-medium hover:opacity-90 transition-opacity"
        >
          + 新規ルール
        </button>
      </div>

      {/* Field Extractions List */}
      {fieldExtractions.length === 0 ? (
        <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-[var(--bg-tertiary)] rounded-lg flex items-center justify-center">
            <FieldIcon className="w-8 h-8 text-[var(--text-muted)]" />
          </div>
          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">
            抽出ルールがありません
          </h3>
          <p className="text-[var(--text-secondary)] mb-4">
            正規表現を使用してログからカスタムフィールドを抽出できます
          </p>
          <div className="text-sm text-[var(--text-muted)]">
            <p>例: IPアドレスを抽出</p>
            <code className="block mt-2 px-3 py-2 bg-[var(--bg-primary)] rounded font-mono">
              {`(?<ip>\\d+\\.\\d+\\.\\d+\\.\\d+)`}
            </code>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {fieldExtractions.map((field) => (
            <div
              key={field.id}
              className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-[var(--text-primary)]">{field.name}</h3>
                    <span className="px-2 py-0.5 text-xs bg-[var(--bg-tertiary)] text-[var(--text-muted)] rounded">
                      {field.type}
                    </span>
                  </div>
                  <p className="text-sm font-mono text-[var(--text-muted)] mt-1">{field.pattern}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-2">
                    作成日: {new Date(field.createdAt).toLocaleString("ja-JP")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteField(field.id)}
                  className="px-3 py-1 text-sm text-[var(--accent-danger)] hover:bg-[var(--accent-danger)]/10 rounded"
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Common Patterns Reference */}
      <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          よく使うパターン
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-[var(--bg-primary)] rounded">
            <p className="text-[var(--text-primary)] font-medium">IPアドレス</p>
            <code className="text-xs text-[var(--text-muted)] font-mono">
              {`(?<ip>\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3})`}
            </code>
          </div>
          <div className="p-3 bg-[var(--bg-primary)] rounded">
            <p className="text-[var(--text-primary)] font-medium">メールアドレス</p>
            <code className="text-xs text-[var(--text-muted)] font-mono">
              {`(?<email>[\\w.-]+@[\\w.-]+\\.[a-z]{2,})`}
            </code>
          </div>
          <div className="p-3 bg-[var(--bg-primary)] rounded">
            <p className="text-[var(--text-primary)] font-medium">HTTPステータス</p>
            <code className="text-xs text-[var(--text-muted)] font-mono">
              {`"\\s(?<status>\\d{3})\\s`}
            </code>
          </div>
          <div className="p-3 bg-[var(--bg-primary)] rounded">
            <p className="text-[var(--text-primary)] font-medium">数値</p>
            <code className="text-xs text-[var(--text-muted)] font-mono">
              {`(?<number>\\d+\\.?\\d*)`}
            </code>
          </div>
        </div>
      </div>

      {/* Create Field Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--bg-secondary)] rounded-lg p-6 w-full max-w-lg mx-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              新規フィールド抽出ルール
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">
                  フィールド名
                </label>
                <input
                  type="text"
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                  placeholder="例: client_ip"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">
                  正規表現パターン
                </label>
                <input
                  type="text"
                  value={newFieldPattern}
                  onChange={(e) => setNewFieldPattern(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] font-mono text-sm focus:border-[var(--accent-primary)] focus:outline-none"
                  placeholder={`例: (?<ip>\\d+\\.\\d+\\.\\d+\\.\\d+)`}
                />
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  名前付きキャプチャグループ (?&lt;name&gt;...) を使用
                </p>
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">
                  フィールド型
                </label>
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value as FieldExtraction["type"])}
                  className="w-full px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none"
                >
                  <option value="string">文字列</option>
                  <option value="number">数値</option>
                  <option value="date">日付</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-1">
                  テスト文字列
                </label>
                <textarea
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  className="w-full h-20 px-3 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] focus:outline-none resize-none"
                  placeholder="パターンをテストするテキストを入力"
                />
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleTestPattern}
                    className="px-3 py-1 text-sm bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded hover:bg-[var(--bg-hover)]"
                  >
                    テスト
                  </button>
                  {testResult && (
                    <span className={`text-sm ${testResult.startsWith("マッチ") ? "text-[var(--accent-secondary)]" : "text-[var(--accent-danger)]"}`}>
                      {testResult}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setTestText("");
                  setTestResult(null);
                }}
                className="px-4 py-2 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] rounded"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleCreateField}
                disabled={!newFieldName.trim() || !newFieldPattern.trim()}
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

function FieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );
}
