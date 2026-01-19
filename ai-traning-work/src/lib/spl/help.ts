// SPLコマンドヘルプ情報

export interface CommandHelp {
  name: string;
  description: string;
  syntax: string;
  examples: string[];
  category: "search" | "stats" | "transform" | "join" | "utility";
}

export interface FunctionHelp {
  name: string;
  description: string;
  syntax: string;
  examples: string[];
  category: "string" | "numeric" | "conditional" | "datetime" | "multivalue" | "json" | "crypto";
}

// SPLコマンドヘルプ
export const SPL_COMMANDS: Record<string, CommandHelp> = {
  // 基本検索コマンド
  search: {
    name: "search",
    description: "キーワードやフィールド条件でログを検索します",
    syntax: "search <keywords> | search <field>=<value>",
    examples: [
      "search error",
      "search status=500",
      'search host="web*"',
      "search error OR warning",
      "search status IN (200, 201, 204)",
    ],
    category: "search",
  },
  where: {
    name: "where",
    description: "条件式でイベントをフィルタリングします",
    syntax: "where <condition>",
    examples: [
      "where status >= 400",
      "where status >= 400 AND status < 500",
      'where host LIKE "web%"',
      "where isnotnull(user)",
    ],
    category: "search",
  },
  table: {
    name: "table",
    description: "指定したフィールドのみをテーブル形式で表示します",
    syntax: "table <field1>, <field2>, ...",
    examples: [
      "table host, status, response_time",
      "table *",
      "table _time, host, message",
    ],
    category: "transform",
  },
  fields: {
    name: "fields",
    description: "表示するフィールドを追加または除外します",
    syntax: "fields [+|-] <field1>, <field2>, ...",
    examples: [
      "fields host, status",
      "fields - _raw, _time",
      "fields + new_field",
    ],
    category: "transform",
  },
  sort: {
    name: "sort",
    description: "指定フィールドでソートします",
    syntax: "sort [+|-]<field1>, [+|-]<field2>, ...",
    examples: [
      "sort -status",
      "sort +host, -count",
      "sort 10 -count",
    ],
    category: "transform",
  },
  head: {
    name: "head",
    description: "先頭N件のイベントを取得します",
    syntax: "head [<N>]",
    examples: [
      "head",
      "head 100",
      "head 5",
    ],
    category: "transform",
  },
  tail: {
    name: "tail",
    description: "末尾N件のイベントを取得します",
    syntax: "tail [<N>]",
    examples: [
      "tail",
      "tail 100",
      "tail 5",
    ],
    category: "transform",
  },
  dedup: {
    name: "dedup",
    description: "指定フィールドの重複を除去します",
    syntax: "dedup <field1>, <field2>, ... [consecutive=true]",
    examples: [
      "dedup host",
      "dedup host, status",
      "dedup user consecutive=true",
    ],
    category: "transform",
  },
  reverse: {
    name: "reverse",
    description: "結果の順序を逆転します",
    syntax: "reverse",
    examples: [
      "reverse",
      "sort _time | reverse",
    ],
    category: "transform",
  },
  uniq: {
    name: "uniq",
    description: "連続する重複行を除去します",
    syntax: "uniq",
    examples: [
      "uniq",
      "sort host | uniq",
    ],
    category: "transform",
  },

  // 統計コマンド
  stats: {
    name: "stats",
    description: "統計計算を行います（count, sum, avg, max, min等）",
    syntax: "stats <func>(<field>) [as <alias>] [by <field>]",
    examples: [
      "stats count",
      "stats count by host",
      "stats sum(bytes) as total_bytes by host",
      "stats avg(response_time), max(response_time), min(response_time)",
      "stats dc(user) as unique_users",
    ],
    category: "stats",
  },
  eventstats: {
    name: "eventstats",
    description: "統計値を各イベントに追加します（元データを保持）",
    syntax: "eventstats <func>(<field>) [as <alias>] [by <field>]",
    examples: [
      "eventstats avg(response_time) as avg_time by host",
      "eventstats count as total_count",
    ],
    category: "stats",
  },
  streamstats: {
    name: "streamstats",
    description: "累積・ストリーミング統計を計算します",
    syntax: "streamstats <func>(<field>) [as <alias>] [window=N] [by <field>]",
    examples: [
      "streamstats count as running_count",
      "streamstats avg(bytes) as running_avg window=10",
      "streamstats sum(count) as cumulative_count by host",
    ],
    category: "stats",
  },
  top: {
    name: "top",
    description: "最頻値の上位N件を表示します",
    syntax: "top [<N>] <field> [by <field>]",
    examples: [
      "top status",
      "top 10 host",
      "top 5 user by host",
    ],
    category: "stats",
  },
  rare: {
    name: "rare",
    description: "最少値の上位N件を表示します",
    syntax: "rare [<N>] <field> [by <field>]",
    examples: [
      "rare status",
      "rare 10 host",
      "rare 5 error_code by host",
    ],
    category: "stats",
  },
  timechart: {
    name: "timechart",
    description: "時系列グラフ用の集計を行います",
    syntax: "timechart [span=<interval>] <func>(<field>) [by <field>]",
    examples: [
      "timechart count",
      "timechart span=1h count by status",
      "timechart span=5m avg(response_time)",
      "timechart span=1d sum(bytes) by host",
    ],
    category: "stats",
  },
  chart: {
    name: "chart",
    description: "汎用チャート集計を行います",
    syntax: "chart <func>(<field>) over <field> [by <field>]",
    examples: [
      "chart count over status",
      "chart avg(response_time) over host by status",
      "chart sum(bytes) over host",
    ],
    category: "stats",
  },
  addtotals: {
    name: "addtotals",
    description: "行や列の合計を追加します",
    syntax: "addtotals [row=true|false] [col=true|false]",
    examples: [
      "addtotals",
      "addtotals row=true",
      "addtotals col=true row=false",
    ],
    category: "stats",
  },

  // 変換コマンド
  eval: {
    name: "eval",
    description: "新しいフィールドを計算・作成します",
    syntax: "eval <field>=<expression>",
    examples: [
      "eval total = price * quantity",
      "eval status_category = if(status < 400, \"success\", \"error\")",
      "eval lower_host = lower(host)",
      "eval date = strftime(_time, \"%Y-%m-%d\")",
    ],
    category: "transform",
  },
  rex: {
    name: "rex",
    description: "正規表現でフィールドを抽出します",
    syntax: 'rex [field=<field>] "<regex>"',
    examples: [
      'rex field=_raw "(?<ip>\\d+\\.\\d+\\.\\d+\\.\\d+)"',
      'rex field=message "user=(?<username>\\w+)"',
      'rex "(?<method>\\w+) (?<path>/\\S+)"',
    ],
    category: "transform",
  },
  rename: {
    name: "rename",
    description: "フィールド名を変更します",
    syntax: "rename <old_field> as <new_field>",
    examples: [
      "rename host as server",
      "rename response_time as rt, status as code",
    ],
    category: "transform",
  },
  fillnull: {
    name: "fillnull",
    description: "NULL値を指定値で埋めます",
    syntax: "fillnull [value=<value>] [<field1>, <field2>, ...]",
    examples: [
      "fillnull",
      "fillnull value=0",
      'fillnull value="N/A" host, user',
    ],
    category: "transform",
  },
  replace: {
    name: "replace",
    description: "フィールド値を置換します",
    syntax: "replace <pattern> with <replacement> in <field>",
    examples: [
      'replace "error" with "ERROR" in message',
      'replace "*" with "ALL" in host',
    ],
    category: "transform",
  },
  bin: {
    name: "bin",
    description: "値をビン（バケット）に分割します",
    syntax: "bin <field> [span=<value>] [bins=<N>]",
    examples: [
      "bin _time span=1h",
      "bin response_time span=100",
      "bin price bins=10",
    ],
    category: "transform",
  },
  convert: {
    name: "convert",
    description: "フィールドの型を変換します",
    syntax: "convert <func>(<field>) [as <alias>]",
    examples: [
      "convert num(status)",
      "convert dur2sec(duration) as seconds",
      "convert ctime(timestamp) as datetime",
    ],
    category: "transform",
  },

  // マルチバリューコマンド
  makemv: {
    name: "makemv",
    description: "文字列をマルチバリューフィールドに変換します",
    syntax: 'makemv [delim="<delimiter>"] <field>',
    examples: [
      "makemv tags",
      'makemv delim="," categories',
      'makemv delim="|" values',
    ],
    category: "transform",
  },
  mvexpand: {
    name: "mvexpand",
    description: "マルチバリューフィールドを複数行に展開します",
    syntax: "mvexpand <field> [limit=<N>]",
    examples: [
      "mvexpand tags",
      "mvexpand items limit=10",
    ],
    category: "transform",
  },

  // JSON/XMLコマンド
  spath: {
    name: "spath",
    description: "JSONやXMLからフィールドを抽出します",
    syntax: "spath [input=<field>] [output=<field>] [path=<path>]",
    examples: [
      "spath",
      'spath path="user.name" output=username',
      'spath input=json_data path="items{}.name"',
    ],
    category: "transform",
  },

  // 結合コマンド
  lookup: {
    name: "lookup",
    description: "ルックアップテーブルと結合します",
    syntax: "lookup <table> <field> [OUTPUT <field1>, <field2>, ...]",
    examples: [
      "lookup users user_id",
      "lookup geo_data ip OUTPUT country, city",
    ],
    category: "join",
  },
  join: {
    name: "join",
    description: "サブサーチの結果と結合します",
    syntax: "join [type=inner|left|outer] <field> [subsearch]",
    examples: [
      "join user_id [search index=users]",
      "join type=left session_id [search index=sessions]",
    ],
    category: "join",
  },
  transaction: {
    name: "transaction",
    description: "関連イベントをトランザクションとしてグループ化します",
    syntax: "transaction <field> [maxspan=<time>] [startswith=<expr>] [endswith=<expr>]",
    examples: [
      "transaction session_id",
      "transaction session_id maxspan=30m",
      'transaction user_id startswith="login" endswith="logout"',
    ],
    category: "join",
  },

  // フィルタリングコマンド
  regex: {
    name: "regex",
    description: "正規表現でフィルタリングします",
    syntax: 'regex [field=<field>] "<pattern>"',
    examples: [
      'regex "error|warning"',
      'regex field=host "^web\\d+"',
      'regex field=message "(?i)error"',
    ],
    category: "search",
  },

  // ユーティリティコマンド
  makeresults: {
    name: "makeresults",
    description: "空の結果セットを生成します",
    syntax: "makeresults [count=<N>] [annotate=true|false]",
    examples: [
      "makeresults",
      "makeresults count=10",
      "makeresults count=5 | eval message=\"test\"",
    ],
    category: "utility",
  },
};

