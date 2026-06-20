import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "teacher" | "student" | "parent";
  schoolName: string;
  createdAt: string;
};

export type Student = {
  id: string;
  userId: string;
  name: string;
  class: string;
  schoolId: string;
  createdAt: string;
};

export type Grade = {
  id: string;
  studentId: string;
  teacherId: string;
  subject: string;
  grade: number;
  attendance: number;
  participation: number;
  remark: string;
  recordedAt: string;
};

export type ParentStudent = {
  id: string;
  parentId: string;
  studentId: string;
  createdAt: string;
};
