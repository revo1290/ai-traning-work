// Token types
export type TokenType =
  | "PIPE"
  | "COMMA"
  | "EQUALS"
  | "NOT_EQUALS"
  | "GREATER"
  | "GREATER_EQ"
  | "LESS"
  | "LESS_EQ"
  | "LPAREN"
  | "RPAREN"
  | "LBRACKET"
  | "RBRACKET"
  | "KEYWORD"
  | "IDENTIFIER"
  | "STRING"
  | "NUMBER"
  | "OPERATOR"
  | "WILDCARD"
  | "DOT"
  | "EOF";

export interface Token {
  type: TokenType;
  value: string;
  position: number;
}

// SPL Keywords - 本番Splunk相当のコマンド
export const KEYWORDS = [
  // 基本検索
  "search",
  "where",
  "table",
  "fields",
  // ソート・制限
  "sort",
  "head",
  "tail",
  "reverse",
  "dedup",
  "uniq",
  // 統計・集計
  "stats",
  "eventstats",
  "streamstats",
  "top",
  "rare",
  "timechart",
  "chart",
  "addtotals",
  "addcoltotals",
  // 変換・計算
  "eval",
  "rex",
  "rename",
  "replace",
  "fillnull",
  "convert",
  "bin",
  "bucket",
  // マルチバリュー
  "makemv",
  "mvexpand",
  "mvcombine",
  "mvzip",
  // JSON/XML
  "spath",
  "xpath",
  // 結合・追加
  "lookup",
  "inputlookup",
  "outputlookup",
  "join",
  "append",
  "appendpipe",
  "union",
  // トランザクション
  "transaction",
  // フォーマット
  "format",
  "return",
  "outputcsv",
  "outputtext",
  // フィルタリング
  "regex",
  "multisearch",
  // その他
  "abstract",
  "accum",
  "anomalydetection",
  "autoregress",
  "coalesce",
  "collect",
  "contingency",
  "correlate",
  "delta",
  "diff",
  "erex",
  "eventcount",
  "extract",
  "fieldformat",
  "fieldsummary",
  "gauge",
  "gentimes",
  "geom",
  "geostats",
  "highlight",
  "history",
  "iconify",
  "inputcsv",
  "iplocation",
  "kmeans",
  "kvform",
  "loadjob",
  "localize",
  "localop",
  "makecontinuous",
  "makeresults",
  "map",
  "metadata",
  "metasearch",
  "nomv",
  "outlier",
  "outputtext",
  "overlap",
  "pivot",
  "predict",
  "rangemap",
  "rare",
  "redistribute",
  "reltime",
  "require",
  "rest",
  "rtorder",
  "runshellscript",
  "savedsearch",
  "script",
  "scrub",
  "search",
  "searchtxn",
  "selfjoin",
  "sendemail",
  "set",
  "setfields",
  "sichart",
  "sirare",
  "sistats",
  "sitimechart",
  "sitop",
  "sort",
  "spath",
  "strcat",
  "streamstats",
  "tags",
  "tail",
  "timewrap",
  "tojson",
  "top",
  "transaction",
  "transpose",
  "trendline",
  "tscollect",
  "tstats",
  "typeahead",
  "typelearner",
  "typer",
  "untable",
  "where",
  "x11",
  "xmlkv",
  "xmlunescape",
  "xyseries",
] as const;

export type Keyword = (typeof KEYWORDS)[number];

// Operators
export const OPERATORS = ["AND", "OR", "NOT", "AS", "BY", "IN", "LIKE", "IS", "OVER", "OUTPUT", "OUTPUTNEW"] as const;
export type Operator = (typeof OPERATORS)[number];

// Stats functions - 本番Splunk相当
export const STATS_FUNCTIONS = [
  // 基本集計
  "count",
  "sum",
  "avg",
  "mean",
  "max",
  "min",
  "range",
  // 統計
  "stdev",
  "stdevp",
  "var",
  "varp",
  "median",
  "mode",
  "perc",
  "exactperc",
  "upperperc",
  "percentile",
  // ユニーク
  "dc",
  "estdc",
  "estdc_error",
  // リスト・値
  "values",
  "list",
  "first",
  "last",
  "earliest",
  "latest",
  "earliest_time",
  "latest_time",
  // 条件付き
  "rate",
  "per_second",
  "per_minute",
  "per_hour",
  "per_day",
] as const;
export type StatsFunction = (typeof STATS_FUNCTIONS)[number];