// 統計関数ヘルプ
export const STATS_FUNCTION_HELP: Record<string, FunctionHelp> = {
  count: {
    name: "count",
    description: "イベント数をカウントします",
    syntax: "count | count(<field>)",
    examples: ["stats count", "stats count(user)"],
    category: "numeric",
  },
  sum: {
    name: "sum",
    description: "数値の合計を計算します",
    syntax: "sum(<field>)",
    examples: ["stats sum(bytes)", "stats sum(price) by product"],
    category: "numeric",
  },
  avg: {
    name: "avg",
    description: "数値の平均を計算します",
    syntax: "avg(<field>)",
    examples: ["stats avg(response_time)", "stats avg(price) by category"],
    category: "numeric",
  },
  max: {
    name: "max",
    description: "最大値を取得します",
    syntax: "max(<field>)",
    examples: ["stats max(bytes)", "stats max(duration) by host"],
    category: "numeric",
  },
  min: {
    name: "min",
    description: "最小値を取得します",
    syntax: "min(<field>)",
    examples: ["stats min(bytes)", "stats min(duration) by host"],
    category: "numeric",
  },
  dc: {
    name: "dc",
    description: "ユニークな値の数をカウントします",
    syntax: "dc(<field>)",
    examples: ["stats dc(user)", "stats dc(ip) by country"],
    category: "numeric",
  },
  values: {
    name: "values",
    description: "ユニークな値のリストを取得します",
    syntax: "values(<field>)",
    examples: ["stats values(status)", "stats values(host) by region"],
    category: "multivalue",
  },
  list: {
    name: "list",
    description: "全値のリストを取得します（重複含む）",
    syntax: "list(<field>)",
    examples: ["stats list(message)", "stats list(event) by user"],
    category: "multivalue",
  },
  first: {
    name: "first",
    description: "最初の値を取得します",
    syntax: "first(<field>)",
    examples: ["stats first(timestamp)", "stats first(message) by session"],
    category: "numeric",
  },
  last: {
    name: "last",
    description: "最後の値を取得します",
    syntax: "last(<field>)",
    examples: ["stats last(timestamp)", "stats last(status) by session"],
    category: "numeric",
  },
  median: {
    name: "median",
    description: "中央値を計算します",
    syntax: "median(<field>)",
    examples: ["stats median(response_time)", "stats median(price) by category"],
    category: "numeric",
  },
  stdev: {
    name: "stdev",
    description: "標準偏差を計算します",
    syntax: "stdev(<field>)",
    examples: ["stats stdev(response_time)", "stats stdev(bytes) by host"],
    category: "numeric",
  },
  range: {
    name: "range",
    description: "範囲（最大-最小）を計算します",
    syntax: "range(<field>)",
    examples: ["stats range(price)", "stats range(duration) by type"],
    category: "numeric",
  },
};

