"use server";

import { db } from "@/lib/db";
import { logSources, logs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateAllSampleData, type RawLog } from "@/lib/data/sample-generator";

interface UploadLogsResult {
  success: boolean;
  sourceId?: string;
  count?: number;
  error?: string;
}

export async function uploadLogs(formData: FormData): Promise<UploadLogsResult> {
  try {
    const file = formData.get("file") as File | null;
    const name = formData.get("name") as string;
    const type = formData.get("type") as string;
    const format = formData.get("format") as string | null;

    if (!file || !name || !type) {
      return { success: false, error: "必須フィールドが不足しています" };
    }

    const content = await file.text();
    const sourceId = crypto.randomUUID();
    const now = new Date();

    // ログソースを保存
    await db.insert(logSources).values({
      id: sourceId,
      name,
      type: type as "web" | "app" | "system" | "gc" | "k8s" | "db",
      format: format || "auto",
      createdAt: now,
    });

    // ログデータをパース・保存
    const lines = content.split("\n").filter((line) => line.trim());
    const logEntries = lines.map((line, index) => ({
      id: `${sourceId}-${index}`,
      sourceId,
      timestamp: now,
      raw: line,
      parsed: null,
      level: detectLogLevel(line),
      createdAt: now,
    }));

    // バッチ挿入（100件ずつ）
    for (let i = 0; i < logEntries.length; i += 100) {
      await db.insert(logs).values(logEntries.slice(i, i + 100));
    }

    return { success: true, sourceId, count: logEntries.length };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "アップロードに失敗しました",
    };
  }
}

export async function deleteLogSource(
  sourceId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.delete(logSources).where(eq(logSources.id, sourceId));
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "削除に失敗しました",
    };
  }
}

export async function loadSampleData(
  type: "web" | "app" | "security" | "gc" | "k8s" | "db" | "all"
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const { sources, logs: sampleLogs } = generateAllSampleData();
    const now = new Date();

    let filteredSources = sources;
    let filteredLogs: RawLog[] = sampleLogs;

    if (type !== "all") {
      const typeMap: Record<string, string> = {
        web: "web",
        app: "app",
        security: "security",
        gc: "gc",
        k8s: "k8s",
        db: "db",
      };
      const sourceType = typeMap[type];
      filteredSources = sources.filter((s) => s.type === sourceType);
      const sourceIds = new Set(filteredSources.map((s) => s.id));
      filteredLogs = sampleLogs.filter((l) => sourceIds.has(l.sourceId));
    }

    // ソースを保存
    for (const source of filteredSources) {
      await db
        .insert(logSources)
        .values({
          id: source.id,
          name: source.name,
          type: source.type as "web" | "app" | "system" | "gc" | "k8s" | "db",
          format: source.format,
          createdAt: now,
        })
        .onConflictDoNothing();
    }

    // ログを保存
    const logEntries = filteredLogs.map((log) => ({
      id: log.id,
      sourceId: log.sourceId,
      timestamp: log.timestamp,
      raw: log.raw,
      parsed: log.parsed ? JSON.stringify(log.parsed) : null,
      level: log.level as "info" | "warn" | "error" | "debug" | null,
      createdAt: now,
    }));

    for (let i = 0; i < logEntries.length; i += 100) {
      await db.insert(logs).values(logEntries.slice(i, i + 100)).onConflictDoNothing();
    }

    return { success: true, count: filteredLogs.length };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "サンプルデータの読み込みに失敗しました",
    };
  }
}

function detectLogLevel(line: string): "info" | "warn" | "error" | "debug" | null {
  const lower = line.toLowerCase();
  if (lower.includes("error") || lower.includes("fatal") || lower.includes("critical")) return "error";
  if (lower.includes("warn")) return "warn";
  if (lower.includes("debug")) return "debug";
  if (lower.includes("info")) return "info";
  return null;
}
