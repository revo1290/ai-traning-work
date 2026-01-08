# SPLパーサー設計書

## 概要

Splunk Processing Language (SPL) の疑似実装。本番Splunk相当のコマンドと構文をサポートし、学習目的で使用可能。

## 対応コマンド一覧（30+コマンド）

### 基本コマンド

| コマンド | 構文 | 説明 |
|---------|------|------|
| search | `search <keywords>` | キーワード検索 |
| where | `where <condition>` | 条件フィルタリング |
| table | `table <field1>, <field2>, ...` | 指定フィールドのみ表示 |
| sort | `sort <field> [asc\|desc]` | ソート |
| head | `head <n>` | 先頭N件 |
| tail | `tail <n>` | 末尾N件 |
| dedup | `dedup <field> [consecutive=true] [keepempty=true]` | 重複除去 |
| fields | `fields [+\|-] <field1>, <field2>, ...` | フィールド選択/除外 |
| reverse | `reverse` | 結果の順序を逆転 |
| uniq | `uniq` | 連続する重複行を除去 |

### 統計コマンド

| コマンド | 構文 | 説明 |
|---------|------|------|
| stats | `stats <func>(<field>) [as <alias>] [by <field>]` | 統計計算 |
| eventstats | `eventstats <func>(<field>) [as <alias>] [by <field>]` | 統計を各行に追加 |
| streamstats | `streamstats <func>(<field>) [as <alias>] [by <field>] [window=n]` | ストリーミング統計 |
| top | `top <n> <field> [by <field>]` | 上位N件の値 |
| rare | `rare <n> <field> [by <field>]` | 下位N件の値 |
| timechart | `timechart span=<interval> <func>(<field>) [by <field>]` | 時系列集計 |
| chart | `chart <func>(<field>) over <field> [by <field>]` | 汎用チャート集計 |
| addtotals | `addtotals [row=true\|false] [col=true\|false]` | 行/列の合計追加 |

### 変換コマンド

| コマンド | 構文 | 説明 |
|---------|------|------|
| eval | `eval <field>=<expression>` | フィールド計算 |
| rex | `rex field=<field> "<regex>"` | 正規表現抽出 |
| rename | `rename <old> as <new>` | フィールド名変更 |
| spath | `spath [input=<field>] [output=<field>] [path=<path>]` | JSON/XMLパース |
| fillnull | `fillnull [value=<value>] [<field1>, <field2>, ...]` | NULL値を埋める |
| replace | `replace <pattern> with <replacement> in <field>` | 文字列置換 |
| convert | `convert <func>(<field>) [as <alias>]` | 型変換 |
| bin | `bin <field> [span=<value>] [bins=<n>]` | 値のビン分割 |

### マルチバリューコマンド

| コマンド | 構文 | 説明 |
|---------|------|------|
| makemv | `makemv delim="<delim>" <field>` | 文字列をマルチバリューに |
| mvexpand | `mvexpand <field> [limit=<n>]` | マルチバリューを行に展開 |

### 結合コマンド

| コマンド | 構文 | 説明 |
|---------|------|------|
| lookup | `lookup <table> <field> [OUTPUT <field>]` | ルックアップ結合 |
| inputlookup | `inputlookup <table> [where <condition>]` | ルックアップテーブル読込 |
| join | `join type=<type> <field> [subsearch]` | サブサーチ結合 |
| append | `append [subsearch]` | 結果を追加 |

### トランザクションコマンド

| コマンド | 構文 | 説明 |
|---------|------|------|
| transaction | `transaction <field> [maxspan=<time>] [startswith=<expr>] [endswith=<expr>]` | トランザクション化 |

### ユーティリティコマンド

| コマンド | 構文 | 説明 |
|---------|------|------|
| makeresults | `makeresults [count=<n>]` | 空の結果を生成 |
| regex | `regex field=<field> "<pattern>"` | 正規表現フィルタ |
| format | `format [mvsep="<sep>"]` | 出力フォーマット |
| return | `return [<n>] <field>` | サブサーチの結果を返す |

