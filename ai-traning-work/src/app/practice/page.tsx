"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/lib/store";

interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  category: string;
  task: string;
  hints: string[];
  expectedPattern?: RegExp;
  sampleQuery?: string;
}

const problems: Problem[] = [
  // 初級問題 (1-6)
  {
    id: "1",
    title: "基本検索",
    description: "キーワードでログを検索する",
    difficulty: "beginner",
    category: "search",
    task: "「error」というキーワードを含むすべてのログを検索してください。",
    hints: ["キーワードをそのまま入力します", "search コマンドは省略可能です"],
    expectedPattern: /error/i,
    sampleQuery: "error",
  },
  {
    id: "2",
    title: "フィールド検索",
    description: "特定のフィールド値でフィルタリングする",
    difficulty: "beginner",
    category: "search",
    task: "levelフィールドが「error」のログだけを検索してください。",
    hints: ["field=value の形式で検索します", "level=error と入力"],
    expectedPattern: /level\s*=\s*error/i,
    sampleQuery: "level=error",
  },
  {
    id: "3",
    title: "統計集計 (count)",
    description: "イベント数をカウントする",
    difficulty: "beginner",
    category: "stats",
    task: "すべてのログの件数をカウントしてください。",
    hints: ["stats コマンドを使用します", "stats count で件数を集計"],
    expectedPattern: /stats\s+count/i,
    sampleQuery: "* | stats count",
  },
  {
    id: "4",
    title: "グループ集計",
    description: "フィールドごとに集計する",
    difficulty: "beginner",
    category: "stats",
    task: "levelフィールドごとにログ件数を集計してください。",
    hints: ["stats count by field でグループ化", "by level を追加"],
    expectedPattern: /stats\s+count\s+by\s+level/i,
    sampleQuery: "* | stats count by level",
  },
  {
    id: "5",
    title: "テーブル表示",
    description: "必要なフィールドだけを表示する",
    difficulty: "beginner",
    category: "transform",
    task: "_time、host、levelフィールドだけをテーブル形式で表示してください。",
    hints: ["table コマンドを使用", "table field1, field2, field3"],
    expectedPattern: /table\s+.*_time.*host.*level|table\s+.*host.*_time.*level/i,
    sampleQuery: "* | table _time, host, level",
  },
  {
    id: "6",
    title: "件数制限 (head)",
    description: "先頭N件だけを取得する",
    difficulty: "beginner",
    category: "transform",
    task: "検索結果の先頭10件だけを表示してください。",
    hints: ["head コマンドを使用", "head N で先頭N件を取得"],
    expectedPattern: /head\s+10/i,
    sampleQuery: "* | head 10",
  },
  // 中級問題 (7-12)
  {
    id: "7",
    title: "条件フィルタ (where)",
    description: "条件式でデータをフィルタリングする",
    difficulty: "intermediate",
    category: "filter",
    task: "ステータスコードが400以上のWebログだけを抽出してください。",
    hints: ["where コマンドを使用", "where status >= 400"],
    expectedPattern: /where\s+status\s*(>=|>)\s*400/i,
    sampleQuery: "sourceId=src_web | where status >= 400",
  },
  {
    id: "8",
    title: "上位N件 (top)",
    description: "最も多い値を見つける",
    difficulty: "intermediate",
    category: "stats",
    task: "最も多く発生しているHTTPメソッド上位5件を表示してください。",
    hints: ["top コマンドを使用", "top 5 field"],
    expectedPattern: /top\s+5\s+method/i,
    sampleQuery: "sourceId=src_web | top 5 method",
  },
  {
    id: "9",
    title: "フィールド計算 (eval)",
    description: "新しいフィールドを計算で作成する",
    difficulty: "intermediate",
    category: "transform",
    task: "response_timeをミリ秒から秒に変換した「response_sec」フィールドを作成してください。",
    hints: ["eval コマンドで計算", "eval field = expression"],
    expectedPattern: /eval\s+response_sec\s*=\s*response_time\s*\/\s*1000/i,
    sampleQuery: "sourceId=src_web | eval response_sec = response_time / 1000 | table response_time, response_sec",
  },
  {
    id: "10",
    title: "複数集計関数",
    description: "複数の統計を同時に計算する",
    difficulty: "intermediate",
    category: "stats",
    task: "レベルごとに件数と、response_timeの平均を集計してください。",
    hints: ["stats で複数の関数を指定", "count と avg() を使用"],
    expectedPattern: /stats\s+count.*avg.*by\s+level|stats\s+avg.*count.*by\s+level/i,
    sampleQuery: "* | stats count, avg(response_time) by level",
  },
  {
    id: "11",
    title: "ソート",
    description: "結果を並び替える",
    difficulty: "intermediate",
    category: "transform",
    task: "ホストごとの件数を集計し、件数の多い順にソートしてください。",
    hints: ["stats count by host の後に sort を使用", "降順は - をつける"],
    expectedPattern: /stats\s+count\s+by\s+host\s*\|\s*sort\s+-count/i,
    sampleQuery: "* | stats count by host | sort -count",
  },
  {
    id: "12",
    title: "重複排除 (dedup)",
    description: "重複するデータを除外する",
    difficulty: "intermediate",
    category: "transform",
    task: "各ホストから最新のログ1件だけを取得してください。",
    hints: ["dedup コマンドを使用", "dedup host でホスト単位の重複を排除"],
    expectedPattern: /dedup\s+host/i,
    sampleQuery: "* | sort -_time | dedup host | table _time, host, level, message",
  },
  // 上級問題 (13-18)
  {
    id: "13",
    title: "条件分岐 (eval if)",
    description: "条件に基づいて値を設定する",
    difficulty: "advanced",
    category: "transform",
    task: "statusが400未満なら「success」、400以上なら「error」という status_type フィールドを作成してください。",
    hints: ["eval の if 関数を使用", 'if(条件, 真の値, 偽の値)'],
    expectedPattern: /eval\s+status_type\s*=\s*if\s*\(\s*status\s*<\s*400/i,
    sampleQuery: 'sourceId=src_web | eval status_type = if(status < 400, "success", "error") | stats count by status_type',
  },
  {
    id: "14",
    title: "時系列分析 (timechart)",
    description: "時間ごとの傾向を分析する",
    difficulty: "advanced",
    category: "stats",
    task: "1時間ごとのエラーログ(level=error)の件数を集計してください。",
    hints: ["timechart コマンドを使用", "span=1h で1時間間隔"],
    expectedPattern: /timechart\s+span=1h\s+count/i,
    sampleQuery: "level=error | timechart span=1h count",
  },
  {
    id: "15",
    title: "ユニークカウント (dc)",
    description: "重複を除いた値の数を数える",
    difficulty: "advanced",
    category: "stats",
    task: "ホストごとにユニークなユーザー数（dc）を集計してください。",
    hints: ["stats dc(field) を使用", "dc = distinct count"],
    expectedPattern: /stats\s+dc\s*\(\s*user\s*\)\s*(as\s+\w+\s+)?by\s+host/i,
    sampleQuery: "* | stats dc(user) as unique_users by host",
  },
  {
    id: "16",
    title: "フィールド名変更 (rename)",
    description: "フィールド名をわかりやすく変更する",
    difficulty: "advanced",
    category: "transform",
    task: "stats count by host の結果で、countを「件数」、hostを「ホスト名」に変更してください。",
    hints: ["rename コマンドを使用", "rename old as new"],
    expectedPattern: /rename\s+.*count\s+as\s+件数.*host\s+as\s+ホスト名|rename\s+.*host\s+as\s+ホスト名.*count\s+as\s+件数/i,
    sampleQuery: "* | stats count by host | rename count as 件数, host as ホスト名",
  },
  {
    id: "17",
    title: "複数条件フィルタ",
    description: "複数の条件を組み合わせる",
    difficulty: "advanced",
    category: "filter",
    task: "ステータスが500以上、かつresponse_timeが1000ミリ秒以上のログを検索してください。",
    hints: ["where で AND を使用", "where 条件1 AND 条件2"],
    expectedPattern: /where\s+.*status\s*(>=|>)\s*500.*AND.*response_time\s*(>=|>)\s*1000|where\s+.*response_time\s*(>=|>)\s*1000.*AND.*status\s*(>=|>)\s*500/i,
    sampleQuery: "sourceId=src_web | where status >= 500 AND response_time >= 1000",
  },
  {
    id: "18",
    title: "パイプライン連結",
    description: "複数のコマンドを組み合わせる",
    difficulty: "advanced",
    category: "advanced",
    task: "エラーログ(level=error)をホスト別に集計し、件数の多い順で上位3件を表示してください。",
    hints: ["search, stats, sort, head を組み合わせる", "パイプ | でコマンドを連結"],
    expectedPattern: /level\s*=\s*error.*stats\s+count\s+by\s+host.*sort\s+-count.*head\s+3/i,
    sampleQuery: "level=error | stats count by host | sort -count | head 3",
  },
];

export default function PracticePage() {
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [userQuery, setUserQuery] = useState("");
  const [showHints, setShowHints] = useState(false);
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const { practiceProgress, updatePracticeProgress, executeSearch, isDataLoaded } = useAppStore();

  const beginnerProblems = problems.filter((p) => p.difficulty === "beginner");
  const intermediateProblems = problems.filter((p) => p.difficulty === "intermediate");
  const advancedProblems = problems.filter((p) => p.difficulty === "advanced");

  const completedCount = practiceProgress.filter((p) => p.status === "completed").length;

  const getStatus = (problemId: string) => {
    return practiceProgress.find((p) => p.problemId === problemId)?.status || "not_started";
  };

  const handleSelectProblem = (problem: Problem) => {
    setSelectedProblem(problem);
    setUserQuery("");
    setShowHints(false);
    setFeedback(null);
    const progress = practiceProgress.find((p) => p.problemId === problem.id);
    if (progress?.lastAnswer) {
      setUserQuery(progress.lastAnswer);
    }
    if (getStatus(problem.id) === "not_started") {
      updatePracticeProgress(problem.id, "in_progress");
    }
  };

  const handleSubmit = () => {
    if (!selectedProblem || !userQuery.trim()) return;

    updatePracticeProgress(selectedProblem.id, "in_progress", userQuery);

    // Check if query matches expected pattern
    if (selectedProblem.expectedPattern && selectedProblem.expectedPattern.test(userQuery)) {
      updatePracticeProgress(selectedProblem.id, "completed", userQuery);
      setFeedback({ success: true, message: "正解です！クエリが正しく作成されました。" });
    } else {
      // Try to execute the query and check if it returns results
      const result = executeSearch(userQuery);
      if (result.success && result.count > 0) {
        setFeedback({
          success: false,
          message: `クエリは実行できましたが（${result.count}件）、期待される形式と異なります。ヒントを参照してください。`,
        });
      } else if (result.error) {
        setFeedback({ success: false, message: `エラー: ${result.error}` });
      } else {
        setFeedback({ success: false, message: "結果が0件です。クエリを確認してください。" });
      }
    }
  };

  const handleShowAnswer = () => {
    if (selectedProblem?.sampleQuery) {
      setUserQuery(selectedProblem.sampleQuery);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">練習問題</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          SPLクエリのスキルを練習問題で磨きましょう
        </p>
      </div>

      {!isDataLoaded && (
        <div className="bg-[var(--accent-warning)]/10 border border-[var(--accent-warning)] rounded-lg p-4">
          <p className="text-[var(--text-primary)]">
            練習問題を解くには、まずデータ取り込みページでサンプルデータを読み込んでください。
          </p>
        </div>
      )}

      {/* Progress */}
      <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-[var(--text-secondary)]">進捗状況</span>
          <span className="text-sm text-[var(--text-primary)]">
            {completedCount} / {problems.length} 完了
          </span>
        </div>
        <div className="w-full h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--accent-primary)] transition-all"
            style={{ width: `${(completedCount / problems.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Problem List */}
        <div className="space-y-6">
          {/* Beginner */}
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <span className="px-2 py-1 text-xs bg-[var(--accent-primary)] text-[var(--bg-primary)] rounded">初級</span>
              基本操作
            </h2>
            <div className="space-y-2">
              {beginnerProblems.map((problem) => (
                <ProblemCard
                  key={problem.id}
                  problem={problem}
                  status={getStatus(problem.id)}
                  isSelected={selectedProblem?.id === problem.id}
                  onClick={() => handleSelectProblem(problem)}
                />
              ))}
            </div>
          </div>

          {/* Intermediate */}
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <span className="px-2 py-1 text-xs bg-[var(--accent-secondary)] text-[var(--bg-primary)] rounded">中級</span>
              応用操作
            </h2>
            <div className="space-y-2">
              {intermediateProblems.map((problem) => (
                <ProblemCard
                  key={problem.id}
                  problem={problem}
                  status={getStatus(problem.id)}
                  isSelected={selectedProblem?.id === problem.id}
                  onClick={() => handleSelectProblem(problem)}
                />
              ))}
            </div>
          </div>

          {/* Advanced */}
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <span className="px-2 py-1 text-xs bg-[var(--accent-danger)] text-white rounded">上級</span>
              発展操作
            </h2>
            <div className="space-y-2">
              {advancedProblems.map((problem) => (
                <ProblemCard
                  key={problem.id}
                  problem={problem}
                  status={getStatus(problem.id)}
                  isSelected={selectedProblem?.id === problem.id}
                  onClick={() => handleSelectProblem(problem)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Problem Detail */}
        <div className="lg:col-span-2">
          {selectedProblem ? (
            <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-6 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-1 text-xs rounded ${
                    selectedProblem.difficulty === "beginner"
                      ? "bg-[var(--accent-primary)] text-[var(--bg-primary)]"
                      : selectedProblem.difficulty === "intermediate"
                      ? "bg-[var(--accent-secondary)] text-[var(--bg-primary)]"
                      : "bg-[var(--accent-danger)] text-white"
                  }`}>
                    {selectedProblem.difficulty === "beginner" ? "初級" : selectedProblem.difficulty === "intermediate" ? "中級" : "上級"}
                  </span>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                    {selectedProblem.id}. {selectedProblem.title}
                  </h2>
                </div>
                <p className="text-[var(--text-secondary)]">{selectedProblem.task}</p>
              </div>

              {/* Query Input */}
              <div>
                <label className="block text-sm text-[var(--text-secondary)] mb-2">
                  SPLクエリ
                </label>
                <textarea
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  disabled={!isDataLoaded}
                  className="w-full h-24 px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded text-sm text-[var(--text-primary)] font-mono focus:border-[var(--accent-primary)] focus:outline-none resize-none disabled:opacity-50"
                  placeholder="クエリを入力..."
                />
              </div>

              {/* Feedback */}
              {feedback && (
                <div className={`p-4 rounded ${
                  feedback.success
                    ? "bg-[var(--accent-secondary)]/10 text-[var(--accent-secondary)]"
                    : "bg-[var(--accent-danger)]/10 text-[var(--accent-danger)]"
                }`}>
                  {feedback.message}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowHints(!showHints)}
                    className="px-4 py-2 text-sm bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded hover:bg-[var(--bg-hover)]"
                  >
                    {showHints ? "ヒントを隠す" : "ヒントを見る"}
                  </button>
                  <button
                    type="button"
                    onClick={handleShowAnswer}
                    className="px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    答えを見る
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!userQuery.trim() || !isDataLoaded}
                  className="px-6 py-2 bg-[var(--accent-primary)] text-[var(--bg-primary)] rounded font-medium hover:opacity-90 disabled:opacity-50"
                >
                  実行して確認
                </button>
              </div>

              {/* Hints */}
              {showHints && (
                <div className="bg-[var(--bg-primary)] rounded p-4">
                  <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">ヒント</h3>
                  <ul className="list-disc list-inside text-sm text-[var(--text-secondary)] space-y-1">
                    {selectedProblem.hints.map((hint, i) => (
                      <li key={i}>{hint}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[var(--bg-secondary)] rounded-lg border border-[var(--border-color)] p-8 text-center text-[var(--text-muted)]">
              左のリストから問題を選択してください
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProblemCard({
  problem,
  status,
  isSelected,
  onClick,
}: {
  problem: Problem;
  status: string;
  isSelected: boolean;
  onClick: () => void;
}) {
  const statusColors = {
    not_started: "bg-[var(--bg-tertiary)]",
    in_progress: "bg-[var(--accent-info)]",
    completed: "bg-[var(--accent-secondary)]",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full p-4 rounded-lg text-left transition-colors ${
        isSelected
          ? "bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]"
          : "bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--accent-primary)]"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-[var(--text-primary)]">
            {problem.id}. {problem.title}
          </p>
          <p className="text-sm text-[var(--text-muted)] mt-1">{problem.description}</p>
        </div>
        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${statusColors[status as keyof typeof statusColors]}`} />
      </div>
    </button>
  );
}
