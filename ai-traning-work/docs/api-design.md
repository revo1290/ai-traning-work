# API設計書

## 概要

本プロジェクトではNext.js App Routerの機能を活用し、以下の方式でAPIを実装する：

- **Server Actions**: データの作成・更新・削除（mutation）
- **Route Handlers**: データの取得（GET）、ファイルダウンロード、外部連携

## Server Actions

### ログ関連

#### `uploadLogs`

ログファイルをアップロードして取り込む。

```typescript
// src/actions/logs.ts
"use server";

interface UploadLogsResult {
  success: boolean;
  sourceId?: string;
  count?: number;
  error?: string;
}

export async function uploadLogs(formData: FormData): Promise<UploadLogsResult>
```

**Parameters (FormData)**:
| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| file | File | Yes | ログファイル |
| name | string | Yes | ソース名 |
| type | string | Yes | ログ種別 |
| format | string | No | フォーマット（自動検出） |

#### `deleteLogSource`

ログソースと関連ログを削除する。

```typescript
export async function deleteLogSource(sourceId: string): Promise<{ success: boolean; error?: string }>
```

#### `loadSampleData`

サンプルデータを読み込む。

```typescript
export async function loadSampleData(type: 'web' | 'app' | 'security' | 'gc' | 'k8s' | 'db' | 'all'): Promise<{ success: boolean; count?: number; error?: string }>
```

---

### 検索関連

#### `executeSearch`

SPLクエリを実行する。

```typescript
// src/actions/search.ts
"use server";

interface SearchResult {
  success: boolean;
  data?: LogRecord[];
  fields?: string[];
  count?: number;
  executionTime?: number;
  error?: string;
}

export async function executeSearch(
  query: string,
  timeRange: { from: number; to: number }
): Promise<SearchResult>
```

#### `saveSearch`

検索を保存する。

```typescript
export async function saveSearch(data: {
  name: string;
  query: string;
  description?: string;
}): Promise<{ success: boolean; id?: string; error?: string }>
```

#### `deleteSavedSearch`

保存済み検索を削除する。

```typescript
export async function deleteSavedSearch(id: string): Promise<{ success: boolean; error?: string }>
```

---

### ダッシュボード関連

#### `createDashboard`

ダッシュボードを作成する。

```typescript
// src/actions/dashboards.ts
"use server";

export async function createDashboard(data: {
  name: string;
  description?: string;
}): Promise<{ success: boolean; id?: string; error?: string }>
```

#### `updateDashboard`

ダッシュボードを更新する。

```typescript
export async function updateDashboard(
  id: string,
  data: { name?: string; description?: string }
): Promise<{ success: boolean; error?: string }>
```

#### `deleteDashboard`

ダッシュボードを削除する。

```typescript
export async function deleteDashboard(id: string): Promise<{ success: boolean; error?: string }>
```

#### `createPanel`

パネルを作成する。

```typescript
export async function createPanel(data: {
  dashboardId: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'table' | 'single';
  query: string;
  config?: PanelConfig;
  position: { x: number; y: number; w: number; h: number };
}): Promise<{ success: boolean; id?: string; error?: string }>
```

#### `updatePanel`

パネルを更新する。

```typescript
export async function updatePanel(
  id: string,
  data: Partial<Panel>
): Promise<{ success: boolean; error?: string }>
```

#### `deletePanel`

パネルを削除する。

```typescript
export async function deletePanel(id: string): Promise<{ success: boolean; error?: string }>
```

#### `updatePanelPositions`

複数パネルの位置を一括更新する。

```typescript
export async function updatePanelPositions(
  updates: Array<{ id: string; position: { x: number; y: number; w: number; h: number } }>
): Promise<{ success: boolean; error?: string }>
```

---

### アラート関連

#### `createAlert`

アラートを作成する。

```typescript
// src/actions/alerts.ts
"use server";

export async function createAlert(data: {
  name: string;
  query: string;
  condition: 'gt' | 'lt' | 'eq' | 'ne' | 'gte' | 'lte';
  threshold: number;
}): Promise<{ success: boolean; id?: string; error?: string }>
```

