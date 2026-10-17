import { useState, useEffect, useCallback, useRef } from "react";

// 登入功能出現之前的共用草稿 key；由第一位登入的使用者一次性承接。
const LEGACY_STORAGE_KEY = "tpomps-scores";

type Scores = Record<string, string>;

function storageKey(userId: string) {
  return `tpomps-scores:${userId}`;
}

function loadFromStorage(key: string): Scores {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy) as Scores;
      localStorage.setItem(key, legacy);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      return parsed;
    }
  } catch {
    // silently fail
  }
  return {};
}

function saveToStorage(key: string, scores: Scores) {
  try {
    localStorage.setItem(key, JSON.stringify(scores));
  } catch {
    // silently fail
  }
}

// 以使用者為單位的草稿快取；MainPage 在每位使用者登入時重新掛載，
// 因此 key 在 hook 生命週期內不會改變。
export function useFormCache(userId: string) {
  const key = storageKey(userId);
  const [scores, setScores] = useState<Scores>(() => loadFromStorage(key));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => saveToStorage(key, scores), 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [scores, key]);

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
    localStorage.removeItem(key);
  }, [key]);

  return { updateScore, getScore, getNumericScore, clearAll, scores };
}
