# Splunk Training Tool - タスク管理

## 進捗サマリー
- 開始日: 2026-01-08
- 最終更新: 2026-01-09
- ステータス: 継続開発中

## タスク一覧

### 1. データ基盤
- [x] サンプルデータ生成機能
- [x] データ読み込み・保存機能 (Zustand + localStorage)
- [x] データベーススキーマ (Drizzle ORM)

### 2. SPL実行エンジン
- [x] SPL実行エンジン (Executor) 実装
- [x] 基本コマンド (search, where, table, sort, head, tail, dedup, fields)
- [x] 統計コマンド (stats, eventstats, streamstats, top, rare, timechart, chart, addtotals)
- [x] 変換コマンド (eval, rex, rename, spath, fillnull, replace, convert, bin)
- [x] マルチバリューコマンド (makemv, mvexpand)
- [x] 結合コマンド (lookup, inputlookup, join, append, transaction)
- [x] ユーティリティコマンド (makeresults, regex, format, return, reverse, uniq)

### 3. Eval関数 (50+関数)
- [x] 文字列関数 (len, lower, upper, trim, substr, replace, split, mvjoin, urldecode/urlencode)
- [x] 数値関数 (abs, ceil, floor, round, sqrt, pow, exp, ln, log)
- [x] 条件関数 (if, case, coalesce, nullif, isnull, isnotnull, isnum, isstr, isint)
- [x] 日時関数 (now, time, strftime, strptime, relative_time)
- [x] マルチバリュー関数 (mvcount, mvindex, mvfilter, mvfind, mvappend, mvdedup, mvsort)
- [x] JSON関数 (json_extract, json_keys, json_object, json_array, json_valid)
- [x] 暗号化関数 (md5, sha1, sha256, sha512)

### 4. エラーハンドリング
- [x] 詳細なエラークラス階層
- [x] Levenshtein距離によるサジェスト機能
- [x] タイムアウト・メモリ制限エラー
- [x] ReDoS対策

### 5. 検索機能
- [x] 検索ページのインタラクティブ化
- [x] クエリ実行・結果表示
- [x] 検索履歴保存
- [x] 保存済み検索機能
- [x] エラーメッセージとサジェスト表示

### 6. ダッシュボード
- [x] ダッシュボード一覧表示
- [x] ダッシュボード作成・編集
- [x] パネル追加・可視化 (Recharts連携: 棒グラフ, 折れ線, 円グラフ, テーブル, シングル値)

### 7. アラート
- [x] アラート一覧表示
- [x] アラート作成・編集・削除
- [x] アラート履歴表示

### 8. フィールド管理
- [x] フィールド抽出ルール管理
- [x] 正規表現テスト機能
- [x] よく使うパターンリファレンス

### 9. 練習問題
- [x] 練習問題データ定義 (8問: 初級4問、中級4問)
- [x] 練習問題UI実装
- [x] 進捗管理
- [x] ヒント・回答表示機能

### 10. 設定
- [x] 設定ページ実装
- [x] データ統計表示
- [x] エクスポート機能
- [x] リセット機能

### 11. UI改善
- [x] サイドバー開閉機能
- [x] ライトモード/ダークモード切り替え
- [x] ダッシュボードパネル編集機能
- [x] テーマ設定の永続化

### 12. ドキュメント
- [x] README.md 更新
- [x] docs/spl-parser-design.md 更新
- [x] TASKS.md 更新

### 13. デプロイ
- [x] Git コミット・プッシュ
- [x] Vercel デプロイ

## 公開URL
- **本番環境**: https://ai-traning-work.vercel.app

---

## 完了履歴

| 日時 | タスク | 備考 |
|------|--------|---------|
| 2026-01-08 | プロジェクト初期設定 | Next.js, Tailwind, Drizzle |
| 2026-01-08 | データベーススキーマ | 完成 |
| 2026-01-08 | レイアウトコンポーネント | 完成 |
| 2026-01-08 | SPLパーサー | Lexer, Parser 完成 |
| 2026-01-08 | 各ページ基本UI | 完成 |
| 2026-01-08 | サンプルデータ生成機能 | 6種類のログタイプ対応 |
| 2026-01-08 | SPL実行エンジン (初期) | 16コマンド対応 |
| 2026-01-08 | Zustandストア | 状態管理完成 |
| 2026-01-08 | 検索ページ | 完全実装 |
| 2026-01-08 | ダッシュボード機能 | 完全実装 |
| 2026-01-08 | アラート機能 | 完全実装 |
| 2026-01-08 | フィールド管理 | 完全実装 |
| 2026-01-08 | 練習問題機能 | 完全実装 |
| 2026-01-08 | 設定ページ | 完全実装 |
| 2026-01-08 | Git・Vercelデプロイ | 完了 |
| 2026-01-08 | サイドバー開閉機能 | 完了 |
| 2026-01-08 | ライト/ダークモード切り替え | 完了 |
| 2026-01-08 | ダッシュボードパネル編集機能 | 完了 |
| 2026-01-09 | SPL実行エンジン強化 | 30+コマンド、50+関数対応 |
| 2026-01-09 | エラーハンドリング強化 | サジェスト機能、詳細エラー |
| 2026-01-09 | ドキュメント更新 | README, SPL設計書 |
