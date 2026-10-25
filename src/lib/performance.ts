import { notifyLocalDataUpdated, readLocalArray } from "@/lib/local-data";

const STORAGE_KEY = "gtech.performance-records.v1";

export type PerformanceRecord = {
  id: string;
  student_id: number;
  subject: string;
  class_score: number;
  exam_score: number;
  attendance: number;
  participation: number;
  remark: string;
  term: string;
  academic_year: string;
};

function isPerformanceRecord(value: unknown): value is PerformanceRecord {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "student_id" in value &&
    typeof value.student_id === "number" &&
    "subject" in value &&
    typeof value.subject === "string" &&
    "class_score" in value &&
    typeof value.class_score === "number" &&
    "exam_score" in value &&
    typeof value.exam_score === "number" &&
    "attendance" in value &&
    typeof value.attendance === "number" &&
    "participation" in value &&
    typeof value.participation === "number" &&
    "remark" in value &&
    typeof value.remark === "string" &&
    "term" in value &&
    typeof value.term === "string" &&
    "academic_year" in value &&
    typeof value.academic_year === "string"
  );
}

/** GES weighting: 50% continuous assessment (SBA) + 50% end-of-term exam. */
export function totalScore(record: Pick<PerformanceRecord, "class_score" | "exam_score">) {
  return Math.round(record.class_score * 0.5 + record.exam_score * 0.5);
}

export async function fetchPerformance(
  studentId: number,
  term: string,
  academicYear: string,
): Promise<PerformanceRecord[]> {
  return readLocalArray(STORAGE_KEY, isPerformanceRecord).filter(
    (record) =>
      record.student_id === studentId &&
      record.term === term &&
      record.academic_year === academicYear,
  );
}

/** Save records to this browser only; this does not publish them to a school database. */
export async function savePerformance(
  rows: Array<Omit<PerformanceRecord, "id">>,
): Promise<void> {
  if (rows.length === 0) return;

  const records = readLocalArray(STORAGE_KEY, isPerformanceRecord);
  for (const row of rows) {
    const id = `${row.student_id}:${row.subject}:${row.term}:${row.academic_year}`;
    const record: PerformanceRecord = { ...row, id };
    const existingIndex = records.findIndex((current) => current.id === id);
    if (existingIndex === -1) records.push(record);
    else records[existingIndex] = record;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  notifyLocalDataUpdated();
}
