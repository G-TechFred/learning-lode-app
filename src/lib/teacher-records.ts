/**
 * Device-stored assessment records.
 * Each teacher has a private workspace (keyed by email) so entries never mix.
 * Every student a teacher changes is also copied to a shared "published" set,
 * which is what students and parents read. Latest teacher change wins.
 */
const WORKSPACE_PREFIX = "gms-records:teacher:";
const PUBLISHED_KEY = "gms-records:published";

type Published<T> = Record<string, { student: T; by: string; at: number }>;

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function loadTeacherWorkspace<T>(email: string): T[] | null {
  return read<T[]>(WORKSPACE_PREFIX + email.toLowerCase());
}

export function saveTeacherWorkspace<T extends { id: number }>(email: string, students: T[], previous: T[]) {
  localStorage.setItem(WORKSPACE_PREFIX + email.toLowerCase(), JSON.stringify(students));
  const published = read<Published<T>>(PUBLISHED_KEY) ?? {};
  const prevById = new Map(previous.map((s) => [s.id, JSON.stringify(s)]));
  let changed = false;
  for (const s of students) {
    if (prevById.get(s.id) !== JSON.stringify(s)) {
      published[String(s.id)] = { student: s, by: email.toLowerCase(), at: Date.now() };
      changed = true;
    }
  }
  if (changed) localStorage.setItem(PUBLISHED_KEY, JSON.stringify(published));
}

/** Students/parents: base roster overlaid with the latest teacher-published entries. */
export function loadPublished<T extends { id: number }>(base: T[]): T[] {
  const published = read<Published<T>>(PUBLISHED_KEY) ?? {};
  return base.map((s) => published[String(s.id)]?.student ?? s);
}
