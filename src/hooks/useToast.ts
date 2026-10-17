import { createContext, useContext } from "react";

export type ToastTone = "success" | "error";

export interface ToastContextValue {
  toast: (message: string, tone?: ToastTone) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast 必須在 ToastProvider 內使用");
  return ctx;
}
