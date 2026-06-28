import { useState, useCallback, useMemo, useRef } from 'react';
import { Calculator, RotateCcw, GraduationCap, ArrowRight } from 'lucide-react';
import { ScoreForm, type ScoreFormRef } from './components/ScoreForm';
import { ResultPanel } from './components/ResultPanel';
import { CelebrationEffect } from './components/CelebrationEffect';
import { useFormCache } from './hooks/useFormCache';
import { subjects } from './lib/subjects';
import { cn } from './lib/utils';

function App() {
  const { getScore, updateScore, getNumericScore, clearAll } = useFormCache();
  const [showResult, setShowResult] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const scoreFormRef = useRef<ScoreFormRef>(null);

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

  const handleFillNext = useCallback(() => {
    scoreFormRef.current?.focusNextEmpty();
  }, []);

  const isAllFilled = useMemo(() => {
    return subjects.every((subject) => {
      const val = getScore(subject.id);
      if (val === '' || val === undefined) return false;
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
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-32">
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
            <ResultPanel getNumericScore={getNumericScore} />
          </div>
        )}
      </main>

      {/* Fixed Bottom Button */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/40 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex gap-3">
          <button
            onClick={handleFillNext}
            disabled={isAllFilled}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-md font-bold',
              'transition-all duration-150',
              'shadow-lg shadow-foreground/10',
              isAllFilled
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-foreground text-background hover:opacity-90 active:scale-[0.98] hover:cursor-pointer',
            )}
          >
            <ArrowRight className="w-4 h-4" />
            填寫下一項
          </button>
          <button
            onClick={handleCalculate}
            disabled={!isAllFilled}
            className={cn(
              'flex-1 justify-center flex items-center gap-2 px-8 py-3 rounded-xl text-md font-bold',
              'transition-all duration-150',
              'shadow-lg shadow-foreground/10',
              isAllFilled
                ? 'bg-foreground text-background hover:opacity-90 active:scale-[0.98] hover:cursor-pointer'
                : 'bg-muted text-muted-foreground cursor-not-allowed',
            )}
          >
            <Calculator className="w-4 h-4" />
            {isAllFilled ? '計算成績' : '填寫完整後計算'}
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border mt-16 pb-24">
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
