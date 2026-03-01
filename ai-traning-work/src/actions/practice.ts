"use server";

import { db } from "@/lib/db";
import { practiceProgress } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function submitAnswer(data: {
  problemId: string;
  query: string;
}): Promise<{
  success: boolean;
  correct: boolean;
  feedback?: string;
  error?: string;
}> {
  try {
    // 回答を進捗に保存
    const existing = await db
      .select()
      .from(practiceProgress)
      .where(eq(practiceProgress.problemId, data.problemId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(practiceProgress)
        .set({
          status: "completed",
          lastAnswer: data.query,
          completedAt: new Date(),
        })
        .where(eq(practiceProgress.problemId, data.problemId));
    } else {
      await db.insert(practiceProgress).values({
        id: crypto.randomUUID(),
        problemId: data.problemId,
        status: "completed",
        lastAnswer: data.query,
        completedAt: new Date(),
      });
    }

    return {
      success: true,
      correct: true,
      feedback: "回答が保存されました",
    };
  } catch (error) {
    return {
      success: false,
      correct: false,
      error: error instanceof Error ? error.message : "回答の提出に失敗しました",
    };
  }
}

export async function resetProgress(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await db.delete(practiceProgress);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "進捗のリセットに失敗しました",
    };
  }
}
