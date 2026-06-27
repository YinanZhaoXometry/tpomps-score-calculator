import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getGrade(avg: number): {
  grade: string;
  label: string;
  color: string;
} {
  if (avg >= 90) return { grade: "A", label: "優異", color: "text-grade-a" };
  if (avg >= 80) return { grade: "B", label: "良好", color: "text-grade-b" };
  if (avg >= 70) return { grade: "C", label: "中等", color: "text-grade-c" };
  if (avg >= 60) return { grade: "D", label: "及格", color: "text-grade-d" };
  return { grade: "F", label: "不及格", color: "text-grade-f" };
}

export function formatScore(score: number): string {
  return score % 1 === 0 ? score.toString() : score.toFixed(2);
}
