// Zustand Store
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { RawLog, generateAllSampleData } from "../data/sample-generator";
import { SPLExecutor } from "../spl/executor";
import { ExecutionResult } from "../spl/types";

export interface LogSource {
  id: string;
  name: string;
  type: string;
  format: string;
  createdAt: Date;
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  executedAt: Date;
  resultCount: number;
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  description?: string;
  createdAt: Date;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  panels: Panel[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Panel {
  id: string;
  title: string;
  type: "line" | "bar" | "pie" | "table" | "single";
  query: string;
  position: { x: number; y: number; w: number; h: number };
  config?: Record<string, unknown>;
}

export interface Alert {
  id: string;
  name: string;
  query: string;
  condition: "gt" | "lt" | "eq" | "ne" | "gte" | "lte";
  threshold: number;
  enabled: boolean;
  createdAt: Date;
}

export interface AlertHistoryItem {
  id: string;
  alertId: string;
  alertName: string;
  triggeredAt: Date;
  message: string;
  value: number;
}

export interface FieldExtraction {
  id: string;
  sourceId?: string;
  name: string;
  pattern: string;
  type: "string" | "number" | "date";
  createdAt: Date;
}

export interface LookupTable {
  id: string;
  name: string;
  columns: string[];
  rows: Record<string, unknown>[];
  createdAt: Date;
}

export interface PracticeProgress {
  problemId: string;
  status: "not_started" | "in_progress" | "completed";
  lastAnswer?: string;
  completedAt?: Date;
}

interface AppState {
  // UI設定
  theme: "light" | "dark";
  sidebarCollapsed: boolean;

  // データ
  sources: LogSource[];
  logs: RawLog[];
  isDataLoaded: boolean;

  // 検索
  searchHistory: SearchHistoryItem[];
  savedSearches: SavedSearch[];
  currentSearchResult: ExecutionResult | null;

  // ダッシュボード
  dashboards: Dashboard[];

  // アラート
  alerts: Alert[];
  alertHistory: AlertHistoryItem[];

  // フィールド
  fieldExtractions: FieldExtraction[];

  // Lookupテーブル
  lookupTables: LookupTable[];

  // 練習問題
  practiceProgress: PracticeProgress[];

  // アクション
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  loadSampleData: () => void;
  loadCustomData: (name: string, data: Record<string, unknown>[], format: string) => void;
  clearData: () => void;
  clearAllData: () => void;
  executeSearch: (query: string, options?: { timeRange?: string }) => ExecutionResult;
  addSearchHistory: (query: string, resultCount: number) => void;
  saveSearch: (name: string, query: string, description?: string) => void;
  deleteSavedSearch: (id: string) => void;

  // ダッシュボード
  createDashboard: (name: string, description?: string) => string;
  updateDashboard: (id: string, updates: Partial<Dashboard>) => void;
  deleteDashboard: (id: string) => void;
  addPanel: (dashboardId: string, panel: Omit<Panel, "id">) => void;
  updatePanel: (dashboardId: string, panelId: string, updates: Partial<Panel>) => void;
  deletePanel: (dashboardId: string, panelId: string) => void;

  // アラート
  createAlert: (alert: Omit<Alert, "id" | "createdAt">) => void;
  updateAlert: (id: string, updates: Partial<Alert>) => void;
  deleteAlert: (id: string) => void;
  addAlertHistory: (alertId: string, alertName: string, message: string, value: number) => void;
  runAlertTest: (alertId: string, options?: { timeRange?: string }) => { triggered: boolean; value: number; message: string } | null;

  // フィールド
  addFieldExtraction: (extraction: Omit<FieldExtraction, "id" | "createdAt">) => void;
  deleteFieldExtraction: (id: string) => void;

  // Lookupテーブル
  addLookupTable: (table: Omit<LookupTable, "id" | "createdAt">) => void;
  deleteLookupTable: (id: string) => void;

  // 練習問題
  updatePracticeProgress: (problemId: string, status: PracticeProgress["status"], answer?: string) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

// 時間範囲プリセット（ミリ秒）
const TIME_RANGE_MS: Record<string, number> = {
  all: 0,
  custom: 0,
  "15m": 15 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "4h": 4 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 初期状態
      theme: "dark",
      sidebarCollapsed: false,
      sources: [],
      logs: [],
      isDataLoaded: false,
      searchHistory: [],
      savedSearches: [],
      currentSearchResult: null,
      dashboards: [],
      alerts: [],
      alertHistory: [],
      fieldExtractions: [],
      lookupTables: [],
      practiceProgress: [],

      // UI設定
      toggleTheme: () => {
        set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" }));
      },

      setTheme: (theme: "light" | "dark") => {
        set({ theme });
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },

      setSidebarCollapsed: (collapsed: boolean) => {
        set({ sidebarCollapsed: collapsed });
      },

      // データ読み込み
      loadSampleData: () => {
        const { sources, logs } = generateAllSampleData();
        // サンプルLookupテーブル（host名とオーナー情報）
        const hostOwnerLookup = {
          name: "host_owners",
          columns: ["host", "owner", "team"],
          rows: [
            { host: "webserver-01", owner: "ops-team", team: "インフラ" },
            { host: "app-01", owner: "dev-team", team: "開発" },
            { host: "app-02", owner: "dev-team", team: "開発" },
            { host: "db-01", owner: "dba-team", team: "DB" },
            { host: "k8s-node-1", owner: "k8s-team", team: "コンテナ" },
          ],
        };
        set((state) => ({
          sources: sources.map((s) => ({ ...s, createdAt: new Date() })),
          logs,
          isDataLoaded: true,
          lookupTables: state.lookupTables.some((lt) => lt.name === "host_owners")
            ? state.lookupTables
            : [
                ...state.lookupTables,
                { ...hostOwnerLookup, id: generateId(), createdAt: new Date() },
              ],
        }));
      },

      loadCustomData: (name: string, data: Record<string, unknown>[], format: string) => {
        const sourceId = generateId();
        const newSource: LogSource = {
          id: sourceId,
          name,
          type: "custom",
          format,
          createdAt: new Date(),
        };

        const newLogs: RawLog[] = data.map((item, index) => {
          const levelStr = item.level as string | undefined;
          const validLevels = ["info", "warn", "error", "debug"] as const;
          const level = validLevels.includes(levelStr as typeof validLevels[number])
            ? (levelStr as "info" | "warn" | "error" | "debug")
            : "info";

          // タイムスタンプを取得（_time, timestamp, date などを優先）
          const timeVal = item._time ?? item.timestamp ?? item.date ?? item["@timestamp"] ?? item.created_at;
          const timestamp =
            timeVal instanceof Date
              ? timeVal
              : typeof timeVal === "number"
              ? new Date(timeVal < 1e12 ? timeVal * 1000 : timeVal)
              : timeVal
              ? new Date(String(timeVal))
              : new Date();

          return {
            id: `${sourceId}-${index}`,
            sourceId,
            timestamp: isNaN(timestamp.getTime()) ? new Date() : timestamp,
            raw: (item._raw as string) ?? JSON.stringify(item),
            level,
            parsed: { ...item, _time: timestamp, _raw: (item._raw as string) ?? JSON.stringify(item) },
          };
        });

        set((state) => ({
          sources: [...state.sources, newSource],
          logs: [...state.logs, ...newLogs],
          isDataLoaded: true,
        }));
      },

      clearData: () => {
        set({
          sources: [],
          logs: [],
          isDataLoaded: false,
        });
      },

      clearAllData: () => {
        set({
          sources: [],
          logs: [],
          isDataLoaded: false,
          searchHistory: [],
          savedSearches: [],
          currentSearchResult: null,
          dashboards: [],
          alerts: [],
          alertHistory: [],
          fieldExtractions: [],
          lookupTables: [],
          practiceProgress: [],
        });
      },

      // 検索実行
      executeSearch: (query: string, options?: { timeRange?: string }) => {
        const { logs, sources, fieldExtractions, lookupTables } = get();
        const sourceMap = new Map(sources.map((s) => [s.id, s]));
        const timeRangeMs = options?.timeRange ? TIME_RANGE_MS[options.timeRange] ?? 0 : 0;
        const cutoffTime = timeRangeMs > 0 ? Date.now() - timeRangeMs : 0;

        // ベースデータ構築（source/sourcetype/index追加）
        let data = logs.map((log) => {
          const source = sourceMap.get(log.sourceId);
          return {
            ...log.parsed,
            _time: log.timestamp,
            _raw: log.raw,
            level: log.level,
            sourceId: log.sourceId,
            source: source?.name ?? log.sourceId,
            sourcetype: source?.format ?? "unknown",
            index: "main",
          };
        });

        // 時間範囲フィルタ
        if (cutoffTime > 0) {
          data = data.filter((r) => {
            const t = r._time;
            const ts = t instanceof Date ? t.getTime() : typeof t === "string" ? new Date(t).getTime() : Number(t);
            return !isNaN(ts) && ts >= cutoffTime;
          });
        }

        // フィールド抽出ルール適用
        for (const rule of fieldExtractions) {
          try {
            const regex = new RegExp(rule.pattern);
            data = data.map((record) => {
              const raw = String(record._raw ?? "");
              const match = raw.match(regex);
              if (!match?.groups) return record;
              const next = { ...record };
              for (const [name, value] of Object.entries(match.groups)) {
                if (value !== undefined) {
                  if (rule.type === "number") next[name] = Number(value);
                  else if (rule.type === "date") next[name] = new Date(value);
                  else next[name] = value;
                }
              }
              return next;
            });
          } catch {
            // 無効な正規表現はスキップ
          }
        }

        // LookupテーブルをMapに変換
        const lookupMap = new Map<string, Record<string, unknown>[]>();
        for (const lt of lookupTables) {
          lookupMap.set(lt.name, lt.rows);
        }

        const executor = new SPLExecutor(data, lookupMap);
        const result = executor.execute(query);

        set({ currentSearchResult: result });
        return result;
      },

      addSearchHistory: (query: string, resultCount: number) => {
        set((state) => ({
          searchHistory: [
            {
              id: generateId(),
              query,
              executedAt: new Date(),
              resultCount,
            },
            ...state.searchHistory.slice(0, 99),
          ],
        }));
      },

      saveSearch: (name: string, query: string, description?: string) => {
        set((state) => ({
          savedSearches: [
            ...state.savedSearches,
            {
              id: generateId(),
              name,
              query,
              description,
              createdAt: new Date(),
            },
          ],
        }));
      },

      deleteSavedSearch: (id: string) => {
        set((state) => ({
          savedSearches: state.savedSearches.filter((s) => s.id !== id),
        }));
      },

      // ダッシュボード
      createDashboard: (name: string, description?: string) => {
        const id = generateId();
        set((state) => ({
          dashboards: [
            ...state.dashboards,
            {
              id,
              name,
              description,
              panels: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        }));
        return id;
      },

      updateDashboard: (id: string, updates: Partial<Dashboard>) => {
        set((state) => ({
          dashboards: state.dashboards.map((d) =>
            d.id === id ? { ...d, ...updates, updatedAt: new Date() } : d
          ),
        }));
      },

      deleteDashboard: (id: string) => {
        set((state) => ({
          dashboards: state.dashboards.filter((d) => d.id !== id),
        }));
      },

      addPanel: (dashboardId: string, panel: Omit<Panel, "id">) => {
        set((state) => ({
          dashboards: state.dashboards.map((d) =>
            d.id === dashboardId
              ? {
                  ...d,
                  panels: [...d.panels, { ...panel, id: generateId() }],
                  updatedAt: new Date(),
                }
              : d
          ),
        }));
      },

      updatePanel: (dashboardId: string, panelId: string, updates: Partial<Panel>) => {
        set((state) => ({
          dashboards: state.dashboards.map((d) =>
            d.id === dashboardId
              ? {
                  ...d,
                  panels: d.panels.map((p) =>
                    p.id === panelId ? { ...p, ...updates } : p
                  ),
                  updatedAt: new Date(),
                }
              : d
          ),
        }));
      },

      deletePanel: (dashboardId: string, panelId: string) => {
        set((state) => ({
          dashboards: state.dashboards.map((d) =>
            d.id === dashboardId
              ? {
                  ...d,
                  panels: d.panels.filter((p) => p.id !== panelId),
                  updatedAt: new Date(),
                }
              : d
          ),
        }));
      },

      // アラート
      createAlert: (alert: Omit<Alert, "id" | "createdAt">) => {
        set((state) => ({
          alerts: [
            ...state.alerts,
            {
              ...alert,
              id: generateId(),
              createdAt: new Date(),
            },
          ],
        }));
      },

      updateAlert: (id: string, updates: Partial<Alert>) => {
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        }));
      },

      deleteAlert: (id: string) => {
        set((state) => ({
          alerts: state.alerts.filter((a) => a.id !== id),
        }));
      },

      addAlertHistory: (alertId: string, alertName: string, message: string, value: number) => {
        set((state) => ({
          alertHistory: [
            {
              id: generateId(),
              alertId,
              alertName,
              triggeredAt: new Date(),
              message,
              value,
            },
            ...state.alertHistory,
          ],
        }));
      },

      runAlertTest: (alertId: string, options?: { timeRange?: string }) => {
        const { alerts } = get();
        const alert = alerts.find((a) => a.id === alertId);
        if (!alert) return null;
        const result = get().executeSearch(alert.query, options);
        if (!result.success || !result.data.length) {
          return { triggered: false, value: 0, message: "検索結果なし、またはエラー" };
        }
        const value = typeof result.data[0].count === "number" ? result.data[0].count : result.count;
        const numValue = Number(value);
        let triggered = false;
        switch (alert.condition) {
          case "gt": triggered = numValue > alert.threshold; break;
          case "gte": triggered = numValue >= alert.threshold; break;
          case "lt": triggered = numValue < alert.threshold; break;
          case "lte": triggered = numValue <= alert.threshold; break;
          case "eq": triggered = numValue === alert.threshold; break;
          case "ne": triggered = numValue !== alert.threshold; break;
        }
        if (triggered) {
          get().addAlertHistory(alertId, alert.name, `値 ${numValue} が閾値 ${alert.threshold} を満たしました`, numValue);
        }
        return {
          triggered,
          value: numValue,
          message: triggered ? `アラート発火: 値 ${numValue}` : `条件未達: 値 ${numValue} (閾値 ${alert.condition} ${alert.threshold})`,
        };
      },

      // フィールド
      addFieldExtraction: (extraction: Omit<FieldExtraction, "id" | "createdAt">) => {
        set((state) => ({
          fieldExtractions: [
            ...state.fieldExtractions,
            {
              ...extraction,
              id: generateId(),
              createdAt: new Date(),
            },
          ],
        }));
      },

      deleteFieldExtraction: (id: string) => {
        set((state) => ({
          fieldExtractions: state.fieldExtractions.filter((f) => f.id !== id),
        }));
      },

      addLookupTable: (table: Omit<LookupTable, "id" | "createdAt">) => {
        set((state) => ({
          lookupTables: [
            ...state.lookupTables,
            { ...table, id: generateId(), createdAt: new Date() },
          ],
        }));
      },

      deleteLookupTable: (id: string) => {
        set((state) => ({
          lookupTables: state.lookupTables.filter((lt) => lt.id !== id),
        }));
      },

      // 練習問題
      updatePracticeProgress: (
        problemId: string,
        status: PracticeProgress["status"],
        answer?: string
      ) => {
        set((state) => {
          const existing = state.practiceProgress.find((p) => p.problemId === problemId);
          if (existing) {
            return {
              practiceProgress: state.practiceProgress.map((p) =>
                p.problemId === problemId
                  ? {
                      ...p,
                      status,
                      lastAnswer: answer ?? p.lastAnswer,
                      completedAt: status === "completed" ? new Date() : p.completedAt,
                    }
                  : p
              ),
            };
          } else {
            return {
              practiceProgress: [
                ...state.practiceProgress,
                {
                  problemId,
                  status,
                  lastAnswer: answer,
                  completedAt: status === "completed" ? new Date() : undefined,
                },
              ],
            };
          }
        });
      },
    }),
    {
      name: "splunk-training-store",
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        sources: state.sources,
        logs: state.logs,
        isDataLoaded: state.isDataLoaded,
        searchHistory: state.searchHistory,
        savedSearches: state.savedSearches,
        dashboards: state.dashboards,
        alerts: state.alerts,
        alertHistory: state.alertHistory,
        fieldExtractions: state.fieldExtractions,
        lookupTables: state.lookupTables,
        practiceProgress: state.practiceProgress,
      }),
    }
  )
);