#### `updateAlert`

アラートを更新する。

```typescript
export async function updateAlert(
  id: string,
  data: Partial<Alert>
): Promise<{ success: boolean; error?: string }>
```

#### `deleteAlert`

アラートを削除する。

```typescript
export async function deleteAlert(id: string): Promise<{ success: boolean; error?: string }>
```

#### `toggleAlert`

アラートの有効/無効を切り替える。

```typescript
export async function toggleAlert(id: string): Promise<{ success: boolean; enabled?: boolean; error?: string }>
```

---

### フィールド抽出関連

#### `createFieldRule`

フィールド抽出ルールを作成する。

```typescript
// src/actions/fields.ts
"use server";

export async function createFieldRule(data: {
  sourceId?: string;
  name: string;
  pattern: string;
  type: 'string' | 'number' | 'date';
}): Promise<{ success: boolean; id?: string; error?: string }>
```

#### `updateFieldRule`

フィールド抽出ルールを更新する。

```typescript
export async function updateFieldRule(
  id: string,
  data: Partial<FieldRule>
): Promise<{ success: boolean; error?: string }>
```

#### `deleteFieldRule`

フィールド抽出ルールを削除する。

```typescript
export async function deleteFieldRule(id: string): Promise<{ success: boolean; error?: string }>
```

#### `testFieldRule`

フィールド抽出ルールをテストする。

```typescript
export async function testFieldRule(data: {
  pattern: string;
  sampleLogs: string[];
}): Promise<{ success: boolean; results?: Array<{ log: string; extracted: string | null }>; error?: string }>
```

---

### ルックアップ関連

#### `createLookup`

ルックアップテーブルを作成する。

```typescript
// src/actions/lookups.ts
"use server";

export async function createLookup(data: {
  name: string;
  data: Record<string, unknown>[];
}): Promise<{ success: boolean; id?: string; error?: string }>
```

#### `updateLookup`

ルックアップテーブルを更新する。

```typescript
export async function updateLookup(
  id: string,
  data: Record<string, unknown>[]
): Promise<{ success: boolean; error?: string }>
```

#### `deleteLookup`

ルックアップテーブルを削除する。

```typescript
export async function deleteLookup(id: string): Promise<{ success: boolean; error?: string }>
```

---

### 練習問題関連

#### `submitAnswer`

練習問題の回答を提出する。

```typescript
// src/actions/practice.ts
"use server";

interface SubmitAnswerResult {
  success: boolean;
  correct: boolean;
  feedback?: string;
  expectedResult?: unknown;
  actualResult?: unknown;
  error?: string;
}

export async function submitAnswer(data: {
  problemId: string;
  query: string;
}): Promise<SubmitAnswerResult>
```

#### `resetProgress`

練習問題の進捗をリセットする。

```typescript
export async function resetProgress(): Promise<{ success: boolean; error?: string }>
```

---

### 設定関連

#### `updateSettings`

アプリケーション設定を更新する。

```typescript
// src/actions/settings.ts
"use server";

export async function updateSettings(data: {
  retentionDays?: number;
  theme?: 'dark' | 'light';
}): Promise<{ success: boolean; error?: string }>
```

#### `clearAllData`

全データを初期化する。

```typescript
export async function clearAllData(): Promise<{ success: boolean; error?: string }>
```

---

## Route Handlers

### GET /api/search/export

検索結果をエクスポートする。

```typescript
// src/app/api/search/export/route.ts
export async function GET(request: Request)
```

**Query Parameters**:
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| query | string | Yes | SPLクエリ（URLエンコード） |
| from | number | Yes | 開始時刻（Unix timestamp） |
| to | number | Yes | 終了時刻（Unix timestamp） |
| format | string | No | 出力形式（csv, json） |

**Response**: ファイルダウンロード

---

### GET /api/dashboards

ダッシュボード一覧を取得する。

```typescript
// src/app/api/dashboards/route.ts
export async function GET(request: Request)
```

