import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, fields, format = "csv" } = body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { success: false, error: "エクスポートするデータがありません" },
        { status: 400 }
      );
    }

    if (format === "json") {
      const jsonContent = JSON.stringify(data, null, 2);
      return new NextResponse(jsonContent, {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": 'attachment; filename="search-results.json"',
        },
      });
    }

    // CSV format (default)
    const exportFields = fields && fields.length > 0 ? fields : Object.keys(data[0]);
    const csvHeader = exportFields.join(",");
    const csvRows = data.map((row: Record<string, unknown>) =>
      exportFields
        .map((field: string) => {
          const value = row[field];
          const str = value === null || value === undefined ? "" : String(value);
          if (str.includes(",") || str.includes("\n") || str.includes('"')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(",")
    );

    const csvContent = [csvHeader, ...csvRows].join("\n");
    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="search-results.csv"',
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "エクスポート処理でエラーが発生しました" },
      { status: 500 }
    );
  }
}
