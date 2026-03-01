"use server";

import { db } from "@/lib/db";
import { fields } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function createFieldRule(data: {
  sourceId?: string;
  name: string;
  pattern: string;
  type: "string" | "number" | "date";
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // 正規表現の妥当性チェック
    try {
      new RegExp(data.pattern);
    } catch {
      return { success: false, error: "無効な正規表現パターンです" };
    }

    const id = crypto.randomUUID();
    await db.insert(fields).values({
      id,
      sourceId: data.sourceId || null,
      name: data.name,
      pattern: data.pattern,
      type: data.type,
      createdAt: new Date(),
    });
    return { success: true, id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "フィールドルールの作成に失敗しました",
    };
  }
}

export async function updateFieldRule(
  id: string,
  data: {
    name?: string;
    pattern?: string;
    type?: "string" | "number" | "date";
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    if (data.pattern) {
      try {
        new RegExp(data.pattern);
      } catch {
        return { success: false, error: "無効な正規表現パターンです" };
      }
    }

    await db.update(fields).set(data).where(eq(fields.id, id));
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "フィールドルールの更新に失敗しました",
    };
  }
}

export async function deleteFieldRule(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await db.delete(fields).where(eq(fields.id, id));
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "フィールドルールの削除に失敗しました",
    };
  }
}

export async function testFieldRule(data: {
  pattern: string;
  sampleLogs: string[];
}): Promise<{
  success: boolean;
  results?: Array<{ log: string; extracted: string | null }>;
  error?: string;
}> {
  try {
    let regex: RegExp;
    try {
      regex = new RegExp(data.pattern);
    } catch {
      return { success: false, error: "無効な正規表現パターンです" };
    }

    const results = data.sampleLogs.map((log) => {
      const match = log.match(regex);
      return {
        log,
        extracted: match ? (match.groups ? JSON.stringify(match.groups) : match[0]) : null,
      };
    });

    return { success: true, results };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "テストに失敗しました",
    };
  }
}