---

## 統計関数（30+関数）

### 基本集計関数

| 関数 | 説明 | 例 |
|------|------|-----|
| count | 件数 | `stats count` |
| sum | 合計 | `stats sum(bytes)` |
| avg / mean | 平均 | `stats avg(response_time)` |
| max | 最大値 | `stats max(duration)` |
| min | 最小値 | `stats min(duration)` |
| range | 範囲（max - min） | `stats range(price)` |

### 統計関数

| 関数 | 説明 | 例 |
|------|------|-----|
| stdev | 標準偏差 | `stats stdev(response_time)` |
| stdevp | 母標準偏差 | `stats stdevp(response_time)` |
| var | 分散 | `stats var(price)` |
| varp | 母分散 | `stats varp(price)` |
| median | 中央値 | `stats median(price)` |
| mode | 最頻値 | `stats mode(status)` |
| perc / percentile | パーセンタイル | `stats perc90(response_time)` |

### ユニーク・リスト関数

| 関数 | 説明 | 例 |
|------|------|-----|
| dc | ユニーク数 | `stats dc(user_id)` |
| values | ユニーク値リスト | `stats values(status)` |
| list | 全値リスト | `stats list(message)` |
| first | 最初の値 | `stats first(timestamp)` |
| last | 最後の値 | `stats last(timestamp)` |
| earliest | 最も古い値 | `stats earliest(message)` |
| latest | 最も新しい値 | `stats latest(message)` |

---

## Eval関数（50+関数）

### 文字列関数

| 関数 | 説明 | 例 |
|------|------|-----|
| len | 文字列長 | `eval len=len(message)` |
| lower | 小文字化 | `eval host=lower(host)` |
| upper | 大文字化 | `eval method=upper(method)` |
| trim / ltrim / rtrim | トリム | `eval s=trim(field)` |
| substr | 部分文字列 | `eval s=substr(message, 0, 10)` |
| replace | 置換 | `eval s=replace(field, "old", "new")` |
| split | 分割 | `eval parts=split(path, "/")` |
| mvjoin | 結合 | `eval s=mvjoin(values, ",")` |
| urldecode / urlencode | URL変換 | `eval decoded=urldecode(url)` |

### 数値関数

| 関数 | 説明 | 例 |
|------|------|-----|
| abs | 絶対値 | `eval n=abs(diff)` |
| ceil | 切り上げ | `eval n=ceil(price)` |
| floor | 切り下げ | `eval n=floor(price)` |
| round | 四捨五入 | `eval n=round(price, 2)` |
| sqrt | 平方根 | `eval n=sqrt(value)` |
| pow | べき乗 | `eval n=pow(base, exp)` |
| exp | 指数関数 | `eval n=exp(x)` |
| ln / log | 対数 | `eval n=ln(value)` |

### 条件関数

| 関数 | 説明 | 例 |
|------|------|-----|
| if | 条件分岐 | `eval status=if(code<400, "ok", "error")` |
| case | 複数条件 | `eval level=case(code<300, "info", code<400, "warn", true(), "error")` |
| coalesce | 最初の非NULL | `eval val=coalesce(a, b, c)` |
| nullif | NULL化 | `eval val=nullif(a, "")` |
| isnull / isnotnull | NULL判定 | `eval has_value=isnotnull(field)` |
| isnum / isstr / isint | 型判定 | `eval is_number=isnum(field)` |
| in | 値チェック | `eval is_valid=in(status, 200, 201, 204)` |
| like / match | パターンマッチ | `eval matches=like(host, "web%")` |

### 日時関数

| 関数 | 説明 | 例 |
|------|------|-----|
| now | 現在時刻 | `eval current=now()` |
| time | 現在時刻（秒） | `eval t=time()` |
| strftime | フォーマット | `eval date=strftime(_time, "%Y-%m-%d")` |
| strptime | パース | `eval ts=strptime(date, "%Y-%m-%d")` |
| relative_time | 相対時間 | `eval yesterday=relative_time(now(), "-1d")` |

