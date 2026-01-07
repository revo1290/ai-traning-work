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

// SPL Keywords
export const KEYWORDS = [
  "search",
  "where",
  "table",
  "sort",
  "head",
  "tail",
  "dedup",
  "fields",
  "stats",
  "top",
  "rare",
  "timechart",
  "eval",
  "rex",
  "rename",
  "spath",
  "lookup",
  "join",
  "transaction",
] as const;

export type Keyword = (typeof KEYWORDS)[number];

// Operators
export const OPERATORS = ["AND", "OR", "NOT", "AS", "BY", "IN", "LIKE", "IS"] as const;
export type Operator = (typeof OPERATORS)[number];

// Stats functions
export const STATS_FUNCTIONS = [
  "count",
  "sum",
  "avg",
  "max",
  "min",
  "values",
  "dc",
  "list",
  "first",
  "last",
  "stdev",
  "median",
] as const;
export type StatsFunction = (typeof STATS_FUNCTIONS)[number];

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
  | TopCommand
  | RareCommand
  | TimechartCommand
  | EvalCommand
  | RexCommand
  | RenameCommand
  | SpathCommand
  | LookupCommand;

export interface SearchCommand {
  type: "search";
  conditions: SearchCondition[];
}

export interface SearchCondition {
  field?: string;
  operator: "=" | "!=" | ">" | ">=" | "<" | "<=" | "LIKE";
  value: string;
  isNegated: boolean;
  logicalOp?: "AND" | "OR";
}

export interface WhereCommand {
  type: "where";
  expression: Expression;
}

export interface Expression {
  type: "comparison" | "logical" | "function" | "field" | "literal";
  operator?: string;
  left?: Expression | string;
  right?: Expression | string | number;
  value?: string | number | boolean;
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
}

export interface HeadCommand {
  type: "head";
  count: number;
}

export interface TailCommand {
  type: "tail";
  count: number;
}

export interface DedupCommand {
  type: "dedup";
  fields: string[];
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
}

export interface RareCommand {
  type: "rare";
  count: number;
  field: string;
}

export interface TimechartCommand {
  type: "timechart";
  span: string;
  aggregations: Aggregation[];
  splitBy?: string;
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
}

// Execution result
export interface ExecutionResult {
  data: Record<string, unknown>[];
  fields: string[];
  count: number;
  executionTime: number;
}
