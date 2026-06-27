import { useState, useCallback } from "react";
import { Calculator, RotateCcw, GraduationCap } from "lucide-react";
import { ScoreForm } from "./components/ScoreForm";
import { ResultPanel } from "./components/ResultPanel";
import { CelebrationEffect } from "./components/CelebrationEffect";
import { useFormCache } from "./hooks/useFormCache";
import { cn } from "./lib/utils";

function App() {
  const { getScore, updateScore, getNumericScore, clearAll } = useFormCache();
  const [showResult, setShowResult] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  const handleCalculate = useCallback(() => {
    setShowResult(true);
    setCelebrating(true);
  }, []);

  const handleClear = useCallback(() => {
    clearAll();
    setShowResult(false);
  }, [clearAll]);

  const handleCelebrationComplete = useCallback(() => {
    setCelebrating(false);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <CelebrationEffect fire={celebrating} onComplete={handleCelebrationComplete} />

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
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            清除
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
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
        <ScoreForm getScore={getScore} updateScore={updateScore} />

        {/* Calculate Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleCalculate}
            className={cn(
              "flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-medium",
              "bg-foreground text-background",
              "hover:opacity-90 active:scale-[0.98]",
              "transition-all duration-150",
              "shadow-lg shadow-foreground/10"
            )}
          >
            <Calculator className="w-4 h-4" />
            計算成績
          </button>
        </div>

        {/* Results */}
        {showResult && (
          <div className="mt-10">
            <ResultPanel getNumericScore={getNumericScore} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            TPOMPS Score Calculator
          </p>
          <p className="text-xs text-muted-foreground">
            資料僅儲存於本機瀏覽器
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