// Eval関数ヘルプ
export const EVAL_FUNCTION_HELP: Record<string, FunctionHelp> = {
  // 文字列関数
  len: {
    name: "len",
    description: "文字列の長さを返します",
    syntax: "len(<field>)",
    examples: ["eval length = len(message)"],
    category: "string",
  },
  lower: {
    name: "lower",
    description: "文字列を小文字に変換します",
    syntax: "lower(<field>)",
    examples: ["eval lower_host = lower(host)"],
    category: "string",
  },
  upper: {
    name: "upper",
    description: "文字列を大文字に変換します",
    syntax: "upper(<field>)",
    examples: ["eval upper_method = upper(method)"],
    category: "string",
  },
  trim: {
    name: "trim",
    description: "前後の空白を除去します",
    syntax: "trim(<field>)",
    examples: ["eval clean = trim(input)"],
    category: "string",
  },
  substr: {
    name: "substr",
    description: "部分文字列を取得します",
    syntax: "substr(<field>, <start>, [<length>])",
    examples: ["eval prefix = substr(id, 0, 3)"],
    category: "string",
  },
  replace: {
    name: "replace",
    description: "文字列を置換します",
    syntax: 'replace(<field>, "<pattern>", "<replacement>")',
    examples: ['eval clean = replace(message, "error", "ERROR")'],
    category: "string",
  },
  split: {
    name: "split",
    description: "文字列を分割してマルチバリューにします",
    syntax: 'split(<field>, "<delimiter>")',
    examples: ['eval parts = split(path, "/")'],
    category: "string",
  },

  // 数値関数
  abs: {
    name: "abs",
    description: "絶対値を返します",
    syntax: "abs(<number>)",
    examples: ["eval absolute = abs(diff)"],
    category: "numeric",
  },
  ceil: {
    name: "ceil",
    description: "切り上げを返します",
    syntax: "ceil(<number>)",
    examples: ["eval rounded = ceil(price)"],
    category: "numeric",
  },
  floor: {
    name: "floor",
    description: "切り下げを返します",
    syntax: "floor(<number>)",
    examples: ["eval rounded = floor(price)"],
    category: "numeric",
  },
  round: {
    name: "round",
    description: "四捨五入を返します",
    syntax: "round(<number>, [<decimals>])",
    examples: ["eval rounded = round(price, 2)"],
    category: "numeric",
  },
  sqrt: {
    name: "sqrt",
    description: "平方根を返します",
    syntax: "sqrt(<number>)",
    examples: ["eval root = sqrt(value)"],
    category: "numeric",
  },
  pow: {
    name: "pow",
    description: "べき乗を返します",
    syntax: "pow(<base>, <exponent>)",
    examples: ["eval squared = pow(value, 2)"],
    category: "numeric",
  },

  // 条件関数
  if: {
    name: "if",
    description: "条件に基づいて値を返します",
    syntax: "if(<condition>, <true_value>, <false_value>)",
    examples: ['eval status = if(code < 400, "success", "error")'],
    category: "conditional",
  },
  case: {
    name: "case",
    description: "複数条件で値を返します",
    syntax: "case(<cond1>, <val1>, <cond2>, <val2>, ..., <default>)",
    examples: ['eval level = case(code < 300, "info", code < 400, "warn", true(), "error")'],
    category: "conditional",
  },
  coalesce: {
    name: "coalesce",
    description: "最初の非NULLを返します",
    syntax: "coalesce(<field1>, <field2>, ...)",
    examples: ["eval value = coalesce(primary, secondary, default)"],
    category: "conditional",
  },
  isnull: {
    name: "isnull",
    description: "NULLかどうか判定します",
    syntax: "isnull(<field>)",
    examples: ["where isnull(user)"],
    category: "conditional",
  },
  isnotnull: {
    name: "isnotnull",
    description: "NULLでないか判定します",
    syntax: "isnotnull(<field>)",
    examples: ["where isnotnull(user)"],
    category: "conditional",
  },

  // 日時関数
  now: {
    name: "now",
    description: "現在時刻を返します",
    syntax: "now()",
    examples: ["eval current = now()"],
    category: "datetime",
  },
  strftime: {
    name: "strftime",
    description: "日時をフォーマットします",
    syntax: 'strftime(<time>, "<format>")',
    examples: ['eval date = strftime(_time, "%Y-%m-%d")'],
    category: "datetime",
  },
  strptime: {
    name: "strptime",
    description: "文字列を日時にパースします",
    syntax: 'strptime(<string>, "<format>")',
    examples: ['eval timestamp = strptime(date, "%Y-%m-%d")'],
    category: "datetime",
  },
  relative_time: {
    name: "relative_time",
    description: "相対時間を計算します",
    syntax: 'relative_time(<time>, "<modifier>")',
    examples: ['eval yesterday = relative_time(now(), "-1d")'],
    category: "datetime",
  },

  // マルチバリュー関数
  mvcount: {
    name: "mvcount",
    description: "マルチバリューの要素数を返します",
    syntax: "mvcount(<field>)",
    examples: ["eval count = mvcount(tags)"],
    category: "multivalue",
  },
  mvindex: {
    name: "mvindex",
    description: "マルチバリューの指定インデックスを返します",
    syntax: "mvindex(<field>, <index>)",
    examples: ["eval first = mvindex(values, 0)"],
    category: "multivalue",
  },
  mvjoin: {
    name: "mvjoin",
    description: "マルチバリューを文字列に結合します",
    syntax: 'mvjoin(<field>, "<delimiter>")',
    examples: ['eval joined = mvjoin(tags, ",")'],
    category: "multivalue",
  },

  // JSON関数
  json_extract: {
    name: "json_extract",
    description: "JSONから値を抽出します",
    syntax: 'json_extract(<field>, "<path>")',
    examples: ['eval name = json_extract(data, "user.name")'],
    category: "json",
  },
  json_object: {
    name: "json_object",
    description: "JSONオブジェクトを作成します",
    syntax: 'json_object("<key1>", <val1>, "<key2>", <val2>, ...)',
    examples: ['eval obj = json_object("name", user, "count", total)'],
    category: "json",
  },
  json_valid: {
    name: "json_valid",
    description: "有効なJSONか判定します",
    syntax: "json_valid(<field>)",
    examples: ["where json_valid(data)"],
    category: "json",
  },
};

