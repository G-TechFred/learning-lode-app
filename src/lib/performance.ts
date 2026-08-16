import { supabase } from "@/integrations/external-supabase/client";

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

/** GES weighting: 50% continuous assessment (SBA) + 50% end-of-term exam. */
export function totalScore(record: Pick<PerformanceRecord, "class_score" | "exam_score">) {
  return Math.round(record.class_score * 0.5 + record.exam_score * 0.5);
}

export async function fetchPerformance(
  studentId: number,
  term: string,
  academicYear: string,
): Promise<PerformanceRecord[]> {
  const { data, error } = await supabase
    .from("student_performance")
    .select("id, student_id, subject, class_score, exam_score, attendance, participation, remark, term, academic_year")
    .eq("student_id", studentId)
    .eq("term", term)
    .eq("academic_year", academicYear);

  if (error) throw new Error(error.message);
  return (data ?? []) as PerformanceRecord[];
}

/** Teacher-only write (enforced by row level security). */
export async function savePerformance(
  rows: Array<Omit<PerformanceRecord, "id">>,
): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await supabase
    .from("student_performance")
    .upsert(rows, { onConflict: "student_id,subject,term,academic_year" });
  if (error) throw new Error(error.message);
}
