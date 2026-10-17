import { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { GraduationCap } from "lucide-react";
import {
  auth,
  googleProvider,
  isFirebaseConfigured,
  recordLoginTime,
} from "../lib/firebase";
import { cn } from "../lib/utils";

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

const errorMessages: Record<string, string> = {
  "auth/popup-blocked": "瀏覽器已封鎖彈出視窗，請允許彈出視窗後再試",
  "auth/unauthorized-domain": "此網域未獲授權，請於 Firebase 控制台新增授權網域",
  "auth/network-request-failed": "網路連線失敗，請檢查網路後再試",
  "auth/operation-not-allowed": "尚未啟用 Google 登入，請於 Firebase 控制台開啟",
};

// User-cancelled popups are not real errors.
const silentErrors = new Set([
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
]);

export function LoginPage() {
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    if (!auth || signingIn) return;
    setSigningIn(true);
    setError(null);
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      recordLoginTime(credential.user.uid);
    } catch (err) {
      const code = (err as { code?: string }).code ?? "";
      if (!silentErrors.has(code)) {
        setError(errorMessages[code] ?? "登入失敗，請稍後再試");
      }
    } finally {
      setSigningIn(false);
    }
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

          {isFirebaseConfigured ? (
            <button
              onClick={handleSignIn}
              disabled={signingIn}
              className={cn(
                "w-full h-11 flex items-center justify-center gap-3 rounded-lg border border-border bg-card",
                "text-sm font-medium text-foreground transition-all",
                "hover:bg-muted active:scale-[0.98] hover:cursor-pointer",
                signingIn && "opacity-60 cursor-not-allowed"
              )}
            >
              <GoogleLogo />
              {signingIn ? "登入中…" : "使用 Google 帳戶登入"}
            </button>
          ) : (
            <div className="w-full rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-700">
              尚未設定 Firebase 環境變數（VITE_FIREBASE_*），無法啟用登入。
              請複製 <code className="font-mono">.env.example</code> 為{" "}
              <code className="font-mono">.env.local</code>{" "}
              並填入 Firebase 設定後重新啟動。
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
