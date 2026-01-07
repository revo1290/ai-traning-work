"use client";

import Link from "next/link";
import { useAppStore } from "@/lib/store";

export default function HomePage() {
  const { logs, sources, dashboards, alerts, alertHistory, searchHistory } = useAppStore();

  // 過去24時間のイベント数を計算
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const todayEvents = logs.filter(
    (log) => new Date(log.timestamp).getTime() > oneDayAgo
  ).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          ホーム
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Splunk Training Tool へようこそ
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="総ログ数"
          value={logs.length.toLocaleString()}
          description="取り込み済みログ"
          color="primary"
        />
        <StatCard
          title="今日のイベント"
          value={todayEvents.toLocaleString()}
          description="過去24時間"
          color="info"
        />
        <StatCard
          title="データソース"
          value={sources.length.toString()}
          description="アクティブ"
          color="secondary"
        />
        <StatCard
          title="アラート"
          value={alertHistory.length.toString()}
          description="発火件数"
          color="danger"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Searches */}
        <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            最近の検索
          </h2>
          {searchHistory.length === 0 ? (
            <div className="text-[var(--text-muted)] text-sm py-8 text-center">
              検索履歴がありません
            </div>
          ) : (
            <div className="space-y-2">
              {searchHistory.slice(0, 5).map((item) => (
                <Link
                  key={item.id}
                  href="/search"
                  className="block p-2 rounded hover:bg-[var(--bg-hover)] transition-colors no-underline"
                >
                  <p className="text-sm font-mono text-[var(--text-primary)] truncate">
                    {item.query}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {item.resultCount} 件 • {new Date(item.executedAt).toLocaleString("ja-JP")}
                  </p>
                </Link>
              ))}
            </div>
          )}
          <Link
            href="/search"
            className="block text-center text-sm text-[var(--accent-info)] hover:underline mt-4"
          >
            検索を開始 →
          </Link>
        </div>

        {/* Quick Links */}
        <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            クイックアクセス
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <QuickLink
              href="/data"
              title="データ取り込み"
              description="ログファイルをアップロード"
            />
            <QuickLink
              href="/dashboards"
              title="ダッシュボード"
              description={`${dashboards.length} 個作成済み`}
            />
            <QuickLink
              href="/practice"
              title="練習問題"
              description="SPLを学習"
            />
            <QuickLink
              href="/alerts"
              title="アラート設定"
              description={`${alerts.length} 個設定済み`}
            />
          </div>
        </div>
      </div>

      {/* Getting Started */}
      <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          はじめに
        </h2>
        <div className="space-y-4">
          <Step
            number={1}
            title="サンプルデータを読み込む"
            description="データ取り込み画面から、サンプルデータを読み込んで学習を始めましょう。"
            href="/data"
            completed={logs.length > 0}
          />
          <Step
            number={2}
            title="検索を実行"
            description="SPLクエリを使用してログを検索・分析します。"
            href="/search"
            completed={searchHistory.length > 0}
          />
          <Step
            number={3}
            title="ダッシュボードを作成"
            description="検索結果を可視化してダッシュボードにまとめます。"
            href="/dashboards"
            completed={dashboards.length > 0}
          />
          <Step
            number={4}
            title="練習問題に挑戦"
            description="練習問題でSPLクエリのスキルを磨きましょう。"
            href="/practice"
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  color,
}: {
  title: string;
  value: string;
  description: string;
  color: "primary" | "info" | "secondary" | "danger";
}) {
  const colorClasses = {
    primary: "text-[var(--accent-primary)]",
    info: "text-[var(--accent-info)]",
    secondary: "text-[var(--accent-secondary)]",
    danger: "text-[var(--accent-danger)]",
  };

  return (
    <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-4">
      <p className="text-sm text-[var(--text-secondary)]">{title}</p>
      <p className={`text-3xl font-bold mt-1 ${colorClasses[color]}`}>{value}</p>
      <p className="text-xs text-[var(--text-muted)] mt-1">{description}</p>
    </div>
  );
}

function QuickLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="block p-3 bg-[var(--bg-primary)] rounded border border-[var(--border-color)] hover:border-[var(--accent-primary)] transition-colors no-underline"
    >
      <p className="text-sm font-medium text-[var(--text-primary)]">{title}</p>
      <p className="text-xs text-[var(--text-muted)] mt-1">{description}</p>
    </Link>
  );
}

function Step({
  number,
  title,
  description,
  href,
  completed,
}: {
  number: number;
  title: string;
  description: string;
  href: string;
  completed?: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-4 p-3 rounded hover:bg-[var(--bg-hover)] transition-colors no-underline"
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
          completed
            ? "bg-[var(--accent-secondary)] text-[var(--bg-primary)]"
            : "bg-[var(--accent-primary)] text-[var(--bg-primary)]"
        }`}
      >
        {completed ? "✓" : number}
      </div>
      <div>
        <p className="font-medium text-[var(--text-primary)]">{title}</p>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          {description}
        </p>
      </div>
    </Link>
  );
}
