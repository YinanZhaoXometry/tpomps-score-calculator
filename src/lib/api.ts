export interface HistoryEntry {
  id: string;
  createdAt: number;
  scores: Record<string, number>;
  average: number;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// 同源請求，session cookie 由瀏覽器自動附帶。
async function request<T>(path: string, init: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, init);
  } catch {
    throw new ApiError(0, "無法連線伺服器，請檢查網絡後再試");
  }
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const message = (data as { error?: unknown } | null)?.error;
    throw new ApiError(
      res.status,
      typeof message === "string" && message
        ? message
        : "處理請求時發生錯誤，請稍後再試"
    );
  }
  return data as T;
}

export async function listHistory(): Promise<HistoryEntry[]> {
  const data = await request<{ entries?: HistoryEntry[] }>("/api/history", {
    method: "GET",
  });
  return data.entries ?? [];
}

export async function saveHistory(
  scores: Record<string, number>
): Promise<HistoryEntry> {
  const data = await request<{ entry: HistoryEntry }>("/api/history", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ scores }),
  });
  return data.entry;
}

export async function deleteHistory(id: string): Promise<void> {
  await request<{ ok: boolean }>(`/api/history/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function recognizeImage(
  image: string
): Promise<Record<string, number>> {
  const data = await request<{ scores: Record<string, number> }>("/api/ocr", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ image }),
  });
  return data.scores;
}

export async function logout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    // 登出失敗仍繼續：cookie 清不掉也會自然過期
  }
}
