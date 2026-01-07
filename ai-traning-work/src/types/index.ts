// ログ関連
export interface LogRecord {
  id: string;
  sourceId: string;
  timestamp: Date;
  raw: string;
  parsed: Record<string, unknown> | null;
  level: "info" | "warn" | "error" | "debug" | null;
  [key: string]: unknown;
}

// 時間範囲
export interface TimeRange {
  from: number;
  to: number;
  preset?: string;
}

// パネル位置
export interface PanelPosition {
  x: number;
  y: number;
  w: number;
  h: number;
}

// パネル設定
export interface PanelConfig {
  xAxisField?: string;
  yAxisField?: string;
  seriesField?: string;
  showLegend?: boolean;
  colors?: string[];
}

// ドリルダウン設定
export interface DrilldownConfig {
  enabled: boolean;
  query?: string;
  fields?: string[];
}

// 検索結果
export interface SearchResult {
  success: boolean;
  data?: LogRecord[];
  fields?: string[];
  count?: number;
  executionTime?: number;
  error?: string;
}

// アラート条件
export type AlertCondition = "gt" | "lt" | "eq" | "ne" | "gte" | "lte";

// 練習問題
export interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate";
  category: string;
  expectedQuery?: string;
  hints: string[];
  sampleData?: Record<string, unknown>[];
}

// 練習問題進捗
export interface PracticeProgress {
  problemId: string;
  status: "not_started" | "in_progress" | "completed";
  lastAnswer?: string;
  completedAt?: Date;
}

// SPL関連
export interface SPLCommand {
  name: string;
  description: string;
  syntax: string;
  examples: string[];
}

export interface SPLSuggestion {
  type: "command" | "field" | "function" | "operator";
  value: string;
  description?: string;
}

// API レスポンス
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// 統計情報
export interface Stats {
  totalLogs: number;
  todayEvents: number;
  sources: number;
  dashboards: number;
  alerts: {
    total: number;
    triggered: number;
  };
}
