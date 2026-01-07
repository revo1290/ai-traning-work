# SPLパーサー設計書

## 概要

Splunk Processing Language (SPL) の疑似実装。本物のSPLと完全互換ではないが、学習目的で基本的なコマンドと構文をサポートする。

## 対応コマンド一覧

### 基本コマンド

| コマンド | 構文 | 説明 |
|---------|------|------|
| search | `search <keywords>` | キーワード検索 |
| where | `where <condition>` | 条件フィルタリング |
| table | `table <field1>, <field2>, ...` | 指定フィールドのみ表示 |
| sort | `sort <field> [asc\|desc]` | ソート |
| head | `head <n>` | 先頭N件 |
| tail | `tail <n>` | 末尾N件 |
| dedup | `dedup <field>` | 重複除去 |
| fields | `fields [+\|-] <field1>, <field2>, ...` | フィールド選択/除外 |

### 統計コマンド

| コマンド | 構文 | 説明 |
|---------|------|------|
| stats | `stats <func>(<field>) [as <alias>] [by <field>]` | 統計計算 |
| top | `top <n> <field>` | 上位N件の値 |
| rare | `rare <n> <field>` | 下位N件の値 |
| timechart | `timechart span=<interval> <func>(<field>) [by <field>]` | 時系列集計 |

### 変換コマンド

| コマンド | 構文 | 説明 |
|---------|------|------|
| eval | `eval <field>=<expression>` | フィールド計算 |
| rex | `rex field=<field> "<regex>"` | 正規表現抽出 |
| rename | `rename <old> as <new>` | フィールド名変更 |
| spath | `spath [input=<field>] [output=<field>] [path=<path>]` | JSON/XMLパース |

### 結合コマンド

| コマンド | 構文 | 説明 |
|---------|------|------|
| lookup | `lookup <table> <field> [OUTPUT <field>]` | ルックアップ結合 |
| join | `join <field> [subsearch]` | サブサーチ結合 |
| transaction | `transaction <field> [maxspan=<time>]` | トランザクション化 |

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

### lookup

```
# 基本
lookup users user_id OUTPUT user_name

# 複数フィールド出力
lookup geoip ip OUTPUT country, city, latitude, longitude
```

### transaction

```
# 基本
transaction session_id

# タイムアウト指定
transaction session_id maxspan=30m

# 開始/終了条件
transaction session_id startswith="login" endswith="logout"
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
出力(結果)
```

### トークン定義

```typescript
// src/lib/spl/lexer.ts

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
  | "KEYWORD"        // search, where, stats, etc.
  | "IDENTIFIER"     // field names
  | "STRING"         // "quoted string"
  | "NUMBER"         // 123, 45.67
  | "OPERATOR"       // AND, OR, NOT, AS, BY
  | "FUNCTION"       // count, sum, avg, etc.
  | "WILDCARD"       // *
  | "EOF";

interface Token {
  type: TokenType;
  value: string;
  position: number;
  line: number;
  column: number;
}
```

### AST定義

```typescript
// src/lib/spl/ast.ts

interface SPLQuery {
  commands: Command[];
}

type Command =
  | SearchCommand
  | WhereCommand
  | TableCommand
  | SortCommand
  | HeadCommand
  | TailCommand
  | DedupCommand
  | FieldsCommand
  | StatsCommand
  | TopCommand
  | RareCommand
  | TimechartCommand
  | EvalCommand
  | RexCommand
  | RenameCommand
  | SpathCommand
  | LookupCommand
  | JoinCommand
  | TransactionCommand;

interface SearchCommand {
  type: "search";
  conditions: SearchCondition[];
}

interface SearchCondition {
  field?: string;
  operator?: "=" | "!=" | ">" | ">=" | "<" | "<=";
  value: string;
  isNegated?: boolean;
  logicalOp?: "AND" | "OR";
}

interface WhereCommand {
  type: "where";
  expression: Expression;
}

interface Expression {
  type: "comparison" | "logical" | "function" | "field" | "literal";
  // ... expression details
}

interface StatsCommand {
  type: "stats";
  aggregations: Aggregation[];
  groupBy?: string[];
}

interface Aggregation {
  function: "count" | "sum" | "avg" | "max" | "min";
  field?: string;
  alias?: string;
}

// ... 他のコマンド定義
```