**Response**:
```json
{
  "dashboards": [
    {
      "id": "uuid",
      "name": "Dashboard Name",
      "description": "Description",
      "panelCount": 5,
      "createdAt": 1234567890,
      "updatedAt": 1234567890
    }
  ]
}
```

---

### GET /api/dashboards/[id]

ダッシュボード詳細を取得する。

```typescript
// src/app/api/dashboards/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
)
```

**Response**:
```json
{
  "id": "uuid",
  "name": "Dashboard Name",
  "description": "Description",
  "panels": [
    {
      "id": "uuid",
      "title": "Panel Title",
      "type": "line",
      "query": "search * | stats count by host",
      "config": {},
      "position": { "x": 0, "y": 0, "w": 6, "h": 4 }
    }
  ],
  "createdAt": 1234567890,
  "updatedAt": 1234567890
}
```

---

### GET /api/alerts

アラート一覧を取得する。

```typescript
// src/app/api/alerts/route.ts
export async function GET(request: Request)
```

---

### GET /api/alerts/history

アラート履歴を取得する。

```typescript
// src/app/api/alerts/history/route.ts
export async function GET(request: Request)
```

**Query Parameters**:
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| alertId | string | No | 特定アラートのみ |
| limit | number | No | 取得件数（default: 50） |

---

### GET /api/search/history

検索履歴を取得する。

```typescript
// src/app/api/search/history/route.ts
export async function GET(request: Request)
```

---

### GET /api/search/saved

保存済み検索一覧を取得する。

```typescript
// src/app/api/search/saved/route.ts
export async function GET(request: Request)
```

---

### GET /api/sources

ログソース一覧を取得する。

```typescript
// src/app/api/sources/route.ts
export async function GET(request: Request)
```

---

### GET /api/fields

フィールド抽出ルール一覧を取得する。

```typescript
// src/app/api/fields/route.ts
export async function GET(request: Request)
```

---

### GET /api/lookups

ルックアップテーブル一覧を取得する。

```typescript
// src/app/api/lookups/route.ts
export async function GET(request: Request)
```

---

### GET /api/lookups/[name]

ルックアップテーブルのデータを取得する。

```typescript
// src/app/api/lookups/[name]/route.ts
export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
)
```

---

### GET /api/practice/problems

練習問題一覧を取得する。

```typescript
// src/app/api/practice/problems/route.ts
export async function GET(request: Request)
```

**Query Parameters**:
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| difficulty | string | No | 難易度フィルター（beginner, intermediate） |

---

### GET /api/practice/progress

練習問題の進捗を取得する。

```typescript
// src/app/api/practice/progress/route.ts
export async function GET(request: Request)
```

---

### GET /api/stats

統計情報を取得する。

```typescript
// src/app/api/stats/route.ts
export async function GET(request: Request)
```

**Response**:
```json
{
  "totalLogs": 50000,
  "todayEvents": 1234,
  "sources": 5,
  "dashboards": 3,
  "alerts": {
    "total": 5,
    "triggered": 2
  }
}
```

---

### GET /api/spl/help

SPLコマンドのヘルプ情報を取得する。

```typescript
// src/app/api/spl/help/route.ts
export async function GET(request: Request)
```

**Query Parameters**:
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| command | string | No | 特定コマンドのヘルプ |

---

### GET /api/spl/templates

SPLテンプレート一覧を取得する。

```typescript
// src/app/api/spl/templates/route.ts
export async function GET(request: Request)
```

---

## エラーレスポンス

### 共通エラー形式

```typescript
interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
}
```

### エラーコード

| コード | 説明 |
|--------|------|
| INVALID_INPUT | 入力値が不正 |
| NOT_FOUND | リソースが見つからない |
| SPL_SYNTAX_ERROR | SPLクエリの構文エラー |
| SPL_EXECUTION_ERROR | SPLクエリの実行エラー |
| FILE_TOO_LARGE | ファイルサイズ超過 |
| UNSUPPORTED_FORMAT | サポートされていないフォーマット |
| DATABASE_ERROR | データベースエラー |

---

## レート制限

開発・トレーニング環境のため、レート制限は設けない。
