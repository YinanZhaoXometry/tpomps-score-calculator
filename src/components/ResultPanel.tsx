import { subjects, TOTAL_MAX } from "../lib/subjects";
import { cn, getGrade, formatScore } from "../lib/utils";
import { TrendingUp, Award, BarChart3 } from "lucide-react";

interface ResultPanelProps {
  getNumericScore: (id: string) => number | null;
}

interface SubjectResult {
  id: string;
  name: string;
  raw: number;
  weight: number;
  weighted: number;
  maxWeighted: number;
}

export function ResultPanel({ getNumericScore }: ResultPanelProps) {
  const results: SubjectResult[] = subjects
    .map((s) => {
      const raw = getNumericScore(s.id);
      if (raw === null) return null;
      return {
        id: s.id,
        name: s.name,
        raw,
        weight: s.weight,
        weighted: raw * s.weight,
        maxWeighted: s.maxScore,
      };
    })
    .filter(Boolean) as SubjectResult[];

  const totalWeighted = results.reduce((sum, r) => sum + r.weighted, 0);
  const average = results.length > 0 ? (totalWeighted / TOTAL_MAX) * 100 : 0;
  const grade = getGrade(average);
  const filledCount = results.length;
  const totalSubjects = subjects.length;

  if (filledCount === 0) return null;

  const gradeRingColors: Record<string, string> = {
    A: "stroke-grade-a",
    B: "stroke-grade-b",
    C: "stroke-grade-c",
    D: "stroke-grade-d",
    F: "stroke-grade-f",
  };

  const gradeBgColors: Record<string, string> = {
    A: "bg-grade-a/10",
    B: "bg-grade-b/10",
    C: "bg-grade-c/10",
    D: "bg-grade-d/10",
    F: "bg-grade-f/10",
  };

  const circumference = 2 * Math.PI * 54;
  const progress = (average / 100) * circumference;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Average Score Card */}
        <div className="bg-card rounded-2xl border border-border p-6 flex flex-col items-center justify-center">
          <div className="relative w-32 h-32 mb-3">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted"
              />
              <circle
                cx="60"
                cy="60"
                r="54"
                fill="none"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - progress}
                className={cn(
                  "transition-all duration-1000 ease-out",
                  gradeRingColors[grade.grade]
                )}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("text-3xl font-bold font-mono", grade.color)}>
                {formatScore(average)}
              </span>
              <span className="text-xs text-muted-foreground">加權平均</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-2xl font-bold",
                grade.color
              )}
            >
              {grade.grade}
            </span>
            <span className="text-sm text-muted-foreground">{grade.label}</span>
          </div>
        </div>

        {/* Total Score Card */}
        <div className="bg-card rounded-2xl border border-border p-6 flex flex-col items-center justify-center">
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center mb-3",
              gradeBgColors[grade.grade]
            )}
          >
            <TrendingUp className={cn("w-6 h-6", grade.color)} />
          </div>
          <div className="text-3xl font-bold font-mono text-foreground">
            {formatScore(totalWeighted)}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            加權總分 / {TOTAL_MAX}
          </div>
          <div className="w-full mt-3 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000 ease-out",
                grade.grade === "A"
                  ? "bg-grade-a"
                  : grade.grade === "B"
                    ? "bg-grade-b"
                    : grade.grade === "C"
                      ? "bg-grade-c"
                      : grade.grade === "D"
                        ? "bg-grade-d"
                        : "bg-grade-f"
              )}
              style={{ width: `${(totalWeighted / TOTAL_MAX) * 100}%` }}
            />
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-card rounded-2xl border border-border p-6 flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
            <BarChart3 className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="text-3xl font-bold font-mono text-foreground">
            {filledCount}/{totalSubjects}
          </div>
          <div className="text-sm text-muted-foreground mt-1">已填科目</div>
          <div className="flex gap-1 mt-3">
            {subjects.map((s) => {
              const hasScore = getNumericScore(s.id) !== null;
              return (
                <div
                  key={s.id}
                  className={cn(
                    "w-2.5 h-2.5 rounded-full transition-colors",
                    hasScore ? "bg-primary" : "bg-muted"
                  )}
                  title={s.name}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Detail Table */}
      {filledCount >= 2 && (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <Award className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">各科明細</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">
                    科目
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                    原始分
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                    權重
                  </th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                    加權分
                  </th>
                  <th className="text-right px-6 py-3 font-medium text-muted-foreground">
                    滿分
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-6 py-3 font-medium text-foreground">
                      {r.name}
                    </td>
                    <td className="text-right px-4 py-3 font-mono text-foreground">
                      {r.raw}
                    </td>
                    <td className="text-right px-4 py-3 font-mono text-muted-foreground">
                      x{r.weight}
                    </td>
                    <td className="text-right px-4 py-3 font-mono font-medium text-foreground">
                      {r.weighted}
                    </td>
                    <td className="text-right px-6 py-3 font-mono text-muted-foreground">
                      {r.maxWeighted}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
