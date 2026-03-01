import { NextResponse } from "next/server";

// 統計情報API
// クライアントサイドストアからデータを送信して統計を取得するエンドポイント
export async function GET() {
  // サーバーサイドでは直接データを持たないため、
  // クライアントからの情報に基づいてレスポンスを返す
  return NextResponse.json({
    success: true,
    data: {
      serverTime: new Date().toISOString(),
      version: "1.0.0",
      features: {
        splCommands: 30,
        evalFunctions: 50,
        templates: 40,
        practiceProblems: 18,
      },
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { totalLogs, sources, dashboards, alerts } = body;

    return NextResponse.json({
      success: true,
      data: {
        totalLogs: totalLogs ?? 0,
        sources: sources ?? 0,
        dashboards: dashboards ?? 0,
        alerts: {
          total: alerts?.total ?? 0,
          triggered: alerts?.triggered ?? 0,
        },
        serverTime: new Date().toISOString(),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}
