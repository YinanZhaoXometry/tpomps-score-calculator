import { useState } from "react";
import { GraduationCap } from "lucide-react";
import { cn } from "../lib/utils";

interface LoginPageProps {
  configured: boolean;
}

// 對應 worker/routes/auth.ts 導回的 ?auth_error=<code>
const authErrorMessages: Record<string, string> = {
  not_configured: "尚未設定 Google 登入（GOOGLE_CLIENT_ID／GOOGLE_CLIENT_SECRET）",
  invalid_state: "登入工作階段已過期，請重新再試",
  exchange_failed: "登入失敗，請稍後再試",
  verify_failed: "登入失敗，請稍後再試",
};

// 使用者在 Google 頁面取消登入，不算錯誤
const silentErrors = new Set(["cancelled"]);

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export function LoginPage({ configured }: LoginPageProps) {
  const [error] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("auth_error");
    if (code) {
      window.history.replaceState(null, "", window.location.pathname);
      if (!silentErrors.has(code)) {
        return authErrorMessages[code] ?? "登入失敗，請稍後再試";
      }
    }
    return null;
  });

  const handleSignIn = () => {
    window.location.href = "/api/auth/login";
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-card rounded-2xl border border-border p-8 shadow-lg shadow-foreground/5 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-foreground flex items-center justify-center mb-4">
            <GraduationCap className="w-7 h-7 text-background" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            TPOMPS 成績計算器
          </h1>
          <p className="text-sm text-muted-foreground mt-1 mb-8">
            香港小學加權計分
          </p>

          {configured ? (
            <button
              onClick={handleSignIn}
              className={cn(
                "w-full h-11 flex items-center justify-center gap-3 rounded-lg border border-border bg-card",
                "text-sm font-medium text-foreground transition-all",
                "hover:bg-muted active:scale-[0.98] hover:cursor-pointer"
              )}
            >
              <GoogleLogo />
              使用 Google 帳戶登入
            </button>
          ) : (
            <div className="w-full rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-700">
              尚未設定 Google 登入。請在 <code className="font-mono">wrangler.toml</code>{" "}
              的 [vars] 填入 <code className="font-mono">GOOGLE_CLIENT_ID</code>，並設定{" "}
              <code className="font-mono">GOOGLE_CLIENT_SECRET</code> 密鑰後重新部署。
            </div>
          )}

          {error && (
            <p className="mt-4 text-sm text-destructive text-center">{error}</p>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          登入後即可使用；草稿儲存於本機瀏覽器，歷史記錄儲存於雲端
        </p>
      </div>
    </div>
  );
}
