-- 每位使用者的計算歷史記錄（見 functions/api/history/）
CREATE TABLE IF NOT EXISTS history_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  scores TEXT NOT NULL,
  average REAL NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_history_user_created
  ON history_entries (user_id, created_at DESC);
