# Next.js App Router ベストプラクティス

本プロジェクトで採用するNext.js App Routerの設計・実装ガイドラインを定義する。

## プロジェクト構成

```
src/
├── app/                    # App Router（ルーティング）
│   ├── (routes)/          # ルートグループ
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   ├── loading.tsx
│   │   └── error.tsx
│   ├── api/               # Route Handlers
│   └── globals.css
├── components/            # コンポーネント
│   ├── ui/               # 汎用UIコンポーネント（Button, Card等）
│   ├── layout/           # レイアウトコンポーネント（Header, Sidebar等）
│   └── features/         # 機能別コンポーネント
├── lib/                   # ユーティリティ・ヘルパー
│   ├── db/               # データベース関連
│   ├── utils/            # 汎用ユーティリティ
│   └── constants/        # 定数定義
├── hooks/                 # カスタムフック
├── types/                 # TypeScript型定義
└── actions/               # Server Actions
```

## Server Components vs Client Components

### Server Components（デフォルト）

以下の場合はServer Componentsを使用する：

- データフェッチング
- データベースへの直接アクセス
- 環境変数（シークレット）へのアクセス
- 大きな依存関係を使用する処理
- SEOが重要なコンテンツ

```tsx
// Server Component（デフォルト）
async function SearchResults({ query }: { query: string }) {
  const results = await db.logs.search(query);
  return <ResultTable data={results} />;
}
```

### Client Components

以下の場合は`"use client"`を使用する：

- イベントハンドラ（onClick, onChange等）
- useState, useEffect等のReact Hooks
- ブラウザAPI（localStorage, window等）
- インタラクティブなUI

```tsx
"use client";

import { useState } from "react";

export function SearchInput({ onSearch }: { onSearch: (q: string) => void }) {
  const [query, setQuery] = useState("");
  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && onSearch(query)}
    />
  );
}
```

### 重要なルール

1. **`"use client"`はできるだけ末端に配置する**
   - 高い階層に配置するとサブツリー全体がClient Componentになる
   - インタラクティブな部分だけを分離する

2. **Server ComponentからClient Componentをimportする**
   - Client ComponentからServer Componentをimportしない
   - propsとしてchildren経由で渡す

```tsx
// Good: Server Component内でClient Componentを使用
import { InteractiveChart } from "@/components/features/chart";

export default async function DashboardPage() {
  const data = await fetchData();
  return <InteractiveChart data={data} />;
}
```

## データフェッチング

### Server Componentsでのフェッチ

```tsx
// Server Component内で直接fetchまたはDB呼び出し
async function LogList() {
  const logs = await db.logs.findMany({ take: 100 });
  return <LogTable logs={logs} />;
}
```

### キャッシュ戦略

Next.js 15ではデフォルトでキャッシュされない。明示的に設定する：

```tsx
// キャッシュを有効にする
const data = await fetch(url, { cache: "force-cache" });

// 再検証間隔を設定（ISR）
const data = await fetch(url, { next: { revalidate: 60 } });

// キャッシュしない
const data = await fetch(url, { cache: "no-store" });
```

### 並列データフェッチ

```tsx
async function Dashboard() {
  // 並列実行
  const [stats, alerts, logs] = await Promise.all([
    fetchStats(),
    fetchAlerts(),
    fetchRecentLogs(),
  ]);

  return (
    <>
      <StatsPanel stats={stats} />
      <AlertsPanel alerts={alerts} />
      <LogsPanel logs={logs} />
    </>
  );
}
```

## Server Actions

データの更新にはServer Actionsを使用する。

### 定義

```tsx
// src/actions/logs.ts
"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function uploadLogs(formData: FormData) {
  const file = formData.get("file") as File;
  // 処理...

  revalidatePath("/data");
  return { success: true };
}
```

### 使用

```tsx
"use client";

import { uploadLogs } from "@/actions/logs";

export function UploadForm() {
  return (
    <form action={uploadLogs}>
      <input type="file" name="file" />
      <button type="submit">Upload</button>
    </form>
  );
}
```

## ルーティング規約

### ファイル規約

| ファイル | 用途 |
|---------|------|
| `page.tsx` | ルートのUI |
| `layout.tsx` | 共有レイアウト |
| `loading.tsx` | ローディングUI（Suspense） |
| `error.tsx` | エラーバウンダリ |
| `not-found.tsx` | 404ページ |
| `route.ts` | API Route Handler |

### 動的ルート

```
app/
├── dashboards/
│   ├── page.tsx           # /dashboards
│   └── [id]/
│       └── page.tsx       # /dashboards/:id
```

### ルートグループ

URLに影響を与えずにルートを整理：

```
app/
├── (main)/
│   ├── layout.tsx         # メインレイアウト
│   ├── page.tsx           # /
│   ├── search/
│   └── dashboards/
└── (settings)/
    ├── layout.tsx         # 設定用レイアウト
    └── settings/
```

## コンポーネント設計

### UIコンポーネント

- 汎用的で再利用可能
- ビジネスロジックを含まない
- propsで制御可能

```tsx
// src/components/ui/button.tsx
interface ButtonProps {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  onClick?: () => void;
}

export function Button({ variant = "primary", size = "md", children, onClick }: ButtonProps) {
  return (
    <button className={`btn btn-${variant} btn-${size}`} onClick={onClick}>
      {children}
    </button>
  );
}
```

### 機能コンポーネント

- 特定の機能に特化
- 必要に応じてServer/Client Componentを選択
- 関連するロジックをカプセル化

```tsx
// src/components/features/search/search-bar.tsx
"use client";

export function SearchBar() {
  // 検索に特化したロジック
}
```

## エラーハンドリング

### error.tsx

```tsx
"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

### Server Actionsでのエラー

```tsx
"use server";

export async function createAlert(formData: FormData) {
  try {
    // 処理
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to create alert" };
  }
}
```

## パフォーマンス最適化

### Streaming & Suspense

```tsx
import { Suspense } from "react";

export default function SearchPage() {
  return (
    <div>
      <SearchInput />
      <Suspense fallback={<ResultsSkeleton />}>
        <SearchResults />
      </Suspense>
    </div>
  );
}
```

### loading.tsx

```tsx
// app/search/loading.tsx
export default function Loading() {
  return <div className="animate-pulse">Loading...</div>;
}
```

### Dynamic Import

大きなコンポーネントは動的インポート：

```tsx
import dynamic from "next/dynamic";

const Chart = dynamic(() => import("@/components/features/chart"), {
  loading: () => <ChartSkeleton />,
  ssr: false, // ブラウザAPIを使用する場合
});
```

## 型安全性

### 共通型定義

```tsx
// src/types/index.ts
export interface Log {
  id: string;
  timestamp: Date;
  source: string;
  message: string;
  level: "info" | "warn" | "error";
}

export interface SearchParams {
  query?: string;
  from?: string;
  to?: string;
  limit?: number;
}
```

### Page Props

```tsx
interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { query } = await searchParams;
  // ...
}
```

## 避けるべきパターン

1. **layoutでcookies/headersを読む** → 動的レンダリングを強制してしまう
2. **深すぎるネスト** → 最大4階層程度に抑える
3. **appディレクトリに全コードを配置** → components, lib等に分離
4. **Server ComponentからRoute Handlerを呼ぶ** → 直接DB/APIを呼ぶ
5. **大きなClient Component** → 小さなクライアントアイランドに分割

## 参考

- [Next.js Documentation](https://nextjs.org/docs/app)
- [Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Caching and Revalidating](https://nextjs.org/docs/app/getting-started/caching-and-revalidating)
