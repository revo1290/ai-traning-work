// SPLテンプレート・例文集

export interface SPLTemplate {
  id: string;
  name: string;
  description: string;
  query: string;
  category: "basic" | "stats" | "transform" | "timeseries" | "troubleshooting" | "security" | "performance";
  difficulty: "beginner" | "intermediate" | "advanced";
  tags: string[];
}

export const SPL_TEMPLATES: SPLTemplate[] = [
  // 基本検索テンプレート
  {
    id: "basic-keyword",
    name: "キーワード検索",
    description: "特定のキーワードを含むログを検索",
    query: 'search error',
    category: "basic",
    difficulty: "beginner",
    tags: ["検索", "キーワード"],
  },
  {
    id: "basic-field-value",
    name: "フィールド値検索",
    description: "特定のフィールドが指定値を持つログを検索",
    query: 'search status=500',
    category: "basic",
    difficulty: "beginner",
    tags: ["検索", "フィールド"],
  },
  {
    id: "basic-multiple-conditions",
    name: "複数条件検索",
    description: "複数の条件を組み合わせて検索",
    query: 'search status>=400 AND status<500 | table _time, host, status, message',
    category: "basic",
    difficulty: "beginner",
    tags: ["検索", "条件", "AND"],
  },
  {
    id: "basic-wildcard",
    name: "ワイルドカード検索",
    description: "ワイルドカードを使用したパターン検索",
    query: 'search host="web*" status=200',
    category: "basic",
    difficulty: "beginner",
    tags: ["検索", "ワイルドカード"],
  },
  {
    id: "basic-or-condition",
    name: "OR条件検索",
    description: "いずれかの条件に一致するログを検索",
    query: 'search error OR warning OR critical',
    category: "basic",
    difficulty: "beginner",
    tags: ["検索", "OR"],
  },
  {
    id: "basic-not-condition",
    name: "NOT条件検索",
    description: "特定のキーワードを除外して検索",
    query: 'search error NOT debug',
    category: "basic",
    difficulty: "beginner",
    tags: ["検索", "NOT", "除外"],
  },
  {
    id: "basic-table",
    name: "テーブル表示",
    description: "特定のフィールドのみをテーブル形式で表示",
    query: 'search * | table _time, host, status, response_time',
    category: "basic",
    difficulty: "beginner",
    tags: ["表示", "テーブル"],
  },
  {
    id: "basic-sort",
    name: "ソート",
    description: "結果を指定フィールドでソート",
    query: 'search * | sort -_time | head 100',
    category: "basic",
    difficulty: "beginner",
    tags: ["ソート", "表示"],
  },

  // 統計テンプレート
  {
    id: "stats-count",
    name: "イベント数カウント",
    description: "イベントの総数をカウント",
    query: 'search * | stats count',
    category: "stats",
    difficulty: "beginner",
    tags: ["統計", "カウント"],
  },
  {
    id: "stats-count-by",
    name: "グループ別カウント",
    description: "特定フィールドでグループ化してカウント",
    query: 'search * | stats count by status',
    category: "stats",
    difficulty: "beginner",
    tags: ["統計", "カウント", "グループ化"],
  },
  {
    id: "stats-sum-avg",
    name: "合計・平均計算",
    description: "数値フィールドの合計と平均を計算",
    query: 'search * | stats sum(bytes) as total_bytes, avg(bytes) as avg_bytes by host',
    category: "stats",
    difficulty: "intermediate",
    tags: ["統計", "合計", "平均"],
  },
  {
    id: "stats-multiple",
    name: "複数統計値の計算",
    description: "複数の統計値を一度に計算",
    query: 'search * | stats count, avg(response_time) as avg_time, max(response_time) as max_time, min(response_time) as min_time by host',
    category: "stats",
    difficulty: "intermediate",
    tags: ["統計", "複数", "平均", "最大", "最小"],
  },
  {
    id: "stats-dc",
    name: "ユニーク数カウント",
    description: "ユニークな値の数をカウント",
    query: 'search * | stats dc(user) as unique_users, dc(host) as unique_hosts',
    category: "stats",
    difficulty: "intermediate",
    tags: ["統計", "ユニーク", "カウント"],
  },
  {
    id: "stats-top",
    name: "上位N件の値",
    description: "最頻出の値を表示",
    query: 'search * | top 10 status',
    category: "stats",
    difficulty: "beginner",
    tags: ["統計", "TOP", "頻度"],
  },
  {
    id: "stats-rare",
    name: "下位N件の値",
    description: "出現頻度が低い値を表示",
    query: 'search * | rare 10 error_code',
    category: "stats",
    difficulty: "beginner",
    tags: ["統計", "レア", "頻度"],
  },
  {
    id: "stats-percentile",
    name: "パーセンタイル計算",
    description: "レスポンスタイムのパーセンタイルを計算",
    query: 'search * | stats median(response_time) as p50, perc(response_time) as p95 by host',
    category: "stats",
    difficulty: "advanced",
    tags: ["統計", "パーセンタイル"],
  },

  // 時系列テンプレート
  {
    id: "timechart-count",
    name: "時系列カウント",
    description: "時間ごとのイベント数を集計",
    query: 'search * | timechart span=1h count',
    category: "timeseries",
    difficulty: "intermediate",
    tags: ["時系列", "カウント", "グラフ"],
  },
  {
    id: "timechart-by-field",
    name: "フィールド別時系列",
    description: "フィールド別の時系列集計",
    query: 'search * | timechart span=1h count by status',
    category: "timeseries",
    difficulty: "intermediate",
    tags: ["時系列", "グループ化", "グラフ"],
  },
  {
    id: "timechart-avg",
    name: "時系列平均値",
    description: "時間ごとの平均値を計算",
    query: 'search * | timechart span=5m avg(response_time) by host',
    category: "timeseries",
    difficulty: "intermediate",
    tags: ["時系列", "平均", "グラフ"],
  },
  {
    id: "timechart-multi",
    name: "複数指標の時系列",
    description: "複数の指標を時系列で表示",
    query: 'search * | timechart span=1h count as requests, avg(response_time) as avg_time',
    category: "timeseries",
    difficulty: "advanced",
    tags: ["時系列", "複数指標", "グラフ"],
  },

  // 変換テンプレート
  {
    id: "eval-calculation",
    name: "フィールド計算",
    description: "新しいフィールドを計算式で作成",
    query: 'search * | eval total = price * quantity | table _time, product, price, quantity, total',
    category: "transform",
    difficulty: "intermediate",
    tags: ["変換", "計算", "eval"],
  },
  {
    id: "eval-conditional",
    name: "条件付きフィールド",
    description: "条件に基づいて値を設定",
    query: 'search * | eval status_category = if(status < 400, "success", "error") | stats count by status_category',
    category: "transform",
    difficulty: "intermediate",
    tags: ["変換", "条件", "eval"],
  },
  {
    id: "eval-string",
    name: "文字列操作",
    description: "文字列を加工して新しいフィールドを作成",
    query: 'search * | eval lower_host = lower(host) | eval domain = substr(host, 0, 3)',
    category: "transform",
    difficulty: "intermediate",
    tags: ["変換", "文字列", "eval"],
  },
  {
    id: "eval-datetime",
    name: "日時操作",
    description: "日時フィールドをフォーマット",
    query: 'search * | eval date = strftime(_time, "%Y-%m-%d") | eval hour = strftime(_time, "%H") | stats count by date, hour',
    category: "transform",
    difficulty: "intermediate",
    tags: ["変換", "日時", "eval"],
  },
  {
    id: "rex-extract",
    name: "正規表現フィールド抽出",
    description: "正規表現でフィールドを抽出",
    query: 'search * | rex field=_raw "(?<ip>\\d+\\.\\d+\\.\\d+\\.\\d+)" | stats count by ip',
    category: "transform",
    difficulty: "advanced",
    tags: ["変換", "正規表現", "抽出"],
  },
  {
    id: "rename-fields",
    name: "フィールド名変更",
    description: "フィールド名をわかりやすく変更",
    query: 'search * | rename response_time as "レスポンス時間", status as "ステータス" | table _time, host, ステータス, レスポンス時間',
    category: "transform",
    difficulty: "beginner",
    tags: ["変換", "リネーム"],
  },
  {
    id: "fillnull-default",
    name: "NULL値補完",
    description: "NULL値を指定した値で埋める",
    query: 'search * | fillnull value=0 bytes | fillnull value="unknown" user',
    category: "transform",
    difficulty: "intermediate",
    tags: ["変換", "NULL", "補完"],
  },

  // トラブルシューティングテンプレート
  {
    id: "troubleshoot-errors",
    name: "エラーログ分析",
    description: "エラーログの発生状況を分析",
    query: 'search error OR exception OR fail | stats count by host | sort -count',
    category: "troubleshooting",
    difficulty: "beginner",
    tags: ["トラブルシューティング", "エラー"],
  },
  {
    id: "troubleshoot-error-trend",
    name: "エラー傾向分析",
    description: "時間ごとのエラー発生傾向を分析",
    query: 'search error | timechart span=1h count by host',
    category: "troubleshooting",
    difficulty: "intermediate",
    tags: ["トラブルシューティング", "エラー", "傾向"],
  },
  {
    id: "troubleshoot-slow-requests",
    name: "遅延リクエスト検出",
    description: "レスポンスが遅いリクエストを検出",
    query: 'search * | where response_time > 1000 | stats count, avg(response_time) as avg_time by host, path | sort -avg_time',
    category: "troubleshooting",
    difficulty: "intermediate",
    tags: ["トラブルシューティング", "遅延", "パフォーマンス"],
  },
  {
    id: "troubleshoot-http-errors",
    name: "HTTPエラー分析",
    description: "HTTPステータスコード別のエラー分析",
    query: 'search status>=400 | stats count by status | sort -count',
    category: "troubleshooting",
    difficulty: "beginner",
    tags: ["トラブルシューティング", "HTTP", "ステータス"],
  },
  {
    id: "troubleshoot-timeline",
    name: "イベントタイムライン",
    description: "特定イベントの時系列を追跡",
    query: 'search session_id="xxx" | sort _time | table _time, event, message',
    category: "troubleshooting",
    difficulty: "intermediate",
    tags: ["トラブルシューティング", "タイムライン", "追跡"],
  },

  // セキュリティテンプレート
  {
    id: "security-failed-login",
    name: "ログイン失敗検出",
    description: "ログイン失敗の多いアカウントを検出",
    query: 'search login failed OR "authentication failure" | stats count by user | where count > 5 | sort -count',
    category: "security",
    difficulty: "intermediate",
    tags: ["セキュリティ", "ログイン", "失敗"],
  },
  {
    id: "security-access-denied",
    name: "アクセス拒否検出",
    description: "アクセス拒否イベントを検出",
    query: 'search "access denied" OR "permission denied" OR status=403 | stats count by user, host | sort -count',
    category: "security",
    difficulty: "intermediate",
    tags: ["セキュリティ", "アクセス", "拒否"],
  },
  {
    id: "security-unusual-activity",
    name: "異常アクティビティ検出",
    description: "通常と異なるアクセスパターンを検出",
    query: 'search * | stats count by user, hour=strftime(_time, "%H") | where count > 100 | sort -count',
    category: "security",
    difficulty: "advanced",
    tags: ["セキュリティ", "異常", "アクティビティ"],
  },
  {
    id: "security-ip-analysis",
    name: "IPアドレス分析",
    description: "IPアドレス別のアクセス状況を分析",
    query: 'search * | stats count, dc(path) as unique_paths by src_ip | where count > 100 | sort -count',
    category: "security",
    difficulty: "intermediate",
    tags: ["セキュリティ", "IP", "分析"],
  },

  // パフォーマンステンプレート
  {
    id: "perf-response-time",
    name: "レスポンスタイム分析",
    description: "レスポンスタイムの統計を分析",
    query: 'search * | stats avg(response_time) as avg, max(response_time) as max, min(response_time) as min, median(response_time) as median by host',
    category: "performance",
    difficulty: "intermediate",
    tags: ["パフォーマンス", "レスポンス", "統計"],
  },
  {
    id: "perf-throughput",
    name: "スループット分析",
    description: "時間ごとのリクエスト数を分析",
    query: 'search * | timechart span=1m count as requests | eval rps = requests / 60',
    category: "performance",
    difficulty: "intermediate",
    tags: ["パフォーマンス", "スループット", "RPS"],
  },
  {
    id: "perf-error-rate",
    name: "エラー率計算",
    description: "エラー率をホスト別に計算",
    query: 'search * | stats count as total, count(eval(status>=400)) as errors by host | eval error_rate = round(errors / total * 100, 2)',
    category: "performance",
    difficulty: "advanced",
    tags: ["パフォーマンス", "エラー率", "計算"],
  },
  {
    id: "perf-bandwidth",
    name: "帯域使用量分析",
    description: "ネットワーク帯域使用量を分析",
    query: 'search * | timechart span=1h sum(bytes) as total_bytes | eval mb = round(total_bytes / 1024 / 1024, 2)',
    category: "performance",
    difficulty: "intermediate",
    tags: ["パフォーマンス", "帯域", "バイト"],
  },
  {
    id: "perf-slow-endpoints",
    name: "遅いエンドポイント特定",
    description: "レスポンスが遅いエンドポイントを特定",
    query: 'search * | stats count, avg(response_time) as avg_time, perc(response_time) as p95 by path | where avg_time > 500 | sort -avg_time',
    category: "performance",
    difficulty: "advanced",
    tags: ["パフォーマンス", "エンドポイント", "遅延"],
  },
];