### マルチバリュー関数

| 関数 | 説明 | 例 |
|------|------|-----|
| mvcount | 要素数 | `eval n=mvcount(values)` |
| mvindex | インデックス取得 | `eval first=mvindex(values, 0)` |
| mvfilter | フィルタ | `eval filtered=mvfilter(match(values, "error"))` |
| mvfind | 検索 | `eval idx=mvfind(values, "error")` |
| mvappend | 追加 | `eval combined=mvappend(a, b)` |
| mvdedup | 重複除去 | `eval unique=mvdedup(values)` |
| mvsort | ソート | `eval sorted=mvsort(values)` |

### JSON関数

| 関数 | 説明 | 例 |
|------|------|-----|
| json_extract | 値抽出 | `eval val=json_extract(data, "user.name")` |
| json_keys | キー一覧 | `eval keys=json_keys(data)` |
| json_object | オブジェクト作成 | `eval obj=json_object("a", 1, "b", 2)` |
| json_array | 配列作成 | `eval arr=json_array(1, 2, 3)` |
| json_valid | 検証 | `eval is_valid=json_valid(data)` |

### 暗号化関数

| 関数 | 説明 | 例 |
|------|------|-----|
| md5 | MD5ハッシュ | `eval hash=md5(password)` |
| sha1 | SHA1ハッシュ | `eval hash=sha1(data)` |
| sha256 | SHA256ハッシュ | `eval hash=sha256(data)` |
| sha512 | SHA512ハッシュ | `eval hash=sha512(data)` |

---

## 構文仕様

### パイプライン

コマンドは `|` で連結する：

```
search error | where status >= 500 | stats count by host | sort -count | head 10
```

### 検索キーワード

```
# 単純なキーワード
search error

# AND条件（スペース区切り）
search error timeout

# OR条件
search error OR warning

# NOT条件
search NOT debug

# フィールド指定
search status=500

# ワイルドカード
search host=web*

# 引用符（スペース含む文字列）
search "connection refused"

# IN演算子
search status IN (200, 201, 204)
```

### 条件式（where）

```
# 比較演算子
where status > 400
where status >= 500
where status = 200
where status != 404
where status < 300
where status <= 299

# 論理演算子
where status >= 400 AND status < 500
where status = 200 OR status = 201
where NOT status = 200

# 文字列マッチ
where host LIKE "web%"
where message LIKE "%error%"

# NULL チェック
where field IS NULL
where field IS NOT NULL

# IN 演算子
where status IN (200, 201, 204)
```

### 統計関数

```
# count
stats count
stats count by host
stats count as total by status

# sum
stats sum(bytes) as total_bytes by host

# avg
stats avg(response_time) as avg_time

# max / min
stats max(response_time) as max_time, min(response_time) as min_time

# 複数関数
stats count, avg(bytes), max(bytes) by host

# パーセンタイル
stats perc90(response_time), perc95(response_time)
```

### eval式

```
# 算術演算
eval total = price * quantity
eval rate = success / (success + failure) * 100

# 文字列操作
eval lower_host = lower(host)
eval upper_method = upper(method)
eval full_url = host . path

# 条件式
eval status_category = if(status < 400, "success", "error")
eval level = case(status < 300, "info", status < 400, "redirect", status < 500, "client_error", true(), "server_error")

# 型変換
eval status_num = tonumber(status)
eval status_str = tostring(status)

# 日時関数
eval hour = strftime(_time, "%H")
eval date = strftime(_time, "%Y-%m-%d")

# JSON操作
eval user_name = json_extract(data, "user.name")
eval request_id = json_extract(_raw, "request_id")
```

### rex（正規表現）

```
# 名前付きキャプチャグループで抽出
rex field=_raw "(?<ip>\d+\.\d+\.\d+\.\d+)"
rex field=message "user=(?<username>\w+)"

# 複数フィールド抽出
rex field=_raw "(?<method>\w+) (?<path>/\S+) HTTP/(?<version>[\d.]+)"
```

### timechart

