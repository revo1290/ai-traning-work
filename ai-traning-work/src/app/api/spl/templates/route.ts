import { NextRequest, NextResponse } from "next/server";
import {
  SPL_TEMPLATES,
  getTemplatesByCategory,
  getTemplatesByDifficulty,
  getTemplateById,
  type SPLTemplate,
} from "@/lib/spl/templates";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") as SPLTemplate["category"] | null;
  const difficulty = searchParams.get("difficulty") as SPLTemplate["difficulty"] | null;
  const id = searchParams.get("id");

  // 特定テンプレートを取得
  if (id) {
    const template = getTemplateById(id);
    if (!template) {
      return NextResponse.json(
        { success: false, error: `テンプレート "${id}" は見つかりません` },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: template });
  }

  // カテゴリ・難易度でフィルタ
  let templates = SPL_TEMPLATES;
  if (category) {
    templates = getTemplatesByCategory(category);
  }
  if (difficulty) {
    templates = templates.filter((t) => t.difficulty === difficulty);
  }

  return NextResponse.json({
    success: true,
    data: templates,
    count: templates.length,
  });
}
