# Splunk Training Tool

SPL (Search Processing Language) の学習用トレーニングツールです。サンプルデータを使用して、実際のSplunkに近い操作を体験できます。

## デモ

**本番環境**: https://ai-traning-work.vercel.app

## 機能

### 検索機能
- SPLクエリの実行と結果表示
- 検索履歴の保存
- 保存済み検索の管理

### SPLコマンド対応 (16コマンド)
| コマンド | 説明 |
|----------|------|
| `search` | キーワード・フィールド検索 |
| `where` | 条件フィルタリング |
| `table` | フィールド選択・表示 |
| `sort` | ソート |
| `head` / `tail` | 先頭/末尾N件取得 |
| `dedup` | 重複排除 |
| `fields` | フィールド選択/除外 |
| `stats` | 統計集計 (count, sum, avg, max, min, dc, values, list, first, last, stdev, median) |
| `top` / `rare` | 上位/下位N件 |
| `timechart` | 時系列集計 |
| `eval` | フィールド計算 |
| `rex` | 正規表現抽出 |
| `rename` | フィールド名変更 |
| `lookup` | ルックアップテーブル結合 |

### ダッシュボード
- ダッシュボード作成・編集
- パネル追加・可視化
  - 棒グラフ
  - 折れ線グラフ
  - 円グラフ
  - テーブル
  - シングル値

### アラート
- アラートルール作成・編集・削除
- アラート履歴表示

### フィールド管理
- フィールド抽出ルール管理
- 正規表現テスト機能
- よく使うパターンリファレンス

### 練習問題
- 8問の練習問題 (初級4問、中級4問)
- 進捗管理
- ヒント・回答表示機能

### サンプルデータ
6種類のログタイプを生成可能:
- Webサーバーログ (Apache形式)
- ECサイトアプリケーションログ (JSON)
- セキュリティログ (syslog)
- JVM GCログ
- Kubernetesログ
- データベーススロークエリログ

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS v4
- **状態管理**: Zustand (localStorage永続化)
- **チャート**: Recharts
- **データベース**: Drizzle ORM + libsql (スキーマ定義のみ)

## セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番サーバー起動
npm start
```

## 使い方

1. **データ取り込み**ページでサンプルデータを読み込む
2. **検索**ページでSPLクエリを実行
3. **ダッシュボード**で可視化パネルを作成
4. **練習問題**でSPLスキルを磨く

## ライセンス

MIT
