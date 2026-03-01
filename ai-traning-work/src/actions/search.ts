"use server";

import { db } from "@/lib/db";
import { savedSearches, searchHistory } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function saveSearch(data: {
  name: string;
  query: string;
  description?: string;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const id = crypto.randomUUID();
    await db.insert(savedSearches).values({
      id,
      name: data.name,
      query: data.query,
      description: data.description || null,
      createdAt: new Date(),
    });
    return { success: true, id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "検索の保存に失敗しました",
    };
  }
}

export async function deleteSavedSearch(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.delete(savedSearches).where(eq(savedSearches.id, id));
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "削除に失敗しました",
    };
  }
}

export async function addSearchHistory(data: {
  query: string;
  resultCount: number;
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const id = crypto.randomUUID();
    await db.insert(searchHistory).values({
      id,
      query: data.query,
      executedAt: new Date(),
      resultCount: data.resultCount,
    });
    return { success: true, id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "検索履歴の保存に失敗しました",
    };
  }
}
