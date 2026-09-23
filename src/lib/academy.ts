export type SectionType =
  | "heading"
  | "paragraph"
  | "image"
  | "list"
  | "callout"
  | "youtube";

export interface LessonSection {
  type: SectionType;
  text?: string;
  src?: string;
  alt?: string;
  items?: string[];
  videoUrl?: string;
}

export interface PublicQuestion {
  id: number;
  prompt: string;
  type: string;
  options: string[];
  order: number;
}

export interface QuizResultItem {
  correct: boolean;
  correctIndex: number;
  explanation: string | null;
}

export const PROGRESS_STORAGE_KEY = "nmcn-academy-progress";

export type LocalProgress = Record<string, { score: number; passed: boolean }>;

export function parseSections(value: unknown): LessonSection[] {
  if (Array.isArray(value)) return value as LessonSection[];
  return [];
}

export function parseOptions(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  return [];
}

export function gradeAnswers(
  correctIndexes: number[],
  answers: (number | null)[],
  passingScore: number
) {
  if (correctIndexes.length === 0) {
    return { score: 0, passed: false, results: [] as QuizResultItem[] };
  }

  let correctCount = 0;
  const results = correctIndexes.map((correctIndex, i) => {
    const isCorrect = answers[i] === correctIndex;
    if (isCorrect) correctCount += 1;
    return { correct: isCorrect, correctIndex, explanation: null as string | null };
  });

  const score = Math.round((correctCount / correctIndexes.length) * 100);
  return { score, passed: score >= passingScore, results };
}

export function readLocalProgress(): LocalProgress {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as LocalProgress) : {};
  } catch {
    return {};
  }
}

export function writeLocalProgress(progress: LocalProgress) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // ignore quota / private mode
  }
}

export function markLocalLessonPassed(lessonId: number, score: number): LocalProgress {
  const progress = readLocalProgress();
  const key = String(lessonId);
  const existing = progress[key];
  progress[key] = {
    score: Math.max(score, existing?.score ?? 0),
    passed: true,
  };
  writeLocalProgress(progress);
  return progress;
}

type ProgressMap =
  | LocalProgress
  | Record<number, { passed: boolean }>;

function isPassedIn(progress: ProgressMap, id: number): boolean {
  const byNumber = (progress as Record<number, { passed: boolean }>)[id];
  if (byNumber) return Boolean(byNumber.passed);
  const byString = (progress as LocalProgress)[String(id)];
  return Boolean(byString && byString.passed);
}

export function coursePercent(lessonIds: number[], progress: ProgressMap): number {
  if (lessonIds.length === 0) return 0;
  const passed = lessonIds.filter((id) => isPassedIn(progress, id)).length;
  return Math.round((passed / lessonIds.length) * 100);
}

export function isCourseComplete(
  lessonIds: number[],
  progress: ProgressMap
): boolean {
  return lessonIds.length > 0 && coursePercent(lessonIds, progress) === 100;
}

const CODE_PREFIXES: Record<string, string> = {
  "tiktok-live": "TIKTOK",
  "battle-exchange": "BATTLE",
  "discord": "DISCORD",
};

export function certificateCode(courseSlug: string): string {
  const prefix =
    CODE_PREFIXES[courseSlug] ||
    courseSlug.replace(/[^a-z0-9]/gi, "").slice(0, 6).toUpperCase() ||
    "COURSE";
  const hex = Array.from({ length: 4 }, () =>
    Math.floor(Math.random() * 16).toString(16).toUpperCase()
  ).join("");
  return `NMCN-${prefix}-${hex}`;
}

export const ICON_LABELS: Record<string, string> = {
  GraduationCap: "GraduationCap",
  Video: "Video",
  Swords: "Swords",
  MessagesSquare: "MessagesSquare",
};