// Eval functions - 本番Splunk相当
export const EVAL_FUNCTIONS = [
  // 文字列
  "len", "lower", "upper", "trim", "ltrim", "rtrim",
  "substr", "replace", "split", "mvjoin",
  "urldecode", "urlencode",
  "tostring", "printf", "tonumber",
  // 数値
  "abs", "ceil", "floor", "round", "sqrt", "pow", "exp", "ln", "log",
  "pi", "random", "sigfig",
  // 条件
  "if", "case", "coalesce", "nullif", "validate",
  "isnull", "isnotnull", "isnum", "isstr", "isint",
  // 比較
  "like", "match", "cidrmatch", "in",
  "searchmatch", "true", "false", "null",
  // 時間
  "now", "time", "relative_time", "strftime", "strptime",
  // マルチバリュー
  "mvcount", "mvindex", "mvfilter", "mvfind",
  "mvappend", "mvdedup", "mvsort", "mvrange", "mvzip",
  // 暗号
  "md5", "sha1", "sha256", "sha512",
  // JSON
  "json_object", "json_array", "json_extract", "json_keys",
  "json_set", "json_valid",
  // その他
  "typeof", "commands", "isbool",
] as const;
export type EvalFunction = (typeof EVAL_FUNCTIONS)[number];

// AST Types
export interface SPLQuery {
  commands: Command[];
}

export type Command =
  | SearchCommand
  | WhereCommand
  | TableCommand
  | SortCommand
  | HeadCommand
  | TailCommand
  | DedupCommand
  | FieldsCommand
  | StatsCommand
  | EventstatsCommand
  | StreamstatsCommand
  | TopCommand
  | RareCommand
  | TimechartCommand
  | ChartCommand
  | EvalCommand
  | RexCommand
  | RenameCommand
  | SpathCommand
  | LookupCommand
  | JoinCommand
  | TransactionCommand
  | FillnullCommand
  | ReplaceCommand
  | RegexCommand
  | BinCommand
  | MakemvCommand
  | MvexpandCommand
  | AppendCommand
  | AddtotalsCommand
  | ReverseCommand
  | UniqCommand
  | FormatCommand
  | ReturnCommand
  | InputlookupCommand
  | MakeresultsCommand
  | ConvertCommand;

export interface SearchCommand {
  type: "search";
  conditions: SearchCondition[];
}

export interface SearchCondition {
  field?: string;
  operator: "=" | "!=" | ">" | ">=" | "<" | "<=" | "LIKE" | "IN";
  value: string | string[];
  isNegated: boolean;
  logicalOp?: "AND" | "OR";
}

export interface WhereCommand {
  type: "where";
  expression: Expression;
}

export interface Expression {
  type: "comparison" | "logical" | "function" | "field" | "literal" | "arithmetic";
  operator?: string;
  left?: Expression | string;
  right?: Expression | string | number;
  value?: string | number | boolean | null;
  name?: string;
  args?: Expression[];
}

export interface TableCommand {
  type: "table";
  fields: string[];
}

export interface SortCommand {
  type: "sort";
  fields: Array<{ field: string; direction: "asc" | "desc" }>;
  limit?: number;
}

export interface HeadCommand {
  type: "head";
  count: number;
  keeplast?: boolean;
  null?: boolean;
}

export interface TailCommand {
  type: "tail";
  count: number;
}

export interface DedupCommand {
  type: "dedup";
  fields: string[];
  consecutive?: boolean;
  keepevents?: boolean;
  keepempty?: boolean;
  sortby?: string;
}

export interface FieldsCommand {
  type: "fields";
  mode: "include" | "exclude";
  fields: string[];
}

export interface StatsCommand {
  type: "stats";
  aggregations: Aggregation[];
  groupBy: string[];
  dedup_splitvals?: boolean;
  allnum?: boolean;
}

export interface EventstatsCommand {
  type: "eventstats";
  aggregations: Aggregation[];
  groupBy: string[];
}

export interface StreamstatsCommand {
  type: "streamstats";
  aggregations: Aggregation[];
  groupBy: string[];
  window?: number;
  current?: boolean;
  global?: boolean;
  reset_on_change?: boolean;
}

