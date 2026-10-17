// 純資料層：科目 id／名稱／權重。同時被前端（src/lib/subjects.ts 在此之上
// 加入圖示）與後端（functions/，用於 OCR 提示詞與分數驗證）引用，
// 刻意不引入任何瀏覽器或 React 相依，維持「改這裡即可改科目」的單一事實來源。

export type SubjectCategory = "chinese" | "english" | "math" | "general" | "arts";

export interface SubjectData {
  id: string;
  name: string;
  nameEn: string;
  weight: number;
  category: SubjectCategory;
}

export const subjectData: SubjectData[] = [
  {
    id: "chinese_reading",
    name: "讀本 (中文讀本+聆聽)",
    nameEn: "Chinese Reading & Listening",
    weight: 6,
    category: "chinese",
  },
  {
    id: "chinese_writing",
    name: "中作",
    nameEn: "Chinese Writing",
    weight: 1,
    category: "chinese",
  },
  {
    id: "chinese_dictation",
    name: "中默",
    nameEn: "Chinese Dictation",
    weight: 1,
    category: "chinese",
  },
  {
    id: "chinese_oral",
    name: "中話",
    nameEn: "Chinese Oral",
    weight: 1,
    category: "chinese",
  },
  {
    id: "english_reading",
    name: "G.E. (讀本+聆聽)",
    nameEn: "English Reading & Listening",
    weight: 7,
    category: "english",
  },
  {
    id: "english_dictation",
    name: "英默",
    nameEn: "English Dictation",
    weight: 1,
    category: "english",
  },
  {
    id: "english_oral",
    name: "英話",
    nameEn: "English Oral",
    weight: 1,
    category: "english",
  },
  {
    id: "math",
    name: "數學",
    nameEn: "Mathematics",
    weight: 9,
    category: "math",
  },
  {
    id: "general",
    name: "常識",
    nameEn: "General Knowledge",
    weight: 6,
    category: "general",
  },
  {
    id: "art",
    name: "視藝",
    nameEn: "Visual Arts",
    weight: 3,
    category: "arts",
  },
  {
    id: "music",
    name: "音樂",
    nameEn: "Music",
    weight: 2,
    category: "arts",
  },
  {
    id: "pe",
    name: "體育",
    nameEn: "Physical Education",
    weight: 1,
    category: "arts",
  },
];
