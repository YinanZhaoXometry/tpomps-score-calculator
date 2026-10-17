import { useCallback, useEffect, useState } from "react";
import {
  Calendar,
  ChevronDown,
  History,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { deleteHistory, listHistory } from "../lib/api";
import type { HistoryEntry } from "../lib/api";
import { subjects } from "../lib/subjects";
import { cn, formatScore, getGrade } from "../lib/utils";
import { ScoreDetailTable } from "./ScoreDetailTable";
import type { SubjectResult } from "./ScoreDetailTable";
import { useToast } from "../hooks/useToast";

const dateTimeFormatter = new Intl.DateTimeFormat("zh-Hant", {
  dateStyle: "long",
  timeStyle: "short",
});

interface HistoryPageProps {
  onLoadEntry: (scores: Record<string, number>) => void;
}

function entryToResults(scores: Record<string, number>): SubjectResult[] {
  return subjects
    .filter((s) => typeof scores[s.id] === "number")
    .map((s) => {
      const raw = scores[s.id];
      return {
        id: s.id,
        name: s.name,
        raw,
        weight: s.weight,
        weighted: raw * s.weight,
        maxWeighted: s.maxScore,
      };
    });
}

export function HistoryPage({ onLoadEntry }: HistoryPageProps) {
  // null = 載入中
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  // 兩段式刪除確認：第一次點擊轉為「確認刪除」，3 秒後自動回復
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const load = useCallback(async () => {
    setError(null);
    setEntries(null);
    try {
      setEntries(await listHistory());
    } catch (err) {
      setError(err instanceof Error ? err.message : "載入失敗，請稍後再試");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!confirmingId) return;
    const timer = setTimeout(() => setConfirmingId(null), 3000);
    return () => clearTimeout(timer);
  }, [confirmingId]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (confirmingId !== id) {
        setConfirmingId(id);
        return;
      }
      setConfirmingId(null);
      setDeletingId(id);
      try {
        await deleteHistory(id);
        setEntries((prev) =>
          prev ? prev.filter((e) => e.id !== id) : prev
        );
        if (expandedId === id) setExpandedId(null);
        toast("已刪除記錄");
      } catch (err) {
        toast(
          err instanceof Error ? err.message : "刪除失敗，請稍後再試",
          "error"
        );
      } finally {
        setDeletingId(null);
      }
    },
    [confirmingId, expandedId, toast]
  );

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          計算歷史
        </h2>
        <p className="text-sm text-muted-foreground">
          查看過去的計算記錄，可載入回計算機或刪除。
        </p>
      </div>

      {error ? (
        <div className="bg-card rounded-2xl border border-border p-8 flex flex-col items-center text-center">
          <p className="text-sm text-destructive">{error}</p>
          <button
            onClick={() => void load()}
            className="mt-4 px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium text-foreground transition-colors hover:bg-muted hover:cursor-pointer"
          >
            重新載入
          </button>
        </div>
      ) : entries === null ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="bg-card rounded-2xl border border-border p-5 animate-pulse"
            >
              <div className="h-4 w-40 rounded bg-muted mb-3" />
              <div className="h-8 w-24 rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-10 flex flex-col items-center text-center">
          <History className="w-8 h-8 text-muted-foreground mb-3" />
          <p className="text-sm font-medium text-foreground">還沒有計算記錄</p>
          <p className="text-xs text-muted-foreground mt-1">
            計算成績後，點擊「儲存記錄」即可保存到歷史記錄。
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const grade = getGrade(entry.average);
            const results = entryToResults(entry.scores);
            const expanded = expandedId === entry.id;
            const confirming = confirmingId === entry.id;
            return (
              <div
                key={entry.id}
                className="bg-card rounded-2xl border border-border overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(expanded ? null : entry.id)}
                  className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-muted/40 transition-colors cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span>{dateTimeFormatter.format(entry.createdAt)}</span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="text-2xl font-bold font-mono text-foreground">
                        {formatScore(entry.average)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        加權平均
                      </span>
                      <span className="text-xs text-muted-foreground">
                        已填 {results.length}/{subjects.length} 科
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn("text-base font-bold", grade.color)}>
                      {grade.grade}
                    </span>
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 text-muted-foreground transition-transform",
                        expanded && "rotate-180"
                      )}
                    />
                  </div>
                </button>

                {expanded && (
                  <div className="border-t border-border p-4 space-y-4">
                    <ScoreDetailTable results={results} embedded />
                    <div className="flex gap-2">
                      <button
                        onClick={() => onLoadEntry(entry.scores)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-foreground text-background text-sm font-bold transition-all hover:opacity-90 active:scale-[0.98] hover:cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        載入到計算機
                      </button>
                      <button
                        onClick={() => void handleDelete(entry.id)}
                        disabled={deletingId === entry.id}
                        className={cn(
                          "flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all active:scale-[0.98] hover:cursor-pointer",
                          confirming
                            ? "bg-destructive text-white border-destructive hover:opacity-90"
                            : "bg-card text-muted-foreground border-border hover:text-destructive hover:border-destructive/40"
                        )}
                      >
                        <Trash2 className="w-4 h-4" />
                        {deletingId === entry.id
                          ? "刪除中…"
                          : confirming
                            ? "確認刪除"
                            : "刪除"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
