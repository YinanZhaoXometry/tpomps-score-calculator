import {
  BookOpen,
  Pen,
  Mic,
  Calculator,
  Globe,
  Palette,
  Music,
  Trophy,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface Subject {
  id: string;
  name: string;
  nameEn: string;
  weight: number;
  maxScore: number;
  icon: LucideIcon;
  category: "chinese" | "english" | "math" | "general" | "arts";
}

export const subjects: Subject[] = [
  {
    id: "chinese_reading",
    name: "中文讀本+聆聽",
    nameEn: "Chinese Reading & Listening",
    weight: 6,
    maxScore: 600,
    icon: BookOpen,
    category: "chinese",
  },
  {
    id: "chinese_dictation",
    name: "中默",
    nameEn: "Chinese Dictation",
    weight: 1,
    maxScore: 100,
    icon: Pen,
    category: "chinese",
  },
  {
    id: "chinese_writing",
    name: "中作",
    nameEn: "Chinese Writing",
    weight: 1,
    maxScore: 100,
    icon: Pen,
    category: "chinese",
  },
  {
    id: "chinese_oral",
    name: "中文口試",
    nameEn: "Chinese Oral",
    weight: 1,
    maxScore: 100,
    icon: Mic,
    category: "chinese",
  },
  {
    id: "english_reading",
    name: "英文讀本+聆聽",
    nameEn: "English Reading & Listening",
    weight: 7,
    maxScore: 700,
    icon: BookOpen,
    category: "english",
  },
  {
    id: "english_dictation",
    name: "英默",
    nameEn: "English Dictation",
    weight: 1,
    maxScore: 100,
    icon: Pen,
    category: "english",
  },
  {
    id: "english_oral",
    name: "英文口試",
    nameEn: "English Oral",
    weight: 1,
    maxScore: 100,
    icon: Mic,
    category: "english",
  },
  {
    id: "math",
    name: "數學",
    nameEn: "Mathematics",
    weight: 9,
    maxScore: 900,
    icon: Calculator,
    category: "math",
  },
  {
    id: "general",
    name: "常識+英常",
    nameEn: "General Knowledge",
    weight: 6,
    maxScore: 600,
    icon: Globe,
    category: "general",
  },
  {
    id: "art",
    name: "視藝",
    nameEn: "Visual Arts",
    weight: 3,
    maxScore: 300,
    icon: Palette,
    category: "arts",
  },
  {
    id: "music",
    name: "音樂",
    nameEn: "Music",
    weight: 2,
    maxScore: 200,
    icon: Music,
    category: "arts",
  },
  {
    id: "pe",
    name: "體育",
    nameEn: "Physical Education",
    weight: 1,
    maxScore: 100,
    icon: Trophy,
    category: "arts",
  },
];

export const TOTAL_WEIGHT = subjects.reduce((sum, s) => sum + s.weight, 0); // 39
export const TOTAL_MAX = subjects.reduce((sum, s) => sum + s.maxScore, 0); // 3900

export const categoryLabels: Record<Subject["category"], string> = {
  chinese: "中文",
  english: "英文",
  math: "數學",
  general: "常識",
  arts: "術科",
};

export const categoryColors: Record<Subject["category"], string> = {
  chinese: "bg-red-50 text-red-700 border-red-200",
  english: "bg-blue-50 text-blue-700 border-blue-200",
  math: "bg-emerald-50 text-emerald-700 border-emerald-200",
  general: "bg-amber-50 text-amber-700 border-amber-200",
  arts: "bg-purple-50 text-purple-700 border-purple-200",
};
