"use server";

import { db } from "@/lib/db";
import {
  logSources,
  logs,
  dashboards,
  panels,
  alerts,
  alertHistory,
  savedSearches,
  searchHistory,
  fields,
  lookups,
  practiceProgress,
} from "@/lib/db/schema";

export async function clearAllData(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // 依存関係の順序で削除
    await db.delete(alertHistory);
    await db.delete(panels);
    await db.delete(logs);
    await db.delete(logSources);
    await db.delete(dashboards);
    await db.delete(alerts);
    await db.delete(savedSearches);
    await db.delete(searchHistory);
    await db.delete(fields);
    await db.delete(lookups);
    await db.delete(practiceProgress);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "データの初期化に失敗しました",
    };
  }
}
