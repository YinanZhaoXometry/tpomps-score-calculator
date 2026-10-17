import { useEffect, useState } from "react";

export interface AppUser {
  uid: string;
  name: string | null;
  email: string | null;
}

interface MeResponse {
  user: AppUser | null;
  configured: boolean;
}

// 登入狀態由後端 session（HttpOnly cookie）決定；掛載時查詢一次 /api/auth/me。
export function useAuthSession(): {
  user: AppUser | null;
  loading: boolean;
  configured: boolean;
} {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: MeResponse | null) => {
        if (cancelled) return;
        if (data) {
          setUser(data.user ?? null);
          setConfigured(data.configured !== false);
        }
      })
      .catch(() => {
        // 網路錯誤：維持未登入狀態
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { user, loading, configured };
}
