import { initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

// Null when env vars are missing (e.g. CI build without secrets) so the UI
// can show a setup hint instead of crashing at import time.
export const auth: Auth | null = isFirebaseConfigured
  ? getAuth(initializeApp(firebaseConfig))
  : null;

export const googleProvider = new GoogleAuthProvider();

// ~6 months from login; enforced locally in useAuthSession.
// 登入時間以使用者為單位儲存，同一部裝置上的多個帳戶各自獨立計算。
export const SESSION_DURATION_MS = 183 * 24 * 60 * 60 * 1000;

const loginTimeKey = (uid: string) => `tpomps-login-time:${uid}`;

export function recordLoginTime(uid: string) {
  try {
    localStorage.setItem(loginTimeKey(uid), String(Date.now()));
  } catch {
    // silently fail
  }
}

export function clearLoginTime(uid: string) {
  try {
    localStorage.removeItem(loginTimeKey(uid));
  } catch {
    // silently fail
  }
}

export function isSessionExpired(uid: string): boolean {
  try {
    const raw = localStorage.getItem(loginTimeKey(uid));
    if (!raw) return true;
    return Date.now() - Number(raw) > SESSION_DURATION_MS;
  } catch {
    return true;
  }
}
