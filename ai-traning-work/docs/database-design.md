# データベース設計書

## 概要

- **DBMS**: SQLite (Turso)
- **ORM**: Drizzle ORM
- **接続**: libSQL client

## ER図

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ log_sources │     │    logs     │     │   fields    │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id (PK)     │←────│ source_id   │     │ id (PK)     │
│ name        │     │ id (PK)     │     │ source_id   │
│ type        │     │ timestamp   │     │ name        │
│ format      │     │ raw         │     │ pattern     │
│ created_at  │     │ parsed      │     │ created_at  │
└─────────────┘     │ level       │     └─────────────┘
                    │ created_at  │
                    └─────────────┘
                           │
                           ↓
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ dashboards  │     │   panels    │     │   alerts    │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id (PK)     │←────│dashboard_id │     │ id (PK)     │
│ name        │     │ id (PK)     │     │ name        │
│ description │     │ title       │     │ query       │
│ created_at  │     │ type        │     │ condition   │
│ updated_at  │     │ query       │     │ threshold   │
└─────────────┘     │ config      │     │ enabled     │
                    │ position    │     │ created_at  │
                    │ created_at  │     └─────────────┘
                    └─────────────┘            │
                                               ↓
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│saved_searches│    │search_history│    │alert_history│
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id (PK)     │     │ id (PK)     │     │ id (PK)     │
│ name        │     │ query       │     │ alert_id    │
│ query       │     │ executed_at │     │ triggered_at│
│ description │     │ result_count│     │ message     │
│ created_at  │     └─────────────┘     │ data        │
└─────────────┘                         └─────────────┘

┌─────────────┐     ┌─────────────┐
│  lookups    │     │practice_progress│
├─────────────┤     ├─────────────┤
│ id (PK)     │     │ id (PK)     │
│ name        │     │ problem_id  │
│ data (JSON) │     │ status      │
│ created_at  │     │ last_answer │
└─────────────┘     │ completed_at│
                    └─────────────┘
```

## テーブル定義

### log_sources（ログソース）

ログの取り込み元を管理する。

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | TEXT | PK | UUID |
| name | TEXT | NOT NULL | ソース名 |
| type | TEXT | NOT NULL | ログ種別（web, app, system, gc, k8s, db） |
| format | TEXT | NOT NULL | フォーマット（apache, nginx, json, syslog, gc, k8s, mysql） |
| config | TEXT | | 追加設定（JSON） |
| created_at | INTEGER | NOT NULL | 作成日時（Unix timestamp） |

```sql
CREATE TABLE log_sources (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('web', 'app', 'system', 'gc', 'k8s', 'db')),
  format TEXT NOT NULL,
  config TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
