import { useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import { subjects, categoryLabels, categoryColors } from "../lib/subjects";
import { cn } from "../lib/utils";

interface ScoreFormProps {
  getScore: (id: string) => string;
  updateScore: (id: string, value: string) => void;
}

export interface ScoreFormRef {
  focusNextEmpty: () => void;
}

export const ScoreForm = forwardRef<ScoreFormRef, ScoreFormProps>(({ getScore, updateScore }, ref) => {
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const focusNextEmpty = useCallback(() => {
    const nextEmpty = subjects.find((subject) => {
      const val = getScore(subject.id);
      return val === "" || val === undefined;
    });

    if (nextEmpty) {
      const input = inputRefs.current[nextEmpty.id];
      if (input) {
        input.focus();
        input.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [getScore]);

  useImperativeHandle(ref, () => ({
    focusNextEmpty,
  }), [focusNextEmpty]);
  const grouped = subjects.reduce(
    (acc, subject) => {
      if (!acc[subject.category]) acc[subject.category] = [];
      acc[subject.category].push(subject);
      return acc;
    },
    {} as Record<string, typeof subjects>
  );

  const handleChange = (id: string, value: string) => {
    if (value === "") {
      updateScore(id, "");
      return;
    }
    const num = parseFloat(value);
    if (isNaN(num)) return;
    if (num < 0 || num > 100) return;
    updateScore(id, value);
  };

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <div className="flex items-center gap-2 mb-4">
            <span
              className={cn(
                "text-xs font-medium px-2.5 py-1 rounded-full border",
                categoryColors[category as keyof typeof categoryColors]
              )}
            >
              {categoryLabels[category as keyof typeof categoryLabels]}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((subject) => {
              const Icon = subject.icon;
              return (
                <div
                  key={subject.id}
                  className="group relative bg-card rounded-xl border border-border p-4 transition-all hover:shadow-md hover:border-ring/50"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-foreground leading-tight">
                          {subject.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground leading-tight">
                          {subject.nameEn}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      x{subject.weight}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      ref={(el) => { inputRefs.current[subject.id] = el; }}
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      placeholder="0-100"
                      value={getScore(subject.id)}
                      onChange={(e) => handleChange(subject.id, e.target.value)}
                      className={cn(
                        "w-full h-11 px-3 pr-12 rounded-lg border border-border bg-background text-foreground text-lg font-mono font-medium",
                        "placeholder:text-muted-foreground/50 placeholder:text-sm placeholder:font-normal",
                        "focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring",
                        "transition-all"
                      )}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      / 100
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
});