export interface Aggregation {
  function: StatsFunction;
  field?: string;
  alias?: string;
}

export interface TopCommand {
  type: "top";
  count: number;
  field: string;
  by?: string[];
  showperc?: boolean;
  showcount?: boolean;
}

export interface RareCommand {
  type: "rare";
  count: number;
  field: string;
  by?: string[];
  showperc?: boolean;
  showcount?: boolean;
}

export interface TimechartCommand {
  type: "timechart";
  span: string;
  aggregations: Aggregation[];
  splitBy?: string;
  limit?: number;
  useother?: boolean;
  usenull?: boolean;
}

export interface ChartCommand {
  type: "chart";
  aggregations: Aggregation[];
  over: string;
  by?: string;
  limit?: number;
  useother?: boolean;
  usenull?: boolean;
}

export interface EvalCommand {
  type: "eval";
  field: string;
  expression: Expression;
}

export interface RexCommand {
  type: "rex";
  field: string;
  pattern: string;
  mode?: "sed" | "match";
  max_match?: number;
  offset_field?: string;
}

export interface RenameCommand {
  type: "rename";
  renames: Array<{ from: string; to: string }>;
}

export interface SpathCommand {
  type: "spath";
  input?: string;
  output?: string;
  path?: string;
}

export interface LookupCommand {
  type: "lookup";
  table: string;
  field: string;
  outputFields: string[];
  output?: boolean;
}

export interface JoinCommand {
  type: "join";
  joinType: "inner" | "left" | "outer";
  fields: string[];
  subsearch: string;
  max?: number;
}

export interface TransactionCommand {
  type: "transaction";
  fields: string[];
  startswith?: string;
  endswith?: string;
  maxspan?: string;
  maxpause?: string;
  maxevents?: number;
  keepevicted?: boolean;
}

export interface FillnullCommand {
  type: "fillnull";
  value?: string | number;
  fields?: string[];
}

export interface ReplaceCommand {
  type: "replace";
  replacements: Array<{ pattern: string; replacement: string }>;
  fields?: string[];
}

export interface RegexCommand {
  type: "regex";
  field?: string;
  pattern: string;
  isNegated?: boolean;
}

export interface BinCommand {
  type: "bin";
  field: string;
  span?: string | number;
  bins?: number;
  minspan?: string;
  start?: number;
  end?: number;
  aligntime?: string;
  alias?: string;
}

export interface MakemvCommand {
  type: "makemv";
  field: string;
  delim?: string;
  allowempty?: boolean;
  setsv?: boolean;
}

export interface MvexpandCommand {
  type: "mvexpand";
  field: string;
  limit?: number;
}

export interface AppendCommand {
  type: "append";
  subsearch: string;
  extendtimerange?: boolean;
}

export interface AddtotalsCommand {
  type: "addtotals";
  row?: boolean;
  col?: boolean;
  labelfield?: string;
  label?: string;
  fields?: string[];
}

export interface ReverseCommand {
  type: "reverse";
}

export interface UniqCommand {
  type: "uniq";
}

export interface FormatCommand {
  type: "format";
  mvsep?: string;
  maxresults?: number;
  emptystr?: string;
}

export interface ReturnCommand {
  type: "return";
  count?: number;
  fields?: string[];
  values?: boolean;
}

export interface InputlookupCommand {
  type: "inputlookup";
  table: string;
  start?: number;
  max?: number;
  where?: Expression;
  append?: boolean;
}

export interface MakeresultsCommand {
  type: "makeresults";
  count?: number;
  annotate?: boolean;
  splunk_server?: string;
  splunk_server_group?: string;
}

export interface ConvertCommand {
  type: "convert";
  conversions: Array<{
    function: "auto" | "dur2sec" | "mstime" | "memk" | "none" | "num" | "rmcomma" | "rmunit" | "ctime" | "mktime";
    field: string;
    alias?: string;
  }>;
  timeformat?: string;
}

// Execution result with enhanced error info
export interface ExecutionResult {
  success: boolean;
  data: Record<string, unknown>[];
  fields: string[];
  count: number;
  executionTime: number;
  error?: ExecutionError;
  warnings?: string[];
}

export interface ExecutionError {
  code: ErrorCode;
  message: string;
  command?: string;
  position?: number;
  suggestion?: string;
}

export type ErrorCode =
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
