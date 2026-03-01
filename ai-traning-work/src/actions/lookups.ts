"use server";

import { db } from "@/lib/db";
import { lookups } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function createLookup(data: {
  name: string;
  data: Record<string, unknown>[];
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    if (!data.name.trim()) {
      return { success: false, error: "ルックアップ名は必須です" };
    }
    if (!data.data || data.data.length === 0) {
      return { success: false, error: "データが空です" };
    }

    const id = crypto.randomUUID();
    await db.insert(lookups).values({
      id,
      name: data.name,
      data: JSON.stringify(data.data),
      createdAt: new Date(),
    });
    return { success: true, id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "ルックアップテーブルの作成に失敗しました",
    };
  }
}

export async function updateLookup(
  id: string,
  data: Record<string, unknown>[]
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .update(lookups)
      .set({ data: JSON.stringify(data) })
      .where(eq(lookups.id, id));
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "ルックアップテーブルの更新に失敗しました",
    };
  }
}

export async function deleteLookup(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.delete(lookups).where(eq(lookups.id, id));
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "ルックアップテーブルの削除に失敗しました",
    };
  }
}
