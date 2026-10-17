import { auth } from "./firebase";

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

async function doFetch(
  path: string,
  init: RequestInit,
  forceRefresh: boolean
): Promise<Response> {
  const token = auth?.currentUser
    ? await auth.currentUser.getIdToken(forceRefresh)
    : null;
  return fetch(path, {
    ...init,
    headers: {
      ...(init.headers as Record<string, string> | undefined),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  });
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await doFetch(path, init, false);
    // token 過期時強制刷新再重試一次
    if (res.status === 401) res = await doFetch(path, init, true);
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
  await request<{ ok: boolean }>(
    `/api/history/${encodeURIComponent(id)}`,
    { method: "DELETE" }
  );
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