```

### logs（ログデータ）

取り込んだログを格納する。

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | TEXT | PK | UUID |
| source_id | TEXT | FK | ログソースID |
| timestamp | INTEGER | NOT NULL, INDEX | ログのタイムスタンプ |
| raw | TEXT | NOT NULL | 生ログ |
| parsed | TEXT | | パース済みデータ（JSON） |
| level | TEXT | | ログレベル（info, warn, error, debug） |
| created_at | INTEGER | NOT NULL | 取り込み日時 |

```sql
CREATE TABLE logs (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL REFERENCES log_sources(id) ON DELETE CASCADE,
  timestamp INTEGER NOT NULL,
  raw TEXT NOT NULL,
  parsed TEXT,
  level TEXT CHECK (level IN ('info', 'warn', 'error', 'debug')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_logs_timestamp ON logs(timestamp);
CREATE INDEX idx_logs_source_id ON logs(source_id);
CREATE INDEX idx_logs_level ON logs(level);
```

### fields（フィールド抽出ルール）

カスタムフィールド抽出の定義。

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | TEXT | PK | UUID |
| source_id | TEXT | FK | 対象ログソースID（NULLは全ソース） |
| name | TEXT | NOT NULL | フィールド名 |
| pattern | TEXT | NOT NULL | 正規表現パターン |
| type | TEXT | NOT NULL | 抽出値の型（string, number, date） |
| created_at | INTEGER | NOT NULL | 作成日時 |

```sql
CREATE TABLE fields (
  id TEXT PRIMARY KEY,
  source_id TEXT REFERENCES log_sources(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  pattern TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'string' CHECK (type IN ('string', 'number', 'date')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
```

### dashboards（ダッシュボード）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | TEXT | PK | UUID |
| name | TEXT | NOT NULL | ダッシュボード名 |
| description | TEXT | | 説明 |
| created_at | INTEGER | NOT NULL | 作成日時 |
| updated_at | INTEGER | NOT NULL | 更新日時 |

```sql
CREATE TABLE dashboards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
```

### panels（ダッシュボードパネル）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | TEXT | PK | UUID |
| dashboard_id | TEXT | FK, NOT NULL | ダッシュボードID |
| title | TEXT | NOT NULL | パネルタイトル |
| type | TEXT | NOT NULL | チャート種別 |
| query | TEXT | NOT NULL | SPLクエリ |
| config | TEXT | | チャート設定（JSON） |
| position | TEXT | NOT NULL | 位置・サイズ（JSON: {x, y, w, h}） |
| drilldown | TEXT | | ドリルダウン設定（JSON） |
| created_at | INTEGER | NOT NULL | 作成日時 |

```sql
CREATE TABLE panels (
  id TEXT PRIMARY KEY,
  dashboard_id TEXT NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('line', 'bar', 'pie', 'table', 'single')),
  query TEXT NOT NULL,
  config TEXT,
  position TEXT NOT NULL,
  drilldown TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
```

### alerts（アラート設定）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | TEXT | PK | UUID |
| name | TEXT | NOT NULL | アラート名 |
| query | TEXT | NOT NULL | SPLクエリ |
| condition | TEXT | NOT NULL | 条件（gt, lt, eq, ne） |
| threshold | REAL | NOT NULL | 閾値 |
| enabled | INTEGER | NOT NULL | 有効フラグ（0/1） |
| created_at | INTEGER | NOT NULL | 作成日時 |

```sql
CREATE TABLE alerts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  query TEXT NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('gt', 'lt', 'eq', 'ne', 'gte', 'lte')),
  threshold REAL NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
```

### alert_history（アラート履歴）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | TEXT | PK | UUID |
| alert_id | TEXT | FK, NOT NULL | アラートID |
| triggered_at | INTEGER | NOT NULL | 発火日時 |
| message | TEXT | NOT NULL | アラートメッセージ |
| data | TEXT | | 関連データ（JSON） |

```sql
CREATE TABLE alert_history (
  id TEXT PRIMARY KEY,
  alert_id TEXT NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  triggered_at INTEGER NOT NULL,
  message TEXT NOT NULL,
  data TEXT
);

CREATE INDEX idx_alert_history_triggered_at ON alert_history(triggered_at);
```

### saved_searches（保存済み検索）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | TEXT | PK | UUID |
| name | TEXT | NOT NULL | 検索名 |
| query | TEXT | NOT NULL | SPLクエリ |
| description | TEXT | | 説明 |
| created_at | INTEGER | NOT NULL | 作成日時 |

```sql
CREATE TABLE saved_searches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  query TEXT NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
```

### search_history（検索履歴）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | TEXT | PK | UUID |
| query | TEXT | NOT NULL | SPLクエリ |
| executed_at | INTEGER | NOT NULL | 実行日時 |
| result_count | INTEGER | | 結果件数 |

```sql
CREATE TABLE search_history (
  id TEXT PRIMARY KEY,
  query TEXT NOT NULL,
  executed_at INTEGER NOT NULL DEFAULT (unixepoch()),
  result_count INTEGER
);

CREATE INDEX idx_search_history_executed_at ON search_history(executed_at);
```

### lookups（ルックアップテーブル）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | TEXT | PK | UUID |
| name | TEXT | NOT NULL, UNIQUE | ルックアップ名 |
| data | TEXT | NOT NULL | データ（JSON配列） |
| created_at | INTEGER | NOT NULL | 作成日時 |

```sql
CREATE TABLE lookups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  data TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
```

### practice_progress（練習問題進捗）

| カラム | 型 | 制約 | 説明 |
|--------|-----|------|------|
| id | TEXT | PK | UUID |
| problem_id | TEXT | NOT NULL, UNIQUE | 問題ID |
| status | TEXT | NOT NULL | 状態（not_started, in_progress, completed） |
| last_answer | TEXT | | 最後の回答 |
| completed_at | INTEGER | | 完了日時 |

```sql
CREATE TABLE practice_progress (
  id TEXT PRIMARY KEY,
  problem_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  last_answer TEXT,
  completed_at INTEGER
);
```

## インデックス戦略

### 検索性能向上

```sql
-- ログの時間範囲検索
CREATE INDEX idx_logs_timestamp ON logs(timestamp);

-- ソース別検索
CREATE INDEX idx_logs_source_id ON logs(source_id);

-- レベル別検索
CREATE INDEX idx_logs_level ON logs(level);

-- 複合インデックス（時間範囲 + ソース）
CREATE INDEX idx_logs_source_timestamp ON logs(source_id, timestamp);
```

### 全文検索（FTS5）

大量ログの検索にはSQLite FTS5を使用：

```sql
CREATE VIRTUAL TABLE logs_fts USING fts5(
  raw,
  content='logs',
  content_rowid='rowid'
);

-- 同期トリガー
CREATE TRIGGER logs_ai AFTER INSERT ON logs BEGIN
  INSERT INTO logs_fts(rowid, raw) VALUES (new.rowid, new.raw);
END;
```

## マイグレーション

Drizzle ORMのマイグレーション機能を使用：

```bash
# マイグレーション生成
npx drizzle-kit generate

# マイグレーション実行
npx drizzle-kit migrate
```

## データ量の考慮

### 制限事項

- ログ保持期間: デフォルト30日（設定で変更可能）
- 1回の取り込み上限: 100,000行
- 検索結果上限: 10,000行

### クリーンアップ

```sql
-- 古いログの削除（30日以上前）
DELETE FROM logs WHERE timestamp < unixepoch() - 2592000;

-- 古い検索履歴の削除（100件を超えた分）
DELETE FROM search_history
WHERE id NOT IN (
  SELECT id FROM search_history ORDER BY executed_at DESC LIMIT 100
);
```
