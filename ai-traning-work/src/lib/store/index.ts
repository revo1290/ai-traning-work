// Zustand Store
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { RawLog, generateAllSampleData } from "../data/sample-generator";
import { SPLExecutor, ExecutionResult } from "../spl/executor";

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
  resultLimit: number;

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

  // 練習問題
  practiceProgress: PracticeProgress[];

  // アクション
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setResultLimit: (limit: number) => void;

  loadSampleData: () => void;
  clearData: () => void;
  executeSearch: (query: string) => ExecutionResult;
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

  // フィールド
  addFieldExtraction: (extraction: Omit<FieldExtraction, "id" | "createdAt">) => void;
  deleteFieldExtraction: (id: string) => void;

  // 練習問題
  updatePracticeProgress: (problemId: string, status: PracticeProgress["status"], answer?: string) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 11);

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 初期状態
      theme: "dark",
      sidebarCollapsed: false,
      resultLimit: 100,
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

      setResultLimit: (limit: number) => {
        set({ resultLimit: limit });
      },

      // データ読み込み
      loadSampleData: () => {
        const { sources, logs } = generateAllSampleData();
        set({
          sources: sources.map((s) => ({ ...s, createdAt: new Date() })),
          logs,
          isDataLoaded: true,
        });
      },

      clearData: () => {
        set({
          sources: [],
          logs: [],
          isDataLoaded: false,
        });
      },

      // 検索実行
      executeSearch: (query: string) => {
        const { logs } = get();
        const data = logs.map((log) => ({
          ...log.parsed,
          _time: log.timestamp,
          _raw: log.raw,
          level: log.level,
          sourceId: log.sourceId,
        }));

        const executor = new SPLExecutor(data);
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
        resultLimit: state.resultLimit,
        sources: state.sources,
        logs: state.logs,
        isDataLoaded: state.isDataLoaded,
        searchHistory: state.searchHistory,
        savedSearches: state.savedSearches,
        dashboards: state.dashboards,
        alerts: state.alerts,
        alertHistory: state.alertHistory,
        fieldExtractions: state.fieldExtractions,
        practiceProgress: state.practiceProgress,
      }),
    }
  )
);
