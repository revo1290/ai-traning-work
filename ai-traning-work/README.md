# Splunk Training Tool

SPL (Search Processing Language) の学習用トレーニングツールです。サンプルデータを使用して、本番Splunk相当の操作を体験できます。

## デモ

**本番環境**: https://ai-traning-work.vercel.app

## 機能

### 検索機能
- SPLクエリの実行と結果表示
- 検索履歴の保存
- 保存済み検索の管理
- エラー時のサジェスト機能（"Did you mean?"）

### SPLコマンド対応

#### 基本コマンド
| コマンド | 説明 |
|----------|------|
| `search` | キーワード・フィールド検索 |
| `where` | 条件フィルタリング |
| `table` | フィールド選択・表示 |
| `sort` | ソート |
| `head` / `tail` | 先頭/末尾N件取得 |
| `dedup` | 重複排除 |
| `fields` | フィールド選択/除外 |
| `reverse` | 結果順序を逆転 |
| `uniq` | 連続重複行を除去 |

#### 統計コマンド
| コマンド | 説明 |
|----------|------|
| `stats` | 統計集計 (count, sum, avg, max, min, dc, values, list, first, last, stdev, median, perc) |
| `eventstats` | 各行に統計値を追加 |
| `streamstats` | ストリーミング統計 |
| `top` / `rare` | 上位/下位N件 |
| `timechart` | 時系列集計 |
| `chart` | 汎用チャート集計 |
| `addtotals` | 行/列の合計追加 |

#### 変換コマンド
| コマンド | 説明 |
|----------|------|
| `eval` | フィールド計算 (50+関数対応) |
| `rex` | 正規表現抽出 |
| `rename` | フィールド名変更 |
| `spath` | JSON/XMLパース |
| `fillnull` | NULL値を埋める |
| `replace` | 文字列置換 |
| `convert` | 型変換 |
| `bin` | 値のビン分割 |

#### マルチバリュー・結合コマンド
| コマンド | 説明 |
|----------|------|
| `makemv` | 文字列をマルチバリューに |
| `mvexpand` | マルチバリューを行に展開 |
| `lookup` | ルックアップテーブル結合 |
| `inputlookup` | ルックアップテーブル読込 |
| `join` | サブサーチ結合 |
| `append` | 結果を追加 |
| `transaction` | トランザクション化 |

#### ユーティリティコマンド
| コマンド | 説明 |
|----------|------|
| `makeresults` | 空の結果を生成 |
| `regex` | 正規表現フィルタ |
| `format` | 出力フォーマット |
| `return` | サブサーチの結果を返す |

### Eval関数 (50+関数)
- **文字列**: len, lower, upper, trim, substr, replace, split, mvjoin, urldecode/urlencode
- **数値**: abs, ceil, floor, round, sqrt, pow, exp, ln, log
- **条件**: if, case, coalesce, nullif, isnull, isnotnull, isnum, isstr
- **日時**: now, time, strftime, strptime, relative_time
- **マルチバリュー**: mvcount, mvindex, mvfilter, mvfind, mvappend, mvdedup, mvsort
- **JSON**: json_extract, json_keys, json_object, json_array, json_valid
- **暗号化**: md5, sha1, sha256, sha512

### エラーハンドリング
- 詳細なエラーメッセージ
- コマンド/関数名のタイポ検出と修正サジェスト
- 構文エラー位置の特定
- タイムアウト・メモリ制限のヒント

### ダッシュボード
- ダッシュボード作成・編集
- パネル追加・編集・削除
- 可視化タイプ:
  - 棒グラフ
  - 折れ線グラフ
  - 円グラフ
  - テーブル
  - シングル値

### UI機能
- サイドバー開閉機能
- ライトモード/ダークモード切り替え
- テーマ設定の永続化

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
