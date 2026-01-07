import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// ログソース
export const logSources = sqliteTable("log_sources", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type", {
    enum: ["web", "app", "system", "gc", "k8s", "db"],
  }).notNull(),
  format: text("format").notNull(),
  config: text("config"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ログデータ
export const logs = sqliteTable("logs", {
  id: text("id").primaryKey(),
  sourceId: text("source_id")
    .notNull()
    .references(() => logSources.id, { onDelete: "cascade" }),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull(),
  raw: text("raw").notNull(),
  parsed: text("parsed"),
  level: text("level", { enum: ["info", "warn", "error", "debug"] }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// フィールド抽出ルール
export const fields = sqliteTable("fields", {
  id: text("id").primaryKey(),
  sourceId: text("source_id").references(() => logSources.id, {
    onDelete: "cascade",
  }),
  name: text("name").notNull(),
  pattern: text("pattern").notNull(),
  type: text("type", { enum: ["string", "number", "date"] })
    .notNull()
    .default("string"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// ダッシュボード
export const dashboards = sqliteTable("dashboards", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// パネル
export const panels = sqliteTable("panels", {
  id: text("id").primaryKey(),
  dashboardId: text("dashboard_id")
    .notNull()
    .references(() => dashboards.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  type: text("type", {
    enum: ["line", "bar", "pie", "table", "single"],
  }).notNull(),
  query: text("query").notNull(),
  config: text("config"),
  position: text("position").notNull(),
  drilldown: text("drilldown"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// アラート
export const alerts = sqliteTable("alerts", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  query: text("query").notNull(),
  condition: text("condition", {
    enum: ["gt", "lt", "eq", "ne", "gte", "lte"],
  }).notNull(),
  threshold: real("threshold").notNull(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// アラート履歴
export const alertHistory = sqliteTable("alert_history", {
  id: text("id").primaryKey(),
  alertId: text("alert_id")
    .notNull()
    .references(() => alerts.id, { onDelete: "cascade" }),
  triggeredAt: integer("triggered_at", { mode: "timestamp" }).notNull(),
  message: text("message").notNull(),
  data: text("data"),
});

// 保存済み検索
export const savedSearches = sqliteTable("saved_searches", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  query: text("query").notNull(),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// 検索履歴
export const searchHistory = sqliteTable("search_history", {
  id: text("id").primaryKey(),
  query: text("query").notNull(),
  executedAt: integer("executed_at", { mode: "timestamp" }).notNull(),
  resultCount: integer("result_count"),
});

// ルックアップテーブル
export const lookups = sqliteTable("lookups", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  data: text("data").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// 練習問題進捗
export const practiceProgress = sqliteTable("practice_progress", {
  id: text("id").primaryKey(),
  problemId: text("problem_id").notNull().unique(),
  status: text("status", {
    enum: ["not_started", "in_progress", "completed"],
  })
    .notNull()
    .default("not_started"),
  lastAnswer: text("last_answer"),
  completedAt: integer("completed_at", { mode: "timestamp" }),
});

// 型エクスポート
export type LogSource = typeof logSources.$inferSelect;
export type NewLogSource = typeof logSources.$inferInsert;
export type Log = typeof logs.$inferSelect;
export type NewLog = typeof logs.$inferInsert;
export type Field = typeof fields.$inferSelect;
export type NewField = typeof fields.$inferInsert;
export type Dashboard = typeof dashboards.$inferSelect;
export type NewDashboard = typeof dashboards.$inferInsert;
export type Panel = typeof panels.$inferSelect;
export type NewPanel = typeof panels.$inferInsert;
export type Alert = typeof alerts.$inferSelect;
export type NewAlert = typeof alerts.$inferInsert;
export type AlertHistoryRecord = typeof alertHistory.$inferSelect;
export type NewAlertHistoryRecord = typeof alertHistory.$inferInsert;
export type SavedSearch = typeof savedSearches.$inferSelect;
export type NewSavedSearch = typeof savedSearches.$inferInsert;
export type SearchHistoryRecord = typeof searchHistory.$inferSelect;
export type NewSearchHistoryRecord = typeof searchHistory.$inferInsert;
export type Lookup = typeof lookups.$inferSelect;
export type NewLookup = typeof lookups.$inferInsert;
export type PracticeProgressRecord = typeof practiceProgress.$inferSelect;
export type NewPracticeProgressRecord = typeof practiceProgress.$inferInsert;
