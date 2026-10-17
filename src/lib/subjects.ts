import {
  BookOpen,
  Pen,
  Mic,
  Calculator,
  Globe,
  Palette,
  Music,
  Trophy,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { subjectData, type SubjectCategory } from './subject-data';

export type { SubjectCategory };

// 圖示只在瀏覽器端使用；後端（functions/）直接引用 subject-data。
const icons: Record<string, LucideIcon> = {
  chinese_reading: BookOpen,
  chinese_writing: Pen,
  chinese_dictation: Pen,
  chinese_oral: Mic,
  english_reading: BookOpen,
  english_dictation: Pen,
  english_oral: Mic,
  math: Calculator,
  general: Globe,
  art: Palette,
  music: Music,
  pe: Trophy,
};

export interface Subject {
  id: string;
  name: string;
  nameEn: string;
  weight: number;
  maxScore: number;
  icon: LucideIcon;
  category: SubjectCategory;
}

export const subjects: Subject[] = subjectData.map((s) => ({
  ...s,
  maxScore: s.weight * 100,
  icon: icons[s.id],
}));

export const TOTAL_WEIGHT = subjects.reduce((sum, s) => sum + s.weight, 0); // 39
export const TOTAL_MAX = subjects.reduce((sum, s) => sum + s.maxScore, 0); // 3900

export const categoryLabels: Record<SubjectCategory, string> = {
  chinese: '中文',
  english: '英文',
  math: '數學',
  general: '常識',
  arts: '術科',
};

export const categoryColors: Record<SubjectCategory, string> = {
  chinese: 'bg-red-50 text-red-700 border-red-200',
  english: 'bg-blue-50 text-blue-700 border-blue-200',
  math: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  general: 'bg-amber-50 text-amber-700 border-amber-200',
  arts: 'bg-purple-50 text-purple-700 border-purple-200',
};