### Lexer実装

```typescript
// src/lib/spl/lexer.ts

export class SPLLexer {
  private input: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;

  constructor(input: string) {
    this.input = input;
  }

  tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.position < this.input.length) {
      this.skipWhitespace();

      if (this.position >= this.input.length) break;

      const token = this.nextToken();
      if (token) {
        tokens.push(token);
      }
    }

    tokens.push({
      type: "EOF",
      value: "",
      position: this.position,
      line: this.line,
      column: this.column,
    });

    return tokens;
  }

  private nextToken(): Token | null {
    const char = this.input[this.position];

    // 演算子・記号
    if (char === "|") return this.makeToken("PIPE", "|");
    if (char === ",") return this.makeToken("COMMA", ",");
    if (char === "(") return this.makeToken("LPAREN", "(");
    if (char === ")") return this.makeToken("RPAREN", ")");

    // 比較演算子
    if (char === "=" || char === "!" || char === ">" || char === "<") {
      return this.readOperator();
    }

    // 文字列
    if (char === '"' || char === "'") {
      return this.readString();
    }

    // 数値
    if (this.isDigit(char)) {
      return this.readNumber();
    }

    // 識別子・キーワード
    if (this.isAlpha(char) || char === "_") {
      return this.readIdentifier();
    }

    // ワイルドカード
    if (char === "*") {
      return this.makeToken("WILDCARD", "*");
    }

    throw new SPLSyntaxError(`Unexpected character: ${char}`, this.position);
  }

  // ... ヘルパーメソッド
}
```

### Parser実装

```typescript
// src/lib/spl/parser.ts

export class SPLParser {
  private tokens: Token[];
  private position: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): SPLQuery {
    const commands: Command[] = [];

    while (!this.isAtEnd()) {
      const command = this.parseCommand();
      commands.push(command);

      // パイプがあれば次のコマンドへ
      if (this.check("PIPE")) {
        this.advance();
      }
    }

    return { commands };
  }

  private parseCommand(): Command {
    const token = this.peek();

    switch (token.value.toLowerCase()) {
      case "search":
        return this.parseSearch();
      case "where":
        return this.parseWhere();
      case "table":
        return this.parseTable();
      case "sort":
        return this.parseSort();
      case "head":
        return this.parseHead();
      case "tail":
        return this.parseTail();
      case "stats":
        return this.parseStats();
      case "eval":
        return this.parseEval();
      case "rex":
        return this.parseRex();
      // ... 他のコマンド
      default:
        // searchコマンドが省略された場合
        return this.parseImplicitSearch();
    }
  }

  // ... 各コマンドのパースメソッド
}
```

### Executor実装

```typescript
// src/lib/spl/executor.ts

export class SPLExecutor {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async execute(
    query: SPLQuery,
    timeRange: { from: number; to: number }
  ): Promise<ExecutionResult> {
    let data = await this.fetchInitialData(timeRange);

    for (const command of query.commands) {
      data = await this.executeCommand(command, data);
    }

    return {
      data,
      fields: this.extractFields(data),
      count: data.length,
    };
  }

  private async executeCommand(
    command: Command,
    data: Record<string, unknown>[]
  ): Promise<Record<string, unknown>[]> {
    switch (command.type) {
      case "search":
        return this.executeSearch(command, data);
      case "where":
        return this.executeWhere(command, data);
      case "table":
        return this.executeTable(command, data);
      case "sort":
        return this.executeSort(command, data);
      case "head":
        return data.slice(0, command.count);
      case "tail":
        return data.slice(-command.count);
      case "stats":
        return this.executeStats(command, data);
      case "eval":
        return this.executeEval(command, data);
      // ... 他のコマンド
    }
  }

  private executeSearch(
    command: SearchCommand,
    data: Record<string, unknown>[]
  ): Record<string, unknown>[] {
    return data.filter((row) => {
      return command.conditions.every((cond) => {
        const value = cond.field ? row[cond.field] : JSON.stringify(row);
        return this.matchCondition(String(value), cond);
      });
    });
  }

  private executeStats(
    command: StatsCommand,
    data: Record<string, unknown>[]
  ): Record<string, unknown>[] {
    if (command.groupBy && command.groupBy.length > 0) {
      return this.executeStatsGrouped(command, data);
    }

    const result: Record<string, unknown> = {};
    for (const agg of command.aggregations) {
      const key = agg.alias || `${agg.function}(${agg.field || ""})`;
      result[key] = this.calculateAggregation(agg, data);
    }

    return [result];
  }

  // ... 他の実行メソッド
}
```