// カテゴリ別テンプレートを取得
export function getTemplatesByCategory(category: SPLTemplate["category"]): SPLTemplate[] {
  return SPL_TEMPLATES.filter((t) => t.category === category);
}

// 難易度別テンプレートを取得
export function getTemplatesByDifficulty(difficulty: SPLTemplate["difficulty"]): SPLTemplate[] {
  return SPL_TEMPLATES.filter((t) => t.difficulty === difficulty);
}

// タグでテンプレートを検索
export function searchTemplatesByTag(tag: string): SPLTemplate[] {
  return SPL_TEMPLATES.filter((t) =>
    t.tags.some((t) => t.toLowerCase().includes(tag.toLowerCase()))
  );
}

// テンプレートIDで取得
export function getTemplateById(id: string): SPLTemplate | undefined {
  return SPL_TEMPLATES.find((t) => t.id === id);
}

// 全カテゴリを取得
export function getCategories(): SPLTemplate["category"][] {
  return ["basic", "stats", "transform", "timeseries", "troubleshooting", "security", "performance"];
}

// カテゴリの日本語名を取得
export function getCategoryLabel(category: SPLTemplate["category"]): string {
  const labels: Record<SPLTemplate["category"], string> = {
    basic: "基本検索",
    stats: "統計・集計",
    transform: "データ変換",
    timeseries: "時系列分析",
    troubleshooting: "トラブルシューティング",
    security: "セキュリティ分析",
    performance: "パフォーマンス分析",
  };
  return labels[category];
}

// 難易度の日本語名を取得
export function getDifficultyLabel(difficulty: SPLTemplate["difficulty"]): string {
  const labels: Record<SPLTemplate["difficulty"], string> = {
    beginner: "初級",
    intermediate: "中級",
    advanced: "上級",
  };
  return labels[difficulty];
}