```
# 時間間隔指定
timechart span=1h count
timechart span=5m avg(response_time)
timechart span=1d sum(bytes) by host

# 間隔オプション
span=1m   # 1分
span=5m   # 5分
span=1h   # 1時間
span=1d   # 1日
```

### eventstats / streamstats

```
# eventstats - 各行に統計値を追加
eventstats avg(response_time) as avg_time by host
| eval is_slow = if(response_time > avg_time * 2, "yes", "no")

# streamstats - 累積統計
streamstats count as running_count
streamstats avg(bytes) as running_avg window=10
```

### transaction

```
# 基本
transaction session_id

# タイムアウト指定
transaction session_id maxspan=30m

# 開始/終了条件
transaction session_id startswith="login" endswith="logout"

# イベント数制限
transaction session_id maxevents=100
```

### spath（JSONパース）

```
# 自動展開
| spath

# 特定パス指定
| spath path="user.name" output=user_name

# 入力フィールド指定
| spath input=json_data path="items{}.name"
```

### join

```
# 内部結合
| join type=inner user_id [search index=users]

# 左外部結合
| join type=left session_id [search index=sessions]
```

---

## パーサー実装

### アーキテクチャ

```
入力(SPL文字列)
    ↓
┌─────────────┐
│   Lexer     │  トークン分割
└─────────────┘
    ↓ Token[]
┌─────────────┐
│   Parser    │  AST構築
└─────────────┘
    ↓ AST
┌─────────────┐
│  Executor   │  クエリ実行
└─────────────┘
    ↓
出力(ExecutionResult)
```

### トークン定義

```typescript
// src/lib/spl/types.ts

type TokenType =
  | "PIPE"           // |
  | "COMMA"          // ,
  | "EQUALS"         // =
  | "NOT_EQUALS"     // !=
  | "GREATER"        // >
  | "GREATER_EQ"     // >=
  | "LESS"           // <
  | "LESS_EQ"        // <=
  | "LPAREN"         // (
  | "RPAREN"         // )
  | "LBRACKET"       // [
  | "RBRACKET"       // ]
  | "KEYWORD"        // search, where, stats, etc.
  | "IDENTIFIER"     // field names
  | "STRING"         // "quoted string"
  | "NUMBER"         // 123, 45.67
  | "OPERATOR"       // AND, OR, NOT, AS, BY, IN, LIKE
  | "WILDCARD"       // *
  | "DOT"            // .
  | "EOF";

interface Token {
  type: TokenType;
  value: string;
  position: number;
}
```

### 実行結果型

```typescript
// src/lib/spl/types.ts

interface ExecutionResult {
  success: boolean;
  data: Record<string, unknown>[];
  fields: string[];
  count: number;
  executionTime: number;
  error?: ExecutionError;
  warnings?: string[];
}

interface ExecutionError {
  code: ErrorCode;
  message: string;
  command?: string;
  position?: number;
  suggestion?: string;
}

type ErrorCode =
  | "SYNTAX_ERROR"
  | "PARSE_ERROR"
  | "UNKNOWN_COMMAND"
  | "UNKNOWN_FUNCTION"
  | "INVALID_ARGUMENT"
  | "FIELD_NOT_FOUND"
  | "TYPE_ERROR"
  | "REGEX_ERROR"
  | "RUNTIME_ERROR"
  | "TIMEOUT"
  | "MEMORY_LIMIT";
```

---

## エラーハンドリング

### エラークラス階層

```typescript
// src/lib/spl/errors.ts

// 基底エラークラス
export class SPLError extends Error {
  public code: ErrorCode;
  public position?: number;
  public command?: string;
  public suggestion?: string;

  constructor(message: string, code: ErrorCode, options?: {
    position?: number;
    command?: string;
    suggestion?: string;
  });

  toExecutionError(): ExecutionError;
}

// 派生エラークラス
export class SPLSyntaxError extends SPLError       // 構文エラー
export class SPLParseError extends SPLError        // パースエラー
export class SPLRuntimeError extends SPLError      // 実行時エラー
export class SPLUnknownCommandError extends SPLError  // 未知コマンド
export class SPLUnknownFunctionError extends SPLError // 未知関数
export class SPLInvalidArgumentError extends SPLError // 不正引数
export class SPLFieldNotFoundError extends SPLError   // フィールド未発見
export class SPLTypeError extends SPLError            // 型エラー
export class SPLRegexError extends SPLError           // 正規表現エラー
export class SPLTimeoutError extends SPLError         // タイムアウト
export class SPLMemoryLimitError extends SPLError     // メモリ制限超過
```

