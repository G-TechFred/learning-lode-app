/**
 * Online assessment records (Lovable Cloud, table teacher_records).
 * Each teacher has a private workspace keyed by email so entries never mix.
 * Students and parents read the most recently updated record per student.
 */
import { supabase } from "@/integrations/supabase/client";

type Row = { teacher_email: string; student_id: number; data: unknown; updated_at: string };

export async function loadTeacherWorkspace<T extends { id: number }>(email: string, base: T[]): Promise<T[]> {
  const { data, error } = await supabase
    .from("teacher_records")
    .select("student_id, data")
    .eq("teacher_email", email.toLowerCase());
  if (error) throw new Error(error.message);
  const byId = new Map((data ?? []).map((r) => [r.student_id, r.data as T]));
  return base.map((s) => byId.get(s.id) ?? s);
}

export async function saveTeacherWorkspace<T extends { id: number }>(email: string, students: T[], previous: T[]) {
  const prevById = new Map(previous.map((s) => [s.id, JSON.stringify(s)]));
  const changed = students.filter((s) => prevById.get(s.id) !== JSON.stringify(s));
  if (changed.length === 0) return;
  const { error } = await supabase.from("teacher_records").upsert(
    changed.map((s) => ({
      teacher_email: email.toLowerCase(),
      student_id: s.id,
      data: s as never,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: "teacher_email,student_id" },
  );
  if (error) throw new Error(error.message);
}

/** Students/parents: base roster overlaid with each student's latest teacher entry. */
export async function loadPublished<T extends { id: number }>(base: T[]): Promise<T[]> {
  const { data, error } = await supabase
    .from("teacher_records")
    .select("teacher_email, student_id, data, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  const latest = new Map<number, T>();
  for (const r of (data ?? []) as Row[]) if (!latest.has(r.student_id)) latest.set(r.student_id, r.data as T);
  return base.map((s) => latest.get(s.id) ?? s);
}
