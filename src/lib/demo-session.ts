export type DemoRole = "teacher" | "student" | "parent";
export type UserRole = DemoRole | "administrator";

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  school_name: string;
  role: UserRole;
  student_id: number | null;
};

const DEMO_NAMES: Record<DemoRole, string> = {
  teacher: "Demo Teacher",
  student: "Demo Student",
  parent: "Demo Parent",
};

export function createDemoProfile(role: DemoRole, schoolName: string): Profile {
  return {
    id: `local-demo-${role}`,
    email: `${role}@demo.local`,
    full_name: DEMO_NAMES[role],
    school_name: schoolName.trim() || "GODDY MONTESSORI SCHOOL",
    role,
    student_id: null,
  };
}