// コマンド名からヘルプを取得
export function getCommandHelp(command: string): CommandHelp | undefined {
  return SPL_COMMANDS[command.toLowerCase()];
}

// 関数名からヘルプを取得
export function getFunctionHelp(funcName: string): FunctionHelp | undefined {
  const name = funcName.toLowerCase();
  return STATS_FUNCTION_HELP[name] || EVAL_FUNCTION_HELP[name];
}

// 全コマンド一覧を取得
export function getAllCommands(): CommandHelp[] {
  return Object.values(SPL_COMMANDS);
}

// カテゴリ別コマンドを取得
export function getCommandsByCategory(category: CommandHelp["category"]): CommandHelp[] {
  return Object.values(SPL_COMMANDS).filter((cmd) => cmd.category === category);
}

// 全関数一覧を取得
export function getAllFunctions(): FunctionHelp[] {
  return [...Object.values(STATS_FUNCTION_HELP), ...Object.values(EVAL_FUNCTION_HELP)];
}

// オートコンプリート用のコマンド名一覧
export function getCommandNames(): string[] {
  return Object.keys(SPL_COMMANDS);
}

// オートコンプリート用の関数名一覧
export function getFunctionNames(): string[] {
  return [
    ...Object.keys(STATS_FUNCTION_HELP),
    ...Object.keys(EVAL_FUNCTION_HELP),
  ];
}
