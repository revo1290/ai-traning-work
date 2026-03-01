"use server";

import { db } from "@/lib/db";
import { alerts, alertHistory } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function createAlert(data: {
  name: string;
  query: string;
  condition: "gt" | "lt" | "eq" | "ne" | "gte" | "lte";
  threshold: number;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const id = crypto.randomUUID();
    await db.insert(alerts).values({
      id,
      name: data.name,
      query: data.query,
      condition: data.condition,
      threshold: data.threshold,
      enabled: true,
      createdAt: new Date(),
    });
    return { success: true, id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "アラートの作成に失敗しました",
    };
  }
}

export async function updateAlert(
  id: string,
  data: {
    name?: string;
    query?: string;
    condition?: "gt" | "lt" | "eq" | "ne" | "gte" | "lte";
    threshold?: number;
    enabled?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.update(alerts).set(data).where(eq(alerts.id, id));
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "アラートの更新に失敗しました",
    };
  }
}

export async function deleteAlert(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.delete(alerts).where(eq(alerts.id, id));
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "アラートの削除に失敗しました",
    };
  }
}

export async function toggleAlert(
  id: string
): Promise<{ success: boolean; enabled?: boolean; error?: string }> {
  try {
    const existing = await db.select().from(alerts).where(eq(alerts.id, id)).limit(1);
    if (existing.length === 0) {
      return { success: false, error: "アラートが見つかりません" };
    }
    const newEnabled = !existing[0].enabled;
    await db.update(alerts).set({ enabled: newEnabled }).where(eq(alerts.id, id));
    return { success: true, enabled: newEnabled };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "アラートの切替に失敗しました",
    };
  }
}

export async function addAlertHistoryEntry(data: {
  alertId: string;
  message: string;
  value?: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const id = crypto.randomUUID();
    await db.insert(alertHistory).values({
      id,
      alertId: data.alertId,
      triggeredAt: new Date(),
      message: data.message,
      data: data.value !== undefined ? JSON.stringify({ value: data.value }) : null,
    });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "アラート履歴の保存に失敗しました",
    };
  }
}