---

## エラーハンドリング

### エラー種別

```typescript
// src/lib/spl/errors.ts

export class SPLError extends Error {
  constructor(
    message: string,
    public position?: number,
    public line?: number,
    public column?: number
  ) {
    super(message);
    this.name = "SPLError";
  }
}

export class SPLSyntaxError extends SPLError {
  constructor(message: string, position: number) {
    super(`Syntax error: ${message}`, position);
    this.name = "SPLSyntaxError";
  }
}

export class SPLRuntimeError extends SPLError {
  constructor(message: string) {
    super(`Runtime error: ${message}`);
    this.name = "SPLRuntimeError";
  }
}

export class SPLUnknownCommandError extends SPLError {
  constructor(command: string, position: number) {
    super(`Unknown command: ${command}`, position);
    this.name = "SPLUnknownCommandError";
  }
}
```

### バリデーション

```typescript
// src/lib/spl/validator.ts

export class SPLValidator {
  validate(query: SPLQuery): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    for (const command of query.commands) {
      this.validateCommand(command, errors, warnings);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private validateCommand(
    command: Command,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ) {
    // コマンド固有のバリデーション
    switch (command.type) {
      case "stats":
        if (command.aggregations.length === 0) {
          errors.push({
            message: "stats command requires at least one aggregation",
            position: command.position,
          });
        }
        break;
      // ... 他のバリデーション
    }
  }
}
```

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
  where: {
    name: "where",
    description: "条件式でフィルタリングします",
    syntax: "where <condition>",
    examples: [
      "where status >= 400",
      "where status = 200 AND method = GET",
    ],
  },
  stats: {
    name: "stats",
    description: "統計を計算します",
    syntax: "stats <function>(<field>) [as <alias>] [by <field>]",
    examples: [
      "stats count",
      "stats count by host",
      "stats avg(response_time) as avg_time by status",
    ],
  },
  // ... 他のコマンド
};
```

### オートコンプリート

```typescript
// src/lib/spl/autocomplete.ts

export class SPLAutocomplete {
  getSuggestions(
    input: string,
    cursorPosition: number,
    context: { fields: string[]; lookups: string[] }
  ): Suggestion[] {
    const { prefix, type } = this.analyzeContext(input, cursorPosition);

    switch (type) {
      case "command":
        return this.suggestCommands(prefix);
      case "field":
        return this.suggestFields(prefix, context.fields);
      case "function":
        return this.suggestFunctions(prefix);
      case "lookup":
        return this.suggestLookups(prefix, context.lookups);
      default:
        return [];
    }
  }
}
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

// src/lib/spl/__tests__/parser.test.ts

describe("SPLParser", () => {
  it("should parse stats command", () => {
    const tokens = new SPLLexer("stats count by host").tokenize();
    const parser = new SPLParser(tokens);
    const query = parser.parse();

    expect(query.commands[0]).toMatchObject({
      type: "stats",
      aggregations: [{ function: "count" }],
      groupBy: ["host"],
    });
  });
});
```
