import { notifyLocalDataUpdated } from "@/lib/local-data";

export const ADMIN_DEMO_STORAGE_KEY = "gtech.admissions-admin.v1";

export type AdminDemoTeacher = {
  id: string;
  name: string;
  identifier: string;
  classes: string[];
  subjects: string[];
};

export type AdminDemoClass = {
  level: string;
  stream: string;
};

export type AdminDemoSubject = {
  name: string;
  description: string;
};

export type AdminDemoSettings = {
  teachers: AdminDemoTeacher[];
  classes: AdminDemoClass[];
  subjects: AdminDemoSubject[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isAdminDemoSettings(value: unknown): value is AdminDemoSettings {
  if (!isRecord(value)) return false;
  return (
    Array.isArray(value.teachers) &&
    value.teachers.every(
      (teacher) =>
        isRecord(teacher) &&
        typeof teacher.id === "string" &&
        typeof teacher.name === "string" &&
        typeof teacher.identifier === "string" &&
        isStringList(teacher.classes) &&
        isStringList(teacher.subjects),
    ) &&
    Array.isArray(value.classes) &&
    value.classes.every(
      (schoolClass) =>
        isRecord(schoolClass) &&
        typeof schoolClass.level === "string" &&
        typeof schoolClass.stream === "string",
    ) &&
    Array.isArray(value.subjects) &&
    value.subjects.every(
      (subject) =>
        isRecord(subject) &&
        typeof subject.name === "string" &&
        typeof subject.description === "string",
    )
  );
}

export function loadAdminDemoSettings(seed: AdminDemoSettings): AdminDemoSettings {
  if (typeof window === "undefined") return seed;
  const raw = window.localStorage.getItem(ADMIN_DEMO_STORAGE_KEY);
  if (raw === null) {
    saveAdminDemoSettings(seed);
    return seed;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error("Saved administrator demo records are not valid JSON.", { cause: error });
  }
  if (!isAdminDemoSettings(parsed)) {
    throw new Error("Saved administrator demo records have an unsupported format.");
  }
  return parsed;
}

export function saveAdminDemoSettings(settings: AdminDemoSettings): void {
  if (typeof window === "undefined") {
    throw new Error("Administrator demo records can only be saved in a browser.");
  }
  window.localStorage.setItem(ADMIN_DEMO_STORAGE_KEY, JSON.stringify(settings));
  notifyLocalDataUpdated();
}
