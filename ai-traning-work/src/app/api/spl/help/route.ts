import { NextRequest, NextResponse } from "next/server";
import {
  SPL_COMMANDS,
  STATS_FUNCTION_HELP,
  EVAL_FUNCTION_HELP,
  getCommandHelp,
  getFunctionHelp,
} from "@/lib/spl/help";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const command = searchParams.get("command");
  const func = searchParams.get("function");

  // 特定コマンドのヘルプ
  if (command) {
    const help = getCommandHelp(command);
    if (!help) {
      return NextResponse.json(
        { success: false, error: `コマンド "${command}" は見つかりません` },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: help });
  }

  // 特定関数のヘルプ
  if (func) {
    const help = getFunctionHelp(func);
    if (!help) {
      return NextResponse.json(
        { success: false, error: `関数 "${func}" は見つかりません` },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: help });
  }

  // 全コマンド・関数一覧
  return NextResponse.json({
    success: true,
    data: {
      commands: SPL_COMMANDS,
      statsFunctions: STATS_FUNCTION_HELP,
      evalFunctions: EVAL_FUNCTION_HELP,
    },
  });
}
