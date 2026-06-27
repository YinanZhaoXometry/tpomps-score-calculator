import { useState, useEffect, useCallback, useRef } from "react";

const STORAGE_KEY = "tpomps-scores";

type Scores = Record<string, string>;

function loadFromStorage(): Scores {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveToStorage(scores: Scores) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  } catch {
    // silently fail
  }
}

export function useFormCache() {
  const [scores, setScores] = useState<Scores>(loadFromStorage);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => saveToStorage(scores), 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [scores]);

  const updateScore = useCallback((id: string, value: string) => {
    setScores((prev) => ({ ...prev, [id]: value }));
  }, []);

  const getScore = useCallback(
    (id: string): string => {
      return scores[id] ?? "";
    },
    [scores]
  );

  const getNumericScore = useCallback(
    (id: string): number | null => {
      const val = scores[id];
      if (val === "" || val === undefined) return null;
      const num = parseFloat(val);
      return isNaN(num) ? null : num;
    },
    [scores]
  );

  const clearAll = useCallback(() => {
    setScores({});
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { updateScore, getScore, getNumericScore, clearAll, scores };
}
