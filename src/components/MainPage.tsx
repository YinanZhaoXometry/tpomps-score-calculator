import { useState, useCallback, useMemo, useRef } from "react";
import type { ChangeEvent } from "react";
import {
  Calculator,
  RotateCcw,
  GraduationCap,
  ArrowRight,
  LogOut,
  History,
  ImagePlus,
  Loader2,
} from "lucide-react";
import { ScoreForm, type ScoreFormRef } from "./ScoreForm";
import { ResultPanel } from "./ResultPanel";
import { CelebrationEffect } from "./CelebrationEffect";
import { HistoryPage } from "./HistoryPage";
import { useToast } from "../hooks/useToast";
import { useFormCache } from "../hooks/useFormCache";
import type { AppUser } from "../hooks/useAuthSession";
import { subjects } from "../lib/subjects";
import { cn } from "../lib/utils";
import { logout, recognizeImage, saveHistory } from "../lib/api";
import { fileToDataUrl } from "../lib/image";

interface MainPageProps {
  user: AppUser;
}

type View = "calculator" | "history";

export function MainPage({ user }: MainPageProps) {
  const { getScore, updateScore, getNumericScore, clearAll } = useFormCache(
    user.uid
  );
  const [view, setView] = useState<View>("calculator");
  const [showResult, setShowResult] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [ocrRunning, setOcrRunning] = useState(false);
  const [savingHistory, setSavingHistory] = useState(false);
  const scoreFormRef = useRef<ScoreFormRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleCalculate = useCallback(() => {
    setShowResult(true);
    setCelebrating(true);
  }, []);

  const handleClear = useCallback(() => {
    clearAll();
    setShowResult(false);
  }, [clearAll]);

  const handleSignOut = useCallback(async () => {
    await logout();
    // 整頁重新載入，讓 useAuthSession 重新查詢登入狀態
    window.location.assign("/");
  }, []);

  const handleCelebrationComplete = useCallback(() => {
    setCelebrating(false);
  }, []);

  const handleFillNext = useCallback(() => {
    scoreFormRef.current?.focusNextEmpty();
  }, []);

  const handleImageChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = ""; // 允許再次選擇同一張圖片
      if (!file || ocrRunning) return;
      setOcrRunning(true);
      try {
        let dataUrl: string;
        try {
          dataUrl = await fileToDataUrl(file);
        } catch {
          toast("無法讀取圖片，請重新選擇", "error");
          return;
        }
        const scores = await recognizeImage(dataUrl);
        const ids = Object.keys(scores);
        if (ids.length === 0) {
          toast("未能辨識任何科目，請使用更清晰的照片", "error");
          return;
        }
        ids.forEach((id) => updateScore(id, String(scores[id])));
        const missing = subjects
          .filter((s) => !(s.id in scores))
          .map((s) => s.name);
        toast(
          missing.length > 0
            ? `已填入 ${ids.length} 科，未辨識：${missing.join("、")}`
            : `已辨識全部 ${ids.length} 科成績`
        );
      } catch (err) {
        toast(
          err instanceof Error ? err.message : "辨識失敗，請稍後再試",
          "error"
        );
      } finally {
        setOcrRunning(false);
      }
    },
    [ocrRunning, updateScore, toast]
  );

  const handleSaveHistory = useCallback(async () => {
    if (savingHistory) return;
    const scores: Record<string, number> = {};
    for (const s of subjects) {
      const v = getNumericScore(s.id);
      if (v !== null) scores[s.id] = v;
    }
    if (Object.keys(scores).length === 0) {
      toast("請先輸入至少一科成績", "error");
      return;
    }
    setSavingHistory(true);
    try {
      await saveHistory(scores);
      toast("已儲存到歷史記錄");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "儲存失敗，請稍後再試",
        "error"
      );
    } finally {
      setSavingHistory(false);
    }
  }, [savingHistory, getNumericScore, toast]);

  const handleLoadEntry = useCallback(
    (scores: Record<string, number>) => {
      clearAll();
      for (const [id, value] of Object.entries(scores)) {
        updateScore(id, String(value));
      }
      setShowResult(true);
      setView("calculator");
      toast("已載入歷史記錄");
    },
    [clearAll, updateScore, toast]
  );

  const isAllFilled = useMemo(() => {
    return subjects.every((subject) => {
      const val = getScore(subject.id);
      if (val === "" || val === undefined) return false;
      const num = parseFloat(val);
      return !isNaN(num) && num >= 0 && num <= 100;
    });
  }, [getScore]);

  return (
    <div className="min-h-screen bg-background">
      <CelebrationEffect
        fire={celebrating}
        onComplete={handleCelebrationComplete}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
              <GraduationCap className="w-4.5 h-4.5 text-background" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground leading-tight">
                TPOMPS 成績計算器
              </h1>
              <p className="text-[11px] text-muted-foreground leading-tight">
                香港小學加權計分
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {view === "calculator" && (
              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                清除
              </button>
            )}
            <button
              onClick={() =>
                setView(view === "calculator" ? "history" : "calculator")
              }
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted"
            >
              {view === "calculator" ? (
                <>
                  <History className="w-3.5 h-3.5" />
                  歷史記錄
                </>
              ) : (
                <>
                  <Calculator className="w-3.5 h-3.5" />
                  計算器
                </>
              )}
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted"
            >
              <LogOut className="w-3.5 h-3.5" />
              登出
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-32">
        {view === "calculator" ? (
          <>
            {/* Intro */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-foreground mb-2">
                輸入各科成績
              </h2>
              <p className="text-sm text-muted-foreground">
                在下方輸入各科的百分制成績（0-100），點擊計算按鈕查看加權平均分。
              </p>
            </div>

            {/* Score Form */}
            <ScoreForm
              ref={scoreFormRef}
              getScore={getScore}
              updateScore={updateScore}
            />

            {/* Results */}
            {showResult && (
              <div className="mt-10">
                <ResultPanel
                  getNumericScore={getNumericScore}
                  onSaveHistory={handleSaveHistory}
                  savingHistory={savingHistory}
                />
              </div>
            )}
          </>
        ) : (
          <HistoryPage onLoadEntry={handleLoadEntry} />
        )}
      </main>

      {/* Fixed Bottom Button */}
      {view === "calculator" && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/40 backdrop-blur-xl">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex gap-2 sm:gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void handleImageChange(e)}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={ocrRunning}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-3 py-4 rounded-xl text-sm font-bold",
                "transition-all duration-150",
                "shadow-lg shadow-foreground/10",
                ocrRunning
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-card border border-border text-foreground hover:bg-muted active:scale-[0.98] hover:cursor-pointer"
              )}
            >
              {ocrRunning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ImagePlus className="w-4 h-4" />
              )}
              {ocrRunning ? "辨識中…" : "上載圖片"}
            </button>
            <button
              onClick={handleFillNext}
              disabled={isAllFilled}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-3 py-4 rounded-xl text-sm font-bold",
                "transition-all duration-150",
                "shadow-lg shadow-foreground/10",
                isAllFilled
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-foreground text-background hover:opacity-90 active:scale-[0.98] hover:cursor-pointer"
              )}
            >
              <ArrowRight className="w-4 h-4" />
              填寫下一項
            </button>
            <button
              onClick={handleCalculate}
              disabled={!isAllFilled}
              className={cn(
                "flex-1 justify-center flex items-center gap-2 px-3 py-4 rounded-xl text-sm font-bold",
                "transition-all duration-150",
                "shadow-lg shadow-foreground/10",
                isAllFilled
                  ? "bg-foreground text-background hover:opacity-90 active:scale-[0.98] hover:cursor-pointer"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              <Calculator className="w-4 h-4" />
              {isAllFilled ? "計算成績" : "填寫完整後計算"}
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-border mt-16 pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            TPOMPS Score Calculator
          </p>
          <p className="text-xs text-muted-foreground">
            草稿儲存於本機瀏覽器，歷史記錄儲存於雲端
          </p>
        </div>
      </footer>
    </div>
  );
}
