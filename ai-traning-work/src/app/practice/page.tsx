"use client";

import { useState, useMemo } from "react";
import { useAppStore } from "@/lib/store";

interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate";
  category: string;
  task: string;
  hints: string[];
  expectedPattern?: RegExp;
  sampleQuery?: string;
}

const problems: Problem[] = [
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
    id: "6",
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
    id: "7",
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
    id: "8",
    title: "複数集計関数",
    description: "複数の統計を同時に計算する",
    difficulty: "intermediate",
    category: "stats",
    task: "レベルごとに件数と、response_timeの平均を集計してください。",
    hints: ["stats で複数の関数を指定", "count と avg() を使用"],
    expectedPattern: /stats\s+count.*avg.*by\s+level|stats\s+avg.*count.*by\s+level/i,
    sampleQuery: "* | stats count, avg(response_time) by level",
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
                      : "bg-[var(--accent-secondary)] text-[var(--bg-primary)]"
                  }`}>
                    {selectedProblem.difficulty === "beginner" ? "初級" : "中級"}
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