### サジェスト機能

Levenshtein距離を使用して、誤ったコマンドや関数名に対して "Did you mean?" 形式のサジェストを提供：

```typescript
// 例: "serch" → "Did you mean: search?"
throw new SPLUnknownCommandError("serch", position);
// エラーメッセージ: "Unknown command: serch"
// サジェスト: "Did you mean: search?"

// 例: "cont" → "Did you mean: count?"
throw new SPLUnknownFunctionError("cont", command);
// エラーメッセージ: "Unknown function: cont"
// サジェスト: "Did you mean: count?"
```

### リソース制限

```typescript
// Executor初期化オプション
interface ExecutorOptions {
  timeout?: number;      // デフォルト: 30000ms
  memoryLimit?: number;  // デフォルト: 100000レコード
}

// タイムアウト時
throw new SPLTimeoutError(30000);
// サジェスト: "Try limiting results with 'head' or adding more specific filters"

// メモリ制限時
throw new SPLMemoryLimitError(100000);
// サジェスト: "Use 'head' or 'sample' to reduce data volume, or add filters"
```

---

## セキュリティ

### ReDoS対策

正規表現パターンは安全にエスケープして実行：

```typescript
private safeCreateRegex(pattern: string, flags?: string): RegExp {
  try {
    return new RegExp(pattern, flags);
  } catch {
    // 不正なパターンは安全にエスケープ
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(escaped, flags);
  }
}
```

### 入力値サニタイズ

すべてのユーザー入力はパーサーで検証し、不正な構文は明確なエラーメッセージで拒否。

---

## ヘルプ・オートコンプリート

### コマンドヘルプ

```typescript
// src/lib/spl/help.ts

export const SPL_COMMANDS: Record<string, CommandHelp> = {
  search: {
    name: "search",
    description: "キーワードでログを検索します",
    syntax: "search <keywords> | search field=value",
    examples: [
      "search error",
      "search status=500",
      'search "connection refused"',
    ],
  },
  // ... 他のコマンド
};
```

---

## テスト

### ユニットテスト例

```typescript
// src/lib/spl/__tests__/lexer.test.ts

describe("SPLLexer", () => {
  it("should tokenize simple search", () => {
    const lexer = new SPLLexer("search error");
    const tokens = lexer.tokenize();

    expect(tokens).toHaveLength(3); // KEYWORD, IDENTIFIER, EOF
    expect(tokens[0]).toMatchObject({ type: "KEYWORD", value: "search" });
    expect(tokens[1]).toMatchObject({ type: "IDENTIFIER", value: "error" });
  });

  it("should tokenize piped commands", () => {
    const lexer = new SPLLexer("search * | stats count | head 10");
    const tokens = lexer.tokenize();

    expect(tokens.filter((t) => t.type === "PIPE")).toHaveLength(2);
  });
});

// src/lib/spl/__tests__/executor.test.ts

describe("SPLExecutor", () => {
  it("should execute stats with groupBy", () => {
    const executor = new SPLExecutor(sampleData);
    const result = executor.execute("stats count by status");

    expect(result.success).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);
    expect(result.data[0]).toHaveProperty("status");
    expect(result.data[0]).toHaveProperty("count");
  });

  it("should return error for unknown command", () => {
    const executor = new SPLExecutor(sampleData);
    const result = executor.execute("unknowncommand");

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe("UNKNOWN_COMMAND");
    expect(result.error?.suggestion).toContain("Did you mean");
  });
});
```
