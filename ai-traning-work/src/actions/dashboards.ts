"use server";

import { db } from "@/lib/db";
import { dashboards, panels } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function createDashboard(data: {
  name: string;
  description?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const id = crypto.randomUUID();
    const now = new Date();
    await db.insert(dashboards).values({
      id,
      name: data.name,
      description: data.description || null,
      createdAt: now,
      updatedAt: now,
    });
    return { success: true, id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "ダッシュボードの作成に失敗しました",
    };
  }
}

export async function updateDashboard(
  id: string,
  data: { name?: string; description?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(dashboards)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(dashboards.id, id));
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "更新に失敗しました",
    };
  }
}

export async function deleteDashboard(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.delete(dashboards).where(eq(dashboards.id, id));
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "削除に失敗しました",
    };
  }
}

export async function createPanel(data: {
  dashboardId: string;
  title: string;
  type: "line" | "bar" | "pie" | "table" | "single";
  query: string;
  config?: Record<string, unknown>;
  position: { x: number; y: number; w: number; h: number };
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const id = crypto.randomUUID();
    await db.insert(panels).values({
      id,
      dashboardId: data.dashboardId,
      title: data.title,
      type: data.type,
      query: data.query,
      config: data.config ? JSON.stringify(data.config) : null,
      position: JSON.stringify(data.position),
      createdAt: new Date(),
    });
    // ダッシュボードのupdatedAtを更新
    await db
      .update(dashboards)
      .set({ updatedAt: new Date() })
      .where(eq(dashboards.id, data.dashboardId));
    return { success: true, id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "パネルの作成に失敗しました",
    };
  }
}

export async function updatePanel(
  id: string,
  data: {
    title?: string;
    type?: "line" | "bar" | "pie" | "table" | "single";
    query?: string;
    config?: Record<string, unknown>;
    position?: { x: number; y: number; w: number; h: number };
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const updateData: Record<string, unknown> = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.query !== undefined) updateData.query = data.query;
    if (data.config !== undefined) updateData.config = JSON.stringify(data.config);
    if (data.position !== undefined) updateData.position = JSON.stringify(data.position);

    await db.update(panels).set(updateData).where(eq(panels.id, id));
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "パネルの更新に失敗しました",
    };
  }
}

export async function deletePanel(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.delete(panels).where(eq(panels.id, id));
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "パネルの削除に失敗しました",
    };
  }
}
