import { notifyLocalDataUpdated, readLocalArray } from "@/lib/local-data";

const STORAGE_KEY = "gtech.teacher-records.v1";

type TeacherRecord = {
  teacher_email: string;
  student_id: number;
  data: unknown;
  updated_at: string;
  history?: Array<{ data: unknown; updated_at: string }>;
};

export type StudentRecordSnapshot<T> = {
  data: T;
  updated_at: string;
};

function isSnapshot(value: unknown): value is { data: unknown; updated_at: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "data" in value &&
    "updated_at" in value &&
    typeof value.updated_at === "string"
  );
}

function isTeacherRecord(value: unknown): value is TeacherRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    "teacher_email" in value &&
    typeof value.teacher_email === "string" &&
    "student_id" in value &&
    typeof value.student_id === "number" &&
    "updated_at" in value &&
    typeof value.updated_at === "string" &&
    "data" in value &&
    (!("history" in value) ||
      (Array.isArray(value.history) && value.history.every(isSnapshot)))
  );
}

function getRecords() {
  return readLocalArray(STORAGE_KEY, isTeacherRecord);
}

export async function loadTeacherWorkspace<T extends { id: number; name: string; level: string; stream: string }>(email: string, base: T[]): Promise<T[]> {
  const byId = new Map(
    getRecords()
      .filter((record) => record.teacher_email === email.toLowerCase())
      .map((record) => [record.student_id, record.data as T]),
  );
  return base.map((student) => {
    const saved = byId.get(student.id);
    return saved
      ? { ...saved, name: student.name, level: student.level, stream: student.stream }
      : student;
  });
}

export async function saveTeacherWorkspace<T extends { id: number }>(
  email: string,
  students: T[],
  previous: T[],
): Promise<void> {
  const previousById = new Map(previous.map((student) => [student.id, JSON.stringify(student)]));
  const changed = students.filter((student) => previousById.get(student.id) !== JSON.stringify(student));
  if (changed.length === 0) return;

  const records = getRecords();
  const now = new Date().toISOString();
  for (const student of changed) {
    const existing = records.find(
      (record) =>
        record.teacher_email === email.toLowerCase() && record.student_id === student.id,
    );
    const history = (existing?.history ?? []).filter(isSnapshot);
    if (existing && history.length === 0 && isSnapshot(existing)) {
      history.push({ data: existing.data, updated_at: existing.updated_at });
    }
    history.push({ data: student, updated_at: now });
    const nextRecord: TeacherRecord = {
      teacher_email: email.toLowerCase(),
      student_id: student.id,
      data: student,
      updated_at: now,
      history: history.slice(-50),
    };
    if (existing) Object.assign(existing, nextRecord);
    else records.push(nextRecord);
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  notifyLocalDataUpdated();
}

export async function loadStudentHistory<T extends { id: number }>(
  studentId: number,
  isData: (value: unknown) => value is T,
): Promise<StudentRecordSnapshot<T>[]> {
  const snapshots: StudentRecordSnapshot<T>[] = [];
  for (const record of getRecords()) {
    if (record.student_id !== studentId) continue;
    const history = (record.history ?? []).filter(isSnapshot);
    for (const snapshot of history) {
      if (isData(snapshot.data)) snapshots.push({ data: snapshot.data, updated_at: snapshot.updated_at });
    }
    const latestSnapshot = history.at(-1);
    if ((!latestSnapshot || latestSnapshot.updated_at !== record.updated_at) && isData(record.data)) {
      snapshots.push({ data: record.data, updated_at: record.updated_at });
    }
  }
  return snapshots.sort((a, b) => a.updated_at.localeCompare(b.updated_at));
}

/** Students/parents see each student's latest local demo entry. */
export async function loadPublished<T extends { id: number; name: string; level: string; stream: string }>(base: T[]): Promise<T[]> {
  const latest = new Map<number, T>();
  const records = getRecords().sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  for (const record of records) {
    if (!latest.has(record.student_id)) latest.set(record.student_id, record.data as T);
  }
  return base.map((student) => {
    const saved = latest.get(student.id);
    return saved
      ? { ...saved, name: student.name, level: student.level, stream: student.stream }
      : student;
  });
}
