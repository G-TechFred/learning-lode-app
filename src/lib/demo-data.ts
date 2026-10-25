import { notifyLocalDataUpdated } from "@/lib/local-data";

export const DEMO_ROSTER_STORAGE_KEY = "gtech.admissions-demo.roster.v1";
export const DEMO_ASSESSMENTS_STORAGE_KEY = "gtech.admissions-demo.assessments.v1";

export type DemoAssessmentKind = "assignment" | "quiz" | "test" | "examination";

export type DemoAssessment = {
  id: string;
  studentId: number;
  subject: string;
  term: string;
  academicYear: string;
  kind: DemoAssessmentKind;
  title: string;
  score: number | null;
  maxScore: number;
  dueDate: string;
  feedback: string;
  status: "completed" | "upcoming";
  origin?: "sample" | "teacher-entry";
};

export function assessmentPercent(assessment: DemoAssessment): number | null {
  if (assessment.score === null || assessment.maxScore <= 0) return null;
  return Math.round((assessment.score / assessment.maxScore) * 100);
}

function loadDemoArray<T>(
  key: string,
  seed: T[],
  isEntry: (value: unknown) => value is T,
): T[] {
  if (typeof window === "undefined") return seed;

  const raw = window.localStorage.getItem(key);
  if (raw === null) {
    window.localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  }

  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || !parsed.every(isEntry)) {
    throw new Error(`Saved fictional demo data for "${key}" is invalid.`);
  }
  return parsed;
}

function saveDemoArray<T>(key: string, entries: T[]) {
  if (typeof window === "undefined") {
    throw new Error("Demo data can only be saved in a browser.");
  }
  window.localStorage.setItem(key, JSON.stringify(entries));
  notifyLocalDataUpdated();
}

export function loadDemoRoster<T>(
  seed: T[],
  isEntry: (value: unknown) => value is T,
): T[] {
  return loadDemoArray(DEMO_ROSTER_STORAGE_KEY, seed, isEntry);
}

export function saveDemoRoster<T>(students: T[]) {
  saveDemoArray(DEMO_ROSTER_STORAGE_KEY, students);
}

export function loadDemoAssessments(
  seed: DemoAssessment[],
  isEntry: (value: unknown) => value is DemoAssessment,
): DemoAssessment[] {
  return loadDemoArray(DEMO_ASSESSMENTS_STORAGE_KEY, seed, isEntry);
}

export function saveDemoAssessments(assessments: DemoAssessment[]) {
  saveDemoArray(DEMO_ASSESSMENTS_STORAGE_KEY, assessments);
}

export function saveDemoRosterAndAssessments<T>(roster: T[], assessments: DemoAssessment[]) {
  if (typeof window === "undefined") {
    throw new Error("Demo data can only be saved in a browser.");
  }
  const previousRoster = window.localStorage.getItem(DEMO_ROSTER_STORAGE_KEY);
  const previousAssessments = window.localStorage.getItem(DEMO_ASSESSMENTS_STORAGE_KEY);
  try {
    window.localStorage.setItem(DEMO_ROSTER_STORAGE_KEY, JSON.stringify(roster));
    window.localStorage.setItem(DEMO_ASSESSMENTS_STORAGE_KEY, JSON.stringify(assessments));
  } catch (error) {
    try {
      if (previousRoster === null) window.localStorage.removeItem(DEMO_ROSTER_STORAGE_KEY);
      else window.localStorage.setItem(DEMO_ROSTER_STORAGE_KEY, previousRoster);
      if (previousAssessments === null) window.localStorage.removeItem(DEMO_ASSESSMENTS_STORAGE_KEY);
      else window.localStorage.setItem(DEMO_ASSESSMENTS_STORAGE_KEY, previousAssessments);
    } catch (rollbackError) {
      throw new Error("Could not save or roll back linked fictional demo records.", { cause: rollbackError });
    }
    throw error;
  }
  notifyLocalDataUpdated();
}
