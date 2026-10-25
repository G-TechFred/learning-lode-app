import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import splashBg from "@/assets/splash-bg.jpg";
import {
  Users,
  TrendingUp,
  CalendarCheck,
  AlertTriangle,
  GraduationCap,
  UserPlus,
  ClipboardList,
  CheckSquare,
  Search,
  Sparkles,
  BookOpen,
  Award,
  LogIn,
  ArrowLeft,
  ChevronRight,
  Bell,
  HandMetal,
  MessageSquare,
  Settings,
  Eye,
  EyeOff,
  ShieldCheck,
  FileText,
  Pencil,
  Trash2,
  Plus,
  X,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import type { Profile, UserRole } from "@/lib/demo-session";
import {
  DEMO_ASSESSMENTS_STORAGE_KEY,
  DEMO_ROSTER_STORAGE_KEY,
  assessmentPercent,
  loadDemoAssessments,
  loadDemoRoster,
  saveDemoAssessments,
  saveDemoRoster,
  saveDemoRosterAndAssessments,
  type DemoAssessment,
  type DemoAssessmentKind,
} from "@/lib/demo-data";
import {
  loadStudentHistory,
  loadTeacherWorkspace,
  saveTeacherWorkspace,
  loadPublished,
  type StudentRecordSnapshot,
} from "@/lib/teacher-records";
import { savePerformance, totalScore } from "@/lib/performance";
import { useLocalPerformance } from "@/hooks/useLocalPerformance";
import { LOCAL_DATA_UPDATED } from "@/lib/local-data";
import { notify, notifyOnce, useNotifications } from "@/lib/notifications";
import { NotificationCenter } from "@/components/NotificationCenter";
import { SettingsPanel, type SettingsTab } from "@/components/SettingsPanel";
import {
  loadAdminDemoSettings,
  saveAdminDemoSettings,
  type AdminDemoClass,
  type AdminDemoSettings,
  type AdminDemoSubject,
  type AdminDemoTeacher,
} from "@/lib/admin-demo-data";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GODDY MONTESSORI SCHOOL — Student Performance Tracker" },
      { name: "description", content: "A local demonstration dashboard for teachers, students and parents to preview grades, attendance and progress." },
      { property: "og:title", content: "GODDY MONTESSORI SCHOOL — Student Performance Tracker" },
      { property: "og:description", content: "Preview analytics for teachers, students and parents using local demo data." },
    ],
  }),
  component: App,
});

type Role = UserRole;
type LoginRole = Role;
type DemoRole = Exclude<Role, "administrator">;

function isUserRole(value: unknown): value is UserRole {
  return value === "teacher" || value === "student" || value === "parent" || value === "administrator";
}

const DEMO_STUDENT_ID = 10001;

const DEMO_ACCOUNTS: Record<DemoRole, { role: DemoRole; displayName: string; email: string; password: string; studentId: number | null }> = {
  student: {
    role: "student",
    displayName: "Demo Student",
    email: "student@goddymontessori.com",
    password: "performance@2026",
    studentId: DEMO_STUDENT_ID,
  },
  teacher: {
    role: "teacher",
    displayName: "Demo Teacher",
    email: "teacher@goddymontessori.com",
    password: "performance@2026",
    studentId: null,
  },
  parent: {
    role: "parent",
    displayName: "Demo Parent",
    email: "parent@goddymontessori.com",
    password: "performance@2026",
    studentId: DEMO_STUDENT_ID,
  },
};

const SUBJECTS = ["Math", "Science", "English", "History", "ICT"] as const;
type Subject = typeof SUBJECTS[number];

const LEVELS = [
  "Basic 1", "Basic 2", "Basic 3", "Basic 4", "Basic 5", "Basic 6",
  "JHS 1", "JHS 2", "JHS 3",
] as const;
type Level = typeof LEVELS[number];
function isLevel(value: unknown): value is Level {
  return typeof value === "string" && (LEVELS as readonly string[]).includes(value);
}

const STREAMS = ["A", "B", "Unique", "Gold", "Silver"] as const;
type Stream = typeof STREAMS[number];
function isStream(value: unknown): value is Stream {
  return typeof value === "string" && (STREAMS as readonly string[]).includes(value);
}

const TERMS = ["Term 1", "Term 2", "Term 3"] as const;
type Term = typeof TERMS[number];

const ACADEMIC_YEARS = ["2024/2025", "2025/2026", "2026/2027"] as const;
type AcademicYear = typeof ACADEMIC_YEARS[number];

type Student = {
  id: number;
  name: string;
  level: Level;
  stream: Stream;
  grades: Record<Subject, number>;
  attendance: number;
  participation: Record<Subject, number>;
  remarks: Record<Subject, string>;
  recordedSubjects?: Subject[];
  attendanceRecorded?: boolean;
};

const classLabel = (s: { level: string; stream: string }) => `${s.level} ${s.stream}`;

type TeacherAssignment = { classes: string[]; subjects: Subject[] };

const DEMO_TEACHER_ASSIGNMENT: TeacherAssignment = {
  classes: ["JHS 2 Unique", "Basic 5 B"],
  subjects: [...SUBJECTS],
};

function teacherAssignmentFor(email: string): TeacherAssignment | null {
  return email.toLowerCase() === DEMO_ACCOUNTS.teacher.email ? DEMO_TEACHER_ASSIGNMENT : null;
}

function demoAccountForEmail(email: string | undefined) {
  return Object.values(DEMO_ACCOUNTS).find((account) => account.email === email?.toLowerCase());
}

const DEMO_STUDENT_NAMES = [
  "Amara Okafor", "Kwame Mensah", "Akosua Boateng", "Esi Asante", "Kofi Owusu",
  "Abena Osei", "Yaw Appiah", "Adwoa Mensima", "Kojo Agyeman", "Efua Antwi",
  "Nana Kwarteng", "Akua Frimpong", "Kwesi Addo", "Ama Bediako", "Kwaku Sarpong",
  "Abigail Tetteh", "Kweku Nyarko", "Mabel Annan", "Selorm Dapaah", "Fiifi Arthur",
  "Akua Opoku", "Yaw Boakye", "Naa Lartey", "Kofi Baah", "Enyonam Quaye",
];

const DEMO_FEEDBACK: Record<Subject, string> = {
  Math: "Shows strong number sense. Keep explaining each step when solving multi-part problems.",
  Science: "Asks thoughtful questions and connects lessons to observations. Review key vocabulary weekly.",
  English: "Writes with a clear voice. Continue reading aloud and checking punctuation before submitting.",
  History: "Understands important events well. Practice supporting answers with details from the lesson.",
  ICT: "Works confidently with digital tools. Keep practicing safe file organization and keyboard shortcuts.",
};

function demoScore(studentId: number, subjectIndex: number, termIndex: number, kindIndex: number) {
  return 62 + ((studentId * 7 + subjectIndex * 11 + termIndex * 5 + kindIndex * 3) % 37);
}

function createDemoRoster(): Student[] {
  return DEMO_STUDENT_NAMES.map((name, index) => {
    const id = DEMO_STUDENT_ID + index;
    const isJuniorClass = index < 13;
    const grades = Object.fromEntries(SUBJECTS.map((subject, subjectIndex) => {
      const scores = [0, 1, 2].flatMap((termIndex) =>
        [0, 1, 2, 3].filter((kindIndex) => !(termIndex === 2 && kindIndex === 0))
          .map((kindIndex) => demoScore(id, subjectIndex, termIndex, kindIndex)),
      );
      return [subject, Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)];
    })) as Record<Subject, number>;
    const remarks = Object.fromEntries(SUBJECTS.map((subject) => [
      subject,
      id === DEMO_STUDENT_ID ? DEMO_FEEDBACK[subject] : "Participates consistently and is making steady progress. Review class notes and practice a little each week.",
    ])) as Record<Subject, string>;
    return {
      id,
      name,
      level: isJuniorClass ? "JHS 2" : "Basic 5",
      stream: isJuniorClass ? "Unique" : "B",
      grades,
      attendance: 88 + ((index * 7) % 13),
      participation: Object.fromEntries(SUBJECTS.map((subject, subjectIndex) => [
        subject,
        6 + ((index + subjectIndex * 2) % 5),
      ])) as Record<Subject, number>,
      remarks,
      recordedSubjects: [...SUBJECTS],
      attendanceRecorded: true,
    };
  });
}

function createDemoAssessments(): DemoAssessment[] {
  const kinds: DemoAssessmentKind[] = ["assignment", "quiz", "test", "examination"];
  const terms: Term[] = ["Term 1", "Term 2", "Term 3"];
  const now = new Date();
  const completedDate = (daysAgo: number) => {
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().slice(0, 10);
  };
  const upcomingDate = new Date(now);
  upcomingDate.setDate(upcomingDate.getDate() + 7);
  const assessments: DemoAssessment[] = [];

  for (let studentOffset = 0; studentOffset < DEMO_STUDENT_NAMES.length; studentOffset += 1) {
    const studentId = DEMO_STUDENT_ID + studentOffset;
    for (let termIndex = 0; termIndex < terms.length; termIndex += 1) {
      for (let subjectIndex = 0; subjectIndex < SUBJECTS.length; subjectIndex += 1) {
        for (let kindIndex = 0; kindIndex < kinds.length; kindIndex += 1) {
          const upcoming = termIndex === 2 && kindIndex === 0;
          const subject = SUBJECTS[subjectIndex];
          const kind = kinds[kindIndex];
          assessments.push({
            id: `${studentId}-${termIndex}-${subject}-${kind}`,
            studentId,
            subject,
            term: terms[termIndex],
            academicYear: "2025/2026",
            kind,
            title: `${subject} ${kind === "examination" ? "examination" : kind}`,
            score: upcoming ? null : demoScore(studentId, subjectIndex, termIndex, kindIndex),
            maxScore: 100,
            dueDate: upcoming
              ? upcomingDate.toISOString().slice(0, 10)
              : completedDate((2 - termIndex) * 45 + subjectIndex * 2 + kindIndex),
            feedback: studentId === DEMO_STUDENT_ID
              ? DEMO_FEEDBACK[subject]
              : "Good effort. Review the marked questions and practice the key skills.",
            status: upcoming ? "upcoming" : "completed",
            origin: "sample",
          });
        }
      }
    }
  }
  return assessments;
}

type DemoParentUpdate = {
  id: string;
  studentId: number;
  term: Term;
  title: string;
  message: string;
  suggestedAction: string;
};

const DEMO_PARENT_ONLY_UPDATES: DemoParentUpdate[] = [
  {
    id: "amara-family-reading",
    studentId: DEMO_STUDENT_ID,
    term: "Term 1",
    title: "Home reading routine",
    message: "Amara is building confidence when explaining what she has read. A short, regular reading conversation at home may reinforce this progress.",
    suggestedAction: "Invite her to describe one character or idea after a reading session.",
  },
  {
    id: "amara-family-study",
    studentId: DEMO_STUDENT_ID,
    term: "Term 2",
    title: "Study habit suggestion",
    message: "Breaking revision into small sessions has helped Amara stay focused during class practice.",
    suggestedAction: "Try a brief study session with a short break, and encourage her to show how she solved one problem.",
  },
  {
    id: "amara-family-term-review",
    studentId: DEMO_STUDENT_ID,
    term: "Term 3",
    title: "Family-teacher check-in",
    message: "This fictional progress note is intended for the parent or guardian view and is separate from the student-facing assessment feedback.",
    suggestedAction: "Use the next school check-in to discuss which learning strategies are working well at home and in class.",
  },
];

function isDemoAssessment(value: unknown): value is DemoAssessment {
  if (!isRecord(value)) return false;
  return typeof value.id === "string" &&
    typeof value.studentId === "number" &&
    typeof value.subject === "string" &&
    (SUBJECTS as readonly string[]).includes(value.subject) &&
    typeof value.term === "string" &&
    typeof value.academicYear === "string" &&
    ["assignment", "quiz", "test", "examination"].includes(String(value.kind)) &&
    typeof value.title === "string" &&
    (value.score === null || typeof value.score === "number") &&
    typeof value.maxScore === "number" &&
    typeof value.dueDate === "string" &&
    typeof value.feedback === "string" &&
    (value.status === "completed" || value.status === "upcoming") &&
    (!("origin" in value) || value.origin === "sample" || value.origin === "teacher-entry");
}

function summarizeDemoAssessments(
  student: Student,
  assessments: DemoAssessment[],
  fallback: Student = student,
  refreshSubjects?: ReadonlySet<Subject>,
): Student {
  const grades = { ...student.grades };
  const remarks = { ...student.remarks };
  const recordedSubjects = new Set(student.recordedSubjects ?? []);

  for (const subject of SUBJECTS) {
    if (refreshSubjects && !refreshSubjects.has(subject)) continue;
    const completed = assessments
      .filter((assessment) =>
        assessment.studentId === student.id &&
        assessment.subject === subject &&
        assessment.status === "completed" &&
        assessment.score !== null,
      )
      .sort((a, b) => b.dueDate.localeCompare(a.dueDate));
    const percentages = completed.flatMap((assessment) => {
      const percentage = assessmentPercent(assessment);
      return percentage === null ? [] : [percentage];
    });

    if (percentages.length > 0) {
      grades[subject] = Math.round(percentages.reduce((sum, score) => sum + score, 0) / percentages.length);
      recordedSubjects.add(subject);
      const latestFeedback = completed.find((assessment) => assessment.feedback.trim());
      if (latestFeedback) remarks[subject] = latestFeedback.feedback.trim();
    } else {
      grades[subject] = fallback.grades[subject];
      remarks[subject] = fallback.remarks[subject];
      if (fallback.recordedSubjects?.includes(subject)) recordedSubjects.add(subject);
      else recordedSubjects.delete(subject);
    }
  }

  return { ...student, grades, remarks, recordedSubjects: [...recordedSubjects] };
}

function refreshChangedAssessmentSummaries(
  students: Student[],
  previous: DemoAssessment[],
  next: DemoAssessment[],
): Student[] {
  const previousById = new Map(previous.map((assessment) => [assessment.id, assessment]));
  const nextById = new Map(next.map((assessment) => [assessment.id, assessment]));
  const changedIds = new Set([...previousById.keys(), ...nextById.keys()]);
  const subjectsByStudent = new Map<number, Set<Subject>>();

  for (const id of changedIds) {
    const before = previousById.get(id);
    const after = nextById.get(id);
    if (JSON.stringify(before) === JSON.stringify(after)) continue;
    for (const assessment of [before, after]) {
      if (!assessment || !(SUBJECTS as readonly string[]).includes(assessment.subject)) continue;
      const subject = assessment.subject as Subject;
      const subjects = subjectsByStudent.get(assessment.studentId) ?? new Set<Subject>();
      subjects.add(subject);
      subjectsByStudent.set(assessment.studentId, subjects);
    }
  }

  return students.map((student) => {
    const changedSubjects = subjectsByStudent.get(student.id);
    if (!changedSubjects) return student;
    return summarizeDemoAssessments(
      student,
      next,
      DEMO_ROSTER_SEED.find((seedStudent) => seedStudent.id === student.id) ?? student,
      changedSubjects,
    );
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStudentSnapshot(value: unknown): value is Student {
  if (!isRecord(value)) return false;
  if (
    typeof value.id !== "number" ||
    typeof value.name !== "string" ||
    !(LEVELS as readonly unknown[]).includes(value.level) ||
    !(STREAMS as readonly unknown[]).includes(value.stream) ||
    typeof value.attendance !== "number"
  ) {
    return false;
  }
  const grades = value.grades;
  const participation = value.participation;
  const remarks = value.remarks;
  if (!isRecord(grades) || !isRecord(participation) || !isRecord(remarks)) return false;
  return SUBJECTS.every(
    (subject) =>
      subject in grades &&
      typeof grades[subject] === "number" &&
      subject in participation &&
      typeof participation[subject] === "number" &&
      subject in remarks &&
      typeof remarks[subject] === "string",
  );
}

const INITIAL_STUDENTS: Student[] = [
  { id: 1, name: "Amara Okafor", level: "JHS 2", stream: "Unique", grades: { Math: 0, Science: 0, English: 0, History: 0, ICT: 0 }, attendance: 0, participation: { Math: 0, Science: 0, English: 0, History: 0, ICT: 0 }, remarks: { Math: "", Science: "", English: "", History: "", ICT: "" } },
  { id: 2, name: "Kwame Mensah", level: "JHS 2", stream: "Unique", grades: { Math: 0, Science: 0, English: 0, History: 0, ICT: 0 }, attendance: 0, participation: { Math: 0, Science: 0, English: 0, History: 0, ICT: 0 }, remarks: { Math: "", Science: "", English: "", History: "", ICT: "" } },
  { id: 3, name: "Akosua Boateng", level: "Basic 5", stream: "B", grades: { Math: 0, Science: 0, English: 0, History: 0, ICT: 0 }, attendance: 0, participation: { Math: 0, Science: 0, English: 0, History: 0, ICT: 0 }, remarks: { Math: "", Science: "", English: "", History: "", ICT: "" } },
  { id: 4, name: "Kojo Asante", level: "Basic 4", stream: "A", grades: { Math: 0, Science: 0, English: 0, History: 0, ICT: 0 }, attendance: 0, participation: { Math: 0, Science: 0, English: 0, History: 0, ICT: 0 }, remarks: { Math: "", Science: "", English: "", History: "", ICT: "" } },
  { id: 5, name: "Yaa Owusu", level: "JHS 1", stream: "Gold", grades: { Math: 0, Science: 0, English: 0, History: 0, ICT: 0 }, attendance: 0, participation: { Math: 0, Science: 0, English: 0, History: 0, ICT: 0 }, remarks: { Math: "", Science: "", English: "", History: "", ICT: "" } },
  { id: 6, name: "Nana Adjei", level: "JHS 3", stream: "A", grades: { Math: 0, Science: 0, English: 0, History: 0, ICT: 0 }, attendance: 0, participation: { Math: 0, Science: 0, English: 0, History: 0, ICT: 0 }, remarks: { Math: "", Science: "", English: "", History: "", ICT: "" } },
];

const DEMO_ROSTER_SEED = createDemoRoster();
const DEMO_ASSESSMENTS_SEED = createDemoAssessments();

function overall(s: Student) {
  const v = Object.values(s.grades);
  return Math.round(v.reduce((a, b) => a + b, 0) / v.length);
}

function statusOf(s: Student) {
  const g = overall(s);
  if (g < 70 || s.attendance < 85) return "at-risk" as const;
  if (g >= 85) return "excelling" as const;
  return "average" as const;
}

function letter(n: number) {
  if (n >= 90) return "A";
  if (n >= 80) return "B";
  if (n >= 70) return "C";
  if (n >= 60) return "D";
  return "F";
}

type AuthScreen = "login" | "forgot-password";

const ROLE_THEME: Record<LoginRole, { name: string; bg: string; card: string; accent: string; ring: string; icon: typeof Users; tag: string; tagline: string }> = {
  teacher: {
    name: "Teacher",
    bg: "bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900",
    card: "bg-white",
    accent: "bg-indigo-600 hover:bg-indigo-700",
    ring: "focus-visible:ring-indigo-500",
    icon: GraduationCap,
    tag: "Educator Portal",
    tagline: "Shape classrooms with data-driven insights.",
  },
  student: {
    name: "Student",
    bg: "bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-900",
    card: "bg-white",
    accent: "bg-emerald-600 hover:bg-emerald-700",
    ring: "focus-visible:ring-emerald-500",
    icon: BookOpen,
    tag: "Learner Portal",
    tagline: "Track your growth, own your journey.",
  },
  parent: {
    name: "Parent/Guardian",
    bg: "bg-gradient-to-br from-amber-950 via-slate-900 to-rose-950",
    card: "bg-white",
    accent: "bg-amber-600 hover:bg-amber-700",
    ring: "focus-visible:ring-amber-500",
    icon: Award,
    tag: "Guardian Portal",
    tagline: "Stay close to every milestone.",
  },
  administrator: {
    name: "School Administrator",
    bg: "bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950",
    card: "bg-white",
    accent: "bg-slate-700 hover:bg-slate-800",
    ring: "focus-visible:ring-slate-500",
    icon: ShieldCheck,
    tag: "School Administration",
    tagline: "Manage school information and academic structures.",
  },
};

const TEACHER_REMARKS = {
  good: [
    "Excellent work! Shows outstanding mastery of the subject.",
    "Consistently demonstrates strong understanding and engagement.",
    "Exceptional effort and dedication to learning.",
    "Actively participates and contributes thoughtful insights.",
    "Shows remarkable improvement throughout the term.",
    "Demonstrates problem-solving skills and critical thinking.",
    "Very collaborative and supportive of peers.",
    "Completes assignments with care and attention to detail.",
    "Asks insightful questions and seeks clarification.",
    "Shows genuine interest and curiosity in the subject.",
    "Well-prepared and organized in all class activities.",
    "Displays leadership qualities and takes initiative.",
    "Shows creativity and original thinking in assignments.",
    "Reliable and consistent in academic performance.",
    "Demonstrates excellent time management skills.",
    "Shows respect and positive attitude toward learning.",
    "Makes meaningful contributions to class discussions.",
  ],
  bad: [
    "Needs to improve focus and reduce distractions during class.",
    "Frequently incomplete or missing assignments.",
    "Shows minimal effort and engagement with material.",
    "Disruptive behavior is affecting class learning environment.",
    "Attendance issues are impacting academic progress.",
    "Struggling to understand fundamental concepts.",
    "Does not actively participate or engage in discussions.",
    "Needs to improve organization and time management.",
    "Often unprepared for class activities and assessments.",
    "Shows little interest or motivation in the subject.",
    "Communication and collaboration with peers needs work.",
    "Requires more focus on accuracy and quality of work.",
    "Behavior concerns are hindering academic progress.",
  ],
};

function ForgotPasswordPage({ role, onBack }: { role: LoginRole; onBack: () => void }) {
  const theme = ROLE_THEME[role];
  const Icon = theme.icon;
  return (
    <div className={`relative min-h-screen ${theme.bg} text-white`}>
      <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_15%_20%,#fff_0,transparent_35%),radial-gradient(circle_at_85%_75%,#fff_0,transparent_35%)]" />
      <button onClick={onBack} className="absolute left-4 top-4 z-10 inline-flex items-center gap-1 text-sm text-white/70 hover:text-white sm:left-6 sm:top-6">
        <ChevronRight className="h-4 w-4 rotate-180" /> Back
      </button>
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-4 py-10 sm:px-6 lg:flex-row lg:gap-12">
        <div className="mb-8 max-w-md text-center lg:mb-0 lg:flex-1 lg:text-left">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
            <Icon className="h-7 w-7" />
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-white/60">{theme.tag}</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Reset Your Password</h1>
          <p className="mt-3 text-sm text-white/70 sm:text-base">Password recovery is disabled for shared demo accounts.</p>
        </div>

        <Card className="w-full max-w-md border-0 shadow-2xl lg:flex-1">
          <CardHeader>
            <CardTitle className="text-xl text-slate-900">Forgot Password</CardTitle>
            <CardDescription>Demo accounts use a shared, pre-provisioned password.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
                Password recovery requires a real authentication service and cannot be performed in this demo.
              </div>
              <Button className={`w-full ${theme.accent} text-white`} onClick={onBack}>
                Back to sign in
              </Button>
            </div>
          </CardContent>

        </Card>
      </div>
    </div>
  );
}

function App() {
  const [pendingRole, setPendingRole] = useState<LoginRole | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [splashDone, setSplashDone] = useState(false);
  const [authScreen, setAuthScreen] = useState<AuthScreen>("login");
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("profile");

  const [showNotifications, setShowNotifications] = useState(false);
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [selectedStudentId, setSelectedStudentId] = useState<number>(INITIAL_STUDENTS[0].id);
  const [academicYear, setAcademicYear] = useState<AcademicYear>("2025/2026");
  const [term, setTerm] = useState<Term>("Term 1");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [demoAssessments, setDemoAssessments] = useState<DemoAssessment[]>([]);
  const [showWelcome, setShowWelcome] = useState(true);
  const [teacherWorkspaceReady, setTeacherWorkspaceReady] = useState(false);
  const syncedRef = useRef<string>("");
  const { unread } = useNotifications();

  // Load the right records for whoever signs in: a teacher's own workspace,
  // or the latest teacher-published results for students and parents.
  const workspaceRef = useRef<{ email: string; students: Student[]; demo: boolean } | null>(null);
  const skipDemoExamSyncRef = useRef(false);

  const saveAssessmentChanges = (assessments: DemoAssessment[]) => {
    saveDemoAssessments(assessments);
    skipDemoExamSyncRef.current = true;
    setDemoAssessments(assessments);
    setStudents((currentStudents) => refreshChangedAssessmentSummaries(currentStudents, demoAssessments, assessments));
  };

  useEffect(() => {
    if (!role || !profile) {
      workspaceRef.current = null;
      setStudents(INITIAL_STUDENTS);
      setTeacherWorkspaceReady(false);
      return;
    }
    let active = true;
    const email = profile.email;
    const isTeacher = role === "teacher";
    const demoAccount = demoAccountForEmail(email);
    if (isTeacher) setTeacherWorkspaceReady(false);
    if (demoAccount) {
      try {
        const roster = loadDemoRoster(DEMO_ROSTER_SEED, isStudentSnapshot);
        setDemoAssessments(loadDemoAssessments(DEMO_ASSESSMENTS_SEED, isDemoAssessment));
        const visibleRoster = isTeacher
          ? roster
          : roster.filter((student) => student.id === demoAccount.studentId);
        if (isTeacher) workspaceRef.current = { email, students: visibleRoster, demo: true };
        setStudents(visibleRoster);
        if (isTeacher) setTeacherWorkspaceReady(true);
      } catch (e) {
        notify({ title: "Could not load fictional demo records", body: e instanceof Error ? e.message : "Check browser storage availability.", kind: "error" });
        if (isTeacher) setTeacherWorkspaceReady(true);
      }
      return () => { active = false; };
    }
    setDemoAssessments([]);
    const assignment = isTeacher ? teacherAssignmentFor(email) : null;
    const teacherRoster = assignment
      ? INITIAL_STUDENTS.filter((student) => assignment.classes.includes(classLabel(student)))
      : [];
    workspaceRef.current = null;
    setStudents(INITIAL_STUDENTS);
    (isTeacher ? loadTeacherWorkspace(email, teacherRoster) : loadPublished(INITIAL_STUDENTS))
      .then((list) => {
        if (!active) return;
        if (isTeacher) workspaceRef.current = { email, students: list, demo: false };
        setStudents(list);
        if (isTeacher) setTeacherWorkspaceReady(true);
      })
      .catch((e: unknown) => {
        if (!active) return;
        notify({ title: "Could not load local demo records", body: e instanceof Error ? e.message : "Check browser storage availability.", kind: "error" });
        if (isTeacher) setTeacherWorkspaceReady(true);
      });
    return () => { active = false; };
  }, [role, profile?.email]);

  // Teachers: save every change to their own workspace and publish it.
  useEffect(() => {
    const ws = workspaceRef.current;
    if (role !== "teacher" || !teacherWorkspaceReady || !ws || ws.students === students) return;
    const previous = ws.students;
    ws.students = students;
    if (ws.demo) {
      try {
        saveDemoRoster(students);
        if (skipDemoExamSyncRef.current) {
          skipDemoExamSyncRef.current = false;
          return;
        }
        const updatedAssessments: DemoAssessment[] = demoAssessments.map((assessment) => {
          if (
            assessment.term !== term ||
            assessment.academicYear !== academicYear ||
            assessment.kind !== "examination"
          ) return assessment;
          const before = previous.find((student) => student.id === assessment.studentId);
          const after = students.find((student) => student.id === assessment.studentId);
          if (!before || !after || before.grades[assessment.subject as Subject] === after.grades[assessment.subject as Subject] &&
            before.remarks[assessment.subject as Subject] === after.remarks[assessment.subject as Subject]) return assessment;
          const subject = assessment.subject as Subject;
          return {
            ...assessment,
            score: after.grades[subject],
            maxScore: 100,
            feedback: after.remarks[subject] || assessment.feedback,
            status: "completed",
            origin: "teacher-entry",
          };
        });
        if (updatedAssessments.some((assessment, index) => assessment !== demoAssessments[index])) {
          setDemoAssessments(updatedAssessments);
          saveDemoAssessments(updatedAssessments);
        }
      } catch (e) {
        skipDemoExamSyncRef.current = false;
        notify({ title: "Could not save fictional demo records", body: e instanceof Error ? e.message : "Check browser storage availability.", kind: "error" });
      }
      return;
    }
    saveTeacherWorkspace(ws.email, students, previous).catch((e: unknown) => {
      notify({ title: "Could not save local demo records", body: e instanceof Error ? e.message : "Check browser storage availability.", kind: "error" });
    });
  }, [students, role, teacherWorkspaceReady, demoAssessments, term, academicYear]);

  useEffect(() => {
    const account = demoAccountForEmail(profile?.email);
    if (!account) return;
    const reloadDemoRecords = (event: StorageEvent) => {
      try {
        if (event.key === DEMO_ROSTER_STORAGE_KEY) {
          const roster = loadDemoRoster(DEMO_ROSTER_SEED, isStudentSnapshot);
          const visibleRoster = account.role === "teacher"
            ? roster
            : roster.filter((student) => student.id === account.studentId);
          setStudents(visibleRoster);
          if (account.role === "teacher" && workspaceRef.current) {
            workspaceRef.current.students = visibleRoster;
          }
        }
        if (event.key === DEMO_ASSESSMENTS_STORAGE_KEY) {
          const nextAssessments = loadDemoAssessments(DEMO_ASSESSMENTS_SEED, isDemoAssessment);
          setDemoAssessments(nextAssessments);
          setStudents((currentStudents) => {
            const updatedStudents = refreshChangedAssessmentSummaries(currentStudents, demoAssessments, nextAssessments);
            if (account.role === "teacher" && workspaceRef.current) {
              workspaceRef.current.students = updatedStudents;
            }
            return updatedStudents;
          });
        }
      } catch (error) {
        notify({
          title: "Could not refresh fictional demo records",
          body: error instanceof Error ? error.message : "Check browser storage availability.",
          kind: "error",
        });
      }
    };
    window.addEventListener("storage", reloadDemoRecords);
    return () => window.removeEventListener("storage", reloadDemoRecords);
  }, [profile?.email, demoAssessments]);

  // Advisories the user should take note of, raised once per situation.
  useEffect(() => {
    if (!role) return;
    notifyOnce(`term-${term}-${academicYear}-${role}`, {
      title: `Active session: ${term}, ${academicYear}`,
      body: "All entries and report cards apply to this term until you change it.",
      kind: "info",
      hint: "Switch the term from the Academic Session card before entering a new term's results.",
      toast: false,
    });

    if (role === "teacher") {
      const risk = students.filter((s) => statusOf(s) === "at-risk");
      if (risk.length > 0) {
        notifyOnce(`risk-${term}-${academicYear}-${risk.map((s) => s.id).join(",")}`, {
          title: `${risk.length} student${risk.length > 1 ? "s" : ""} need attention`,
          body: risk.map((s) => `${s.name} (${classLabel(s)})`).join(", "),
          kind: "warning",
          hint: "Low averages or attendance below 85% — consider remarks and parent follow-up.",
          toast: false,
        });
      }
    } else {
      const me = students.find((s) => s.id === selectedStudentId);
      if (me && me.attendance < 85) {
        notifyOnce(`att-${me.id}-${term}-${academicYear}`, {
          title: "Attendance below the school threshold",
          body: `${me.name} is at ${me.attendance}% attendance this term.`,
          kind: "warning",
          hint: "Attendance under 85% can affect end-of-term promotion.",
          toast: false,
        });
      }
    }
  }, [role, term, academicYear, students, selectedStudentId]);

  const signOutDemo = async () => {
    try {
      const [{ auth }, { signOut }] = await Promise.all([
        import("@/firebase"),
        import("firebase/auth"),
      ]);
      await signOut(auth);
      setRole(null);
      setPendingRole(null);
      setProfile(null);
      setUserName("");
      setShowSettings(false);
      setShowNotifications(false);
      syncedRef.current = "";
      notify({ title: "Demo account signed out", body: "Your Firebase Authentication session has ended.", kind: "info", toast: false });
    } catch (error) {
      notify({
        title: "Could not sign out",
        body: error instanceof Error ? error.message : "Firebase sign-out failed.",
        kind: "error",
      });
    }
  };

  if (!splashDone) return <SplashScreen onDone={() => setSplashDone(true)} />;
  if (!role && !pendingRole) return <Landing onPick={setPendingRole} />;
  if (!role && pendingRole) {
    if (authScreen === "forgot-password") {
      return <ForgotPasswordPage role={pendingRole} onBack={() => setAuthScreen("login")} />;
    }
    return (
      <LoginPage
        role={pendingRole}
        onBack={() => setPendingRole(null)}
        onForgotPassword={() => setAuthScreen("forgot-password")}
        onSuccess={(firstName, signedInProfile) => {
          const signedInRole = signedInProfile.role;
          setUserName(firstName);
          setProfile(signedInProfile);
          setTeacherWorkspaceReady(false);
          if (signedInProfile?.student_id != null) setSelectedStudentId(signedInProfile.student_id);
          setRole(signedInRole);
          setShowWelcome(true);
          setPendingRole(null);
          const isDemoAccount = Object.values(DEMO_ACCOUNTS).some(
            (account) => account.email === signedInProfile.email.toLowerCase(),
          );
          notify({
            title: isDemoAccount ? `Demo ${signedInRole} account signed in` : `${signedInRole} account signed in`,
            body: isDemoAccount
              ? `Welcome, ${firstName}. Firebase authenticated this demo account; performance records remain local demo data.`
              : `Welcome, ${firstName}. Firebase authenticated your account.`,
            kind: "success",
            toast: false,
          });
          if (signedInRole === "teacher") {
            notify({
              title: "Explore assessment entry",
              body: "Use Enter Performance to preview class scores, exam scores, attendance and remarks.",
              kind: "action",
              hint: "Changes are saved only in this browser and are not shared with school accounts.",
              toast: false,
            });
          } else {
            notify({
              title: "Local demo records",
              body: "Student and parent views use assessment data stored in this browser.",
              kind: "info",
              toast: false,
            });
          }
        }}
      />
    );
  }
  const activeTeacherAssignment =
    role === "teacher" ? teacherAssignmentFor(profile?.email ?? "") : null;
  const activeDemoAccount = demoAccountForEmail(profile?.email);
  const dashboardStudents =
    role === "teacher"
      ? students.filter((student) =>
          activeTeacherAssignment?.classes.includes(classLabel(student)) ?? false,
        )
      : students;
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <NavBar
        role={role!}
        onSignOut={() => void signOutDemo()}
        students={role === "parent" ? [] : dashboardStudents}
        onSelectStudent={(id) => setSelectedStudentId(id)}
        onNotificationClick={() => setShowNotifications(true)}
        onOpenSettings={(t) => { setSettingsTab(t); setShowSettings(true); }}
        unread={unread}
      />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {role === "teacher" && (
          <Button
            variant="outline"
            className="mb-4 gap-2"
            onClick={() => void signOutDemo()}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Button>
        )}
        {activeDemoAccount && (
          <div className="mb-4 rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm font-semibold tracking-wide text-indigo-900">
            DEMO DATA — FICTIONAL RECORDS
          </div>
        )}
        {role === "teacher" && showWelcome ? (
          <TeacherWelcome
            name={profile?.full_name || userName}
            email={profile?.email ?? ""}
            school={profile?.school_name ?? ""}
            students={dashboardStudents}
            onContinue={() => setShowWelcome(false)}
          />
        ) : role === "teacher" && !teacherWorkspaceReady ? (
          <Card>
            <CardContent className="p-6 text-sm text-slate-600">Loading the assigned local demo workspace…</CardContent>
          </Card>
        ) : role === "teacher" ? (
          <TeacherDashboard userName={userName} students={dashboardStudents} setStudents={setStudents} academicYear={academicYear} setAcademicYear={setAcademicYear} term={term} setTerm={setTerm} subjects={activeTeacherAssignment?.subjects ?? []} demoAssessments={demoAssessments} onDemoAssessmentsChange={saveAssessmentChanges} isDemoTeacher={activeDemoAccount?.role === "teacher"} />
        ) : role === "parent" && !activeDemoAccount ? (
          <ParentConnectionDashboard
            parentEmail={profile?.email ?? "parent@demo.local"}
            onBack={() => void signOutDemo()}
          />
        ) : role === "administrator" ? (
          <AdministratorDashboard />
        ) : (
          <StudentParentDashboard
            role={role === "parent" ? "parent" : "student"}
            students={students}
            selectedStudentId={selectedStudentId}
            setSelectedStudentId={setSelectedStudentId}
            term={term}
            academicYear={academicYear}
            onBack={() => void signOutDemo()}
            demoMode={activeDemoAccount !== undefined}
            demoAssessments={demoAssessments}
          />
        )}
      </main>
      <NotificationCenter open={showNotifications} onOpenChange={setShowNotifications} />
      <SettingsPanel
        open={showSettings}
        onOpenChange={setShowSettings}
        profile={{
          fullName: profile?.full_name || userName,
          email: profile?.email ?? "",
          school: profile?.school_name ?? "",
          role: profile?.role ?? role!,
          studentId: profile?.student_id ?? null,
        }}
        tab={settingsTab}
        onTabChange={setSettingsTab}
        onProfileSaved={(name, school) => {
          setUserName(name.split(" ")[0]);
          setProfile((current) =>
            current ? { ...current, full_name: name, school_name: school } : current,
          );
        }}
      />
    </div>
  );
}

function AdministratorDashboard() {
  type EditorKind = "student" | "teacher" | "class" | "subject";
  const [students, setStudents] = useState<Student[]>(() => {
    try {
      return loadDemoRoster(DEMO_ROSTER_SEED, isStudentSnapshot);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load demo students.");
      return DEMO_ROSTER_SEED;
    }
  });
  const [assessments, setAssessments] = useState<DemoAssessment[]>(() => {
    try {
      return loadDemoAssessments(DEMO_ASSESSMENTS_SEED, isDemoAssessment);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load demo assessments.");
      return DEMO_ASSESSMENTS_SEED;
    }
  });
  const settingsSeed: AdminDemoSettings = useMemo(() => ({
    teachers: [{
      id: "demo-teacher-profile",
      name: "Demo Teacher",
      identifier: DEMO_ACCOUNTS.teacher.email,
      classes: [...DEMO_TEACHER_ASSIGNMENT.classes],
      subjects: [...DEMO_TEACHER_ASSIGNMENT.subjects],
    }],
    classes: [...new Map(students.map((student) => {
      const schoolClass = { level: student.level, stream: student.stream };
      return [classLabel(schoolClass), schoolClass] as const;
    })).values()],
    subjects: SUBJECTS.map((name) => ({ name, description: "Core subject in the fictional demo assessment model." })),
  }), [students]);
  const [settings, setSettings] = useState<AdminDemoSettings>(() => {
    try {
      return loadAdminDemoSettings(settingsSeed);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load administrator demo records.");
      return settingsSeed;
    }
  });
  const [query, setQuery] = useState("");
  const [teacherQuery, setTeacherQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [editor, setEditor] = useState<EditorKind | null>(null);
  const [editingKey, setEditingKey] = useState<string | number | null>(null);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    id: "",
    name: "",
    level: "Basic 5" as Level,
    stream: "A" as Stream,
    identifier: "",
    classes: "",
    subjects: "",
    description: "",
  });
  const [assignStudentId, setAssignStudentId] = useState("");
  const [assignClass, setAssignClass] = useState("");

  useEffect(() => {
    const syncOtherTabChanges = (event: StorageEvent) => {
      try {
        if (event.key === DEMO_ROSTER_STORAGE_KEY) {
          setStudents(loadDemoRoster(DEMO_ROSTER_SEED, isStudentSnapshot));
        } else if (event.key === DEMO_ASSESSMENTS_STORAGE_KEY) {
          setAssessments(loadDemoAssessments(DEMO_ASSESSMENTS_SEED, isDemoAssessment));
        } else if (event.key === "gtech.admissions-admin.v1") {
          setSettings(loadAdminDemoSettings(settingsSeed));
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Could not refresh local demo records.");
      }
    };
    window.addEventListener("storage", syncOtherTabChanges);
    return () => window.removeEventListener("storage", syncOtherTabChanges);
  }, [settingsSeed]);

  const persistSettings = (next: AdminDemoSettings) => {
    saveAdminDemoSettings(next);
    setSettings(next);
  };
  const classes = settings.classes;
  const classNames = classes.map(classLabel);
  const recordedScore = (student: Student) => {
    const scores = SUBJECTS.filter((subject) =>
      student.recordedSubjects?.includes(subject) || student.grades[subject] > 0,
    ).map((subject) => student.grades[subject]);
    return scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : null;
  };
  const supportStudents = students.filter((student) => {
    const average = recordedScore(student);
    return (average !== null && average < 70) ||
      (student.attendanceRecorded === true && student.attendance < 85);
  });
  const subjectAverages = SUBJECTS.map((subject) => {
    const scores = students
      .filter((student) => student.recordedSubjects?.includes(subject) || student.grades[subject] > 0)
      .map((student) => student.grades[subject]);
    return { subject, average: scores.length
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : 0 };
  });
  const classAverages = classes.map((schoolClass) => {
    const classStudents = students.filter((student) => classLabel(student) === classLabel(schoolClass));
    const averages = classStudents.flatMap((student) => {
      const average = recordedScore(student);
      return average === null ? [] : [average];
    });
    return {
      name: classLabel(schoolClass),
      count: classStudents.length,
      average: averages.length
        ? Math.round(averages.reduce((sum, score) => sum + score, 0) / averages.length)
        : null,
    };
  });
  const attendanceStudents = students.filter((student) => student.attendanceRecorded === true || student.attendance > 0);
  const attendanceAverage = attendanceStudents.length
    ? Math.round(attendanceStudents.reduce((sum, student) => sum + student.attendance, 0) / attendanceStudents.length)
    : null;
  const scoreValues = students.flatMap((student) => {
    const average = recordedScore(student);
    return average === null ? [] : [average];
  });
  const overallAverage = scoreValues.length
    ? Math.round(scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length)
    : null;
  const filteredStudents = students.filter((student) =>
    (student.name.toLowerCase().includes(query.trim().toLowerCase()) ||
      String(student.id).includes(query.trim())) &&
    (classFilter === "all" || classLabel(student) === classFilter),
  );
  const filteredTeachers = settings.teachers.filter((teacher) =>
    teacher.name.toLowerCase().includes(teacherQuery.trim().toLowerCase()) ||
    teacher.identifier.toLowerCase().includes(teacherQuery.trim().toLowerCase()),
  );
  const selectedStudent = students.find((student) => student.id === selectedStudentId);
  const recentAssessments = [...assessments]
    .filter((assessment) => assessment.status === "completed")
    .sort((first, second) => second.dueDate.localeCompare(first.dueDate))
    .slice(0, 6);
  const sections = [
    ["admin-overview", "Overview"],
    ["admin-students", "Students"],
    ["admin-teachers", "Teachers"],
    ["admin-classes", "Classes"],
    ["admin-subjects", "Subjects"],
    ["admin-academics", "Academic management"],
    ["admin-reports", "Reports"],
    ["admin-settings", "Settings"],
  ] as const;
  const openEditor = (kind: EditorKind, key?: string | number) => {
    setEditor(kind);
    setEditingKey(key ?? null);
    setFormError("");
    if (kind === "student") {
      const student = students.find((item) => item.id === key);
      setForm({
        id: student ? String(student.id) : String(Date.now()),
        name: student?.name ?? "",
        level: student?.level ?? (isLevel(classes[0]?.level) ? classes[0].level : "Basic 5"),
        stream: student?.stream ?? (isStream(classes[0]?.stream) ? classes[0].stream : "A"),
        identifier: "",
        classes: "",
        subjects: "",
        description: "",
      });
    } else if (kind === "teacher") {
      const teacher = settings.teachers.find((item) => item.id === key);
      setForm({
        id: "",
        name: teacher?.name ?? "",
        level: "Basic 5",
        stream: "A",
        identifier: teacher?.identifier ?? "",
        classes: teacher?.classes.join(", ") ?? "",
        subjects: teacher?.subjects.join(", ") ?? "",
        description: "",
      });
    } else if (kind === "class") {
      const schoolClass = classes.find((item) => classLabel(item) === key);
      setForm({
        id: "",
        name: "",
        level: isLevel(schoolClass?.level) ? schoolClass.level : "Basic 5",
        stream: isStream(schoolClass?.stream) ? schoolClass.stream : "A",
        identifier: "",
        classes: "",
        subjects: "",
        description: "",
      });
    } else {
      const subject = settings.subjects.find((item) => item.name === key);
      setForm({
        id: "",
        name: subject?.name ?? "",
        level: "Basic 5",
        stream: "A",
        identifier: "",
        classes: "",
        subjects: "",
        description: subject?.description ?? "",
      });
    }
  };
  const saveStudent = (next: Student[]) => {
    saveDemoRoster(next);
    setStudents(next);
  };
  const submitEditor = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    const name = form.name.trim();
    if (!name) {
      setFormError("Enter a name.");
      return;
    }
    try {
      if (editor === "student") {
        const id = Number(form.id);
        if (!Number.isSafeInteger(id) || id <= 0) {
          setFormError("Enter a valid positive numeric student ID.");
          return;
        }
        if (students.some((student) => student.id === id && student.id !== editingKey)) {
          setFormError("That student ID already exists.");
          return;
        }
        if (!classes.some((schoolClass) =>
          schoolClass.level === form.level && schoolClass.stream === form.stream,
        )) {
          setFormError("Create the class before assigning a student to it.");
          return;
        }
        const next = editingKey === null
          ? [...students, {
            id,
            name,
            level: form.level,
            stream: form.stream,
            grades: { Math: 0, Science: 0, English: 0, History: 0, ICT: 0 },
            attendance: 0,
            participation: { Math: 0, Science: 0, English: 0, History: 0, ICT: 0 },
            remarks: { Math: "", Science: "", English: "", History: "", ICT: "" },
            recordedSubjects: [],
            attendanceRecorded: false,
          }]
          : students.map((student) => student.id === editingKey
            ? { ...student, name, level: form.level, stream: form.stream }
            : student);
        saveStudent(next);
        toast.success(editingKey === null ? "Fictional student added." : "Fictional student updated.");
      } else if (editor === "teacher") {
        const identifier = form.identifier.trim();
        if (!identifier) {
          setFormError("Enter a profile identifier (not a login account).");
          return;
        }
        if (settings.teachers.some((teacher) =>
          teacher.identifier.toLowerCase() === identifier.toLowerCase() && teacher.id !== editingKey,
        )) {
          setFormError("That teacher profile identifier already exists.");
          return;
        }
        const teacher: AdminDemoTeacher = {
          id: typeof editingKey === "string" ? editingKey : `demo-teacher-${Date.now()}`,
          name,
          identifier,
          classes: form.classes.split(",").map((item) => item.trim()).filter(Boolean),
          subjects: form.subjects.split(",").map((item) => item.trim()).filter(Boolean),
        };
        const next = {
          ...settings,
          teachers: editingKey === null
            ? [...settings.teachers, teacher]
            : settings.teachers.map((item) => item.id === editingKey ? teacher : item),
        };
        persistSettings(next);
        toast.success(editingKey === null ? "Fictional teacher profile added." : "Fictional teacher profile updated.");
      } else if (editor === "class") {
        const nextClass: AdminDemoClass = { level: form.level, stream: form.stream };
        const classLevel = LEVELS.find((level) => level === nextClass.level);
        const classStream = STREAMS.find((stream) => stream === nextClass.stream);
        if (!classLevel || !classStream) {
          setFormError("Choose a supported grade level and section.");
          return;
        }
        const nextName = classLabel(nextClass);
        if (classes.some((item) => classLabel(item) === nextName && classLabel(item) !== editingKey)) {
          setFormError("That class already exists.");
          return;
        }
        const nextStudents = editingKey === null ? students : students.map((student) =>
          classLabel(student) === editingKey
            ? { ...student, level: classLevel, stream: classStream }
            : student,
        );
        const nextClasses = editingKey === null
          ? [...classes, nextClass]
          : classes.map((item) => classLabel(item) === editingKey ? nextClass : item);
        const oldName = typeof editingKey === "string" ? editingKey : null;
        const nextTeachers = oldName
          ? settings.teachers.map((teacher) => ({
            ...teacher,
            classes: teacher.classes.map((assigned) => assigned === oldName ? nextName : assigned),
          }))
          : settings.teachers;
        if (nextStudents !== students) saveStudent(nextStudents);
        persistSettings({ ...settings, classes: nextClasses, teachers: nextTeachers });
        toast.success(editingKey === null ? "Fictional class added." : "Class updated and student assignments moved.");
      } else if (editor === "subject") {
        const oldName = typeof editingKey === "string" ? editingKey : null;
        const isCoreSubject = (SUBJECTS as readonly string[]).includes(oldName ?? "");
        if (settings.subjects.some((subject) =>
          subject.name.toLowerCase() === name.toLowerCase() && subject.name !== oldName,
        )) {
          setFormError("That subject already exists.");
          return;
        }
        if (isCoreSubject && name !== oldName) {
          setFormError("Core assessment subjects cannot be renamed because the teacher grade-entry model uses fixed subject fields.");
          return;
        }
        const nextSubject: AdminDemoSubject = { name, description: form.description.trim() };
        const nextSubjects = oldName
          ? settings.subjects.map((subject) => subject.name === oldName ? nextSubject : subject)
          : [...settings.subjects, nextSubject];
        persistSettings({ ...settings, subjects: nextSubjects });
        toast.success(oldName ? "Subject details updated." : "Fictional subject added to the catalog.");
      }
      setEditor(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not save this fictional record.";
      setFormError(message);
      toast.error(message);
    }
  };
  const deleteStudent = (student: Student) => {
    if (!window.confirm(`Remove fictional student ${student.name} (${student.id}) and their linked fictional assessments?`)) return;
    try {
      const nextStudents = students.filter((item) => item.id !== student.id);
      const nextAssessments = assessments.filter((assessment) => assessment.studentId !== student.id);
      saveDemoRosterAndAssessments(nextStudents, nextAssessments);
      setStudents(nextStudents);
      setAssessments(nextAssessments);
      setSelectedStudentId(null);
      toast.success("Fictional student and linked assessments removed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove this fictional student.");
    }
  };
  const deleteTeacher = (teacher: AdminDemoTeacher) => {
    if (!window.confirm(`Remove fictional teacher profile "${teacher.name}"? This does not affect a login account.`)) return;
    try {
      persistSettings({ ...settings, teachers: settings.teachers.filter((item) => item.id !== teacher.id) });
      toast.success("Fictional teacher profile removed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove this profile.");
    }
  };
  const assignStudentToClass = () => {
    const studentId = Number(assignStudentId);
    const schoolClass = classes.find((item) => classLabel(item) === assignClass);
    if (!studentId || !schoolClass) return;
    const level = LEVELS.find((item) => item === schoolClass.level);
    const stream = STREAMS.find((item) => item === schoolClass.stream);
    if (!level || !stream) {
      toast.error("The selected class contains an unsupported grade or section.");
      return;
    }
    try {
      saveStudent(students.map((student) => student.id === studentId
        ? { ...student, level, stream }
        : student));
      toast.success("Student assigned to the selected fictional class.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the class assignment.");
    }
  };
  const assessmentOriginCount = (origin: "sample" | "teacher-entry") =>
    assessments.filter((assessment) => assessment.origin === origin).length;
  const printReport = () => window.print();
  const customSubject = (name: string) => !(SUBJECTS as readonly string[]).includes(name);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">School administrator</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">School Administration &amp; Academic Overview</h1>
          <p className="mt-1 text-sm text-slate-500">A practical oversight workspace using the browser’s fictional demonstration dataset.</p>
        </div>
      </header>
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm font-semibold tracking-wide text-amber-950" role="status">
        DEMO DATA — FICTIONAL RECORDS · Saved in this browser only; not synchronized across devices.
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
        Administrator sign-in is selected from Firebase Authentication role claims. The application has no server-side school-record authorization, so these browser-local demo tools are not a security boundary and must not be used for real student records.
      </div>
      <nav aria-label="Administrator dashboard sections" className="flex gap-2 overflow-x-auto pb-1">
        {sections.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:border-indigo-300 hover:text-indigo-700">{label}</a>
        ))}
      </nav>

      <section id="admin-overview" className="scroll-mt-24 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">School overview</h2>
          <p className="text-sm text-slate-500">Counts and indicators are calculated from current demo roster and assessment records.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Metric icon={Users} label="Total students" value={String(students.length)} sub="Fictional roster" tone="indigo" />
          <Metric icon={GraduationCap} label="Teacher profiles" value={String(settings.teachers.length)} sub="Not login accounts" tone="emerald" />
          <Metric icon={BookOpen} label="Classes" value={String(classes.length)} sub="Grade + section combinations" tone="amber" />
          <Metric icon={BookOpen} label="Subjects" value={String(settings.subjects.length)} sub="Catalog entries" tone="rose" />
          <Metric icon={ClipboardList} label="Assessments recorded" value={String(assessments.length)} sub={`${assessmentOriginCount("sample")} seeded · ${assessmentOriginCount("teacher-entry")} teacher-entered · ${assessments.length - assessmentOriginCount("sample") - assessmentOriginCount("teacher-entry")} legacy/unattributed`} tone="indigo" />
          <Metric icon={AlertTriangle} label="Requiring support" value={String(supportStudents.length)} sub="Recorded average <70 or attendance <85%" tone="rose" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">Academic performance by subject</CardTitle><CardDescription>Student-level averages for subjects with a recorded score.</CardDescription></CardHeader>
            <CardContent className="h-72">
              {subjectAverages.some((item) => item.average > 0) ? <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectAverages} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => [`${value}%`, "Average"]} />
                  <Bar dataKey="average" fill="#4f46e5" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer> : <p className="text-sm text-slate-500">No recorded scores yet.</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Student progress snapshot</CardTitle><CardDescription>Recorded academic average and attendance only.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm"><span>Overall recorded average</span><strong>{overallAverage === null ? "No data" : `${overallAverage}%`}</strong></div>
              <Progress value={overallAverage ?? 0} aria-label="Overall recorded academic average" />
              <div className="flex items-center justify-between text-sm"><span>Mean attendance</span><strong>{attendanceAverage === null ? "No data" : `${attendanceAverage}%`}</strong></div>
              <Progress value={attendanceAverage ?? 0} aria-label="Mean recorded attendance" />
              <p className="text-xs text-slate-500">{scoreValues.length} students have a recorded score; {attendanceStudents.length} have attendance marked as recorded.</p>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader><CardTitle className="text-base">Recent academic activity</CardTitle><CardDescription>Latest assessment dates in the shared fictional dataset; source label is preserved where available.</CardDescription></CardHeader>
          <CardContent>
            {recentAssessments.length ? <ul className="divide-y divide-slate-100">
              {recentAssessments.map((assessment) => {
                const student = students.find((item) => item.id === assessment.studentId);
                return <li key={assessment.id} className="flex flex-col gap-1 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-medium">{assessment.title} · {student?.name ?? `Student ${assessment.studentId}`}</span>
                  <span className="text-slate-500">{assessment.subject} · {assessment.dueDate} · {assessment.origin === "sample" ? "Seeded sample" : assessment.origin === "teacher-entry" ? "Teacher-entered" : "Legacy source untracked"}</span>
                </li>;
              })}
            </ul> : <p className="text-sm text-slate-500">No assessments are available.</p>}
          </CardContent>
        </Card>
      </section>

      <section id="admin-students" className="scroll-mt-24">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><CardTitle className="text-base">Student management</CardTitle><CardDescription>Edits apply to fictional demo roster records and appear in shared demo dashboards.</CardDescription></div>
            <Button onClick={() => openEditor("student")}><Plus className="mr-1.5 h-4 w-4" /> Add demo student</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
              <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><Input aria-label="Search students by name or ID" placeholder="Search name or student ID" value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" /></div>
              <select aria-label="Filter students by class" className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={classFilter} onChange={(event) => setClassFilter(event.target.value)}>
                <option value="all">All classes</option>{classNames.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead><tr className="border-y bg-slate-50 text-xs uppercase text-slate-500">
                  <th className="px-3 py-2 font-medium">Student</th><th className="px-3 py-2 font-medium">Demo ID</th><th className="px-3 py-2 font-medium">Class</th><th className="px-3 py-2 font-medium">Average</th><th className="px-3 py-2 font-medium">Attendance</th><th className="px-3 py-2 font-medium">Actions</th>
                </tr></thead>
                <tbody>{filteredStudents.map((student) => {
                  const average = recordedScore(student);
                  return <tr key={student.id} className="border-b border-slate-100">
                    <td className="px-3 py-3 font-medium">{student.name}</td>
                    <td className="px-3 py-3 text-slate-600">{student.id}</td>
                    <td className="px-3 py-3 text-slate-600">{classLabel(student)}</td>
                    <td className="px-3 py-3">{average === null ? "—" : `${average}%`}</td>
                    <td className="px-3 py-3">{student.attendanceRecorded || student.attendance > 0 ? `${student.attendance}%` : "Not recorded"}</td>
                    <td className="px-3 py-3"><div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => setSelectedStudentId(selectedStudentId === student.id ? null : student.id)} aria-label={`View ${student.name} details`}>View</Button>
                      <Button size="icon" variant="ghost" onClick={() => openEditor("student", student.id)} aria-label={`Edit ${student.name}`}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteStudent(student)} aria-label={`Remove ${student.name}`}><Trash2 className="h-4 w-4 text-rose-600" /></Button>
                    </div></td>
                  </tr>;
                })}</tbody>
              </table>
            </div>
            {filteredStudents.length === 0 && <p className="py-6 text-center text-sm text-slate-500">No students match those filters.</p>}
            {selectedStudent && <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h3 className="font-semibold">{selectedStudent.name} · {classLabel(selectedStudent)}</h3><p className="text-sm text-slate-500">Demo ID {selectedStudent.id} · {recordedScore(selectedStudent) === null ? "No academic score recorded" : `Overall ${recordedScore(selectedStudent)}%`}</p></div>
                <Button variant="outline" size="sm" onClick={() => setSelectedStudentId(null)}>Close details</Button>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">{SUBJECTS.map((subject) => <div key={subject} className="rounded-md bg-white p-3 text-sm"><span className="text-slate-500">{subject}</span><p className="font-semibold">{selectedStudent.recordedSubjects?.includes(subject) || selectedStudent.grades[subject] > 0 ? `${selectedStudent.grades[subject]}%` : "No score"}</p></div>)}</div>
            </div>}
          </CardContent>
        </Card>
      </section>

      <section id="admin-teachers" className="scroll-mt-24">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><CardTitle className="text-base">Teacher profile management</CardTitle><CardDescription>Profile records are separate from Firebase Authentication users.</CardDescription></div>
            <Button onClick={() => openEditor("teacher")}><Plus className="mr-1.5 h-4 w-4" /> Add profile</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">These are descriptive fictional profiles; their assignments do not grant dashboard access. Adding a profile does not create a teacher login. Account provisioning, disabling, and deletion require an authorized server-side process.</p>
            <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><Input aria-label="Search teacher profiles by name or identifier" placeholder="Search name or identifier" value={teacherQuery} onChange={(event) => setTeacherQuery(event.target.value)} className="pl-9" /></div>
            {filteredTeachers.length ? filteredTeachers.map((teacher) => <div key={teacher.id} className="flex flex-col gap-3 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="font-medium">{teacher.name} <Badge variant="outline" className="ml-1">Fictional profile</Badge></p><p className="text-sm text-slate-500">{teacher.identifier}</p><p className="mt-1 text-sm text-slate-600">Classes: {teacher.classes.join(", ") || "None"} · Subjects: {teacher.subjects.join(", ") || "None"}</p></div>
              <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => openEditor("teacher", teacher.id)}>Edit</Button><Button variant="outline" size="sm" onClick={() => deleteTeacher(teacher)}>Remove</Button></div>
            </div>) : <p className="text-sm text-slate-500">{settings.teachers.length ? "No teacher profiles match that search." : "No fictional teacher profiles. Add one to populate this list."}</p>}
          </CardContent>
        </Card>
      </section>

      <section id="admin-classes" className="scroll-mt-24">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><CardTitle className="text-base">Class management</CardTitle><CardDescription>Classes use the shared grade-level and section fields. The demo Teacher account still has its existing fixed class assignment; this catalog does not grant or change teacher access.</CardDescription></div>
            <Button variant="outline" onClick={() => openEditor("class")}><Plus className="mr-1.5 h-4 w-4" /> Add class</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-[1fr_1fr_auto]">
              <div className="grid gap-1"><Label htmlFor="assign-student">Assign demo student</Label><select id="assign-student" className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={assignStudentId} onChange={(event) => setAssignStudentId(event.target.value)}><option value="">Select student</option>{students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}</select></div>
              <div className="grid gap-1"><Label htmlFor="assign-class">To class</Label><select id="assign-class" className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={assignClass} onChange={(event) => setAssignClass(event.target.value)}><option value="">Select class</option>{classNames.map((name) => <option key={name} value={name}>{name}</option>)}</select></div>
              <Button className="self-end" variant="outline" onClick={assignStudentToClass} disabled={!assignStudentId || !assignClass}>Assign student</Button>
            </div>
            {classes.map((schoolClass) => {
              const label = classLabel(schoolClass);
              const count = students.filter((student) => classLabel(student) === label).length;
              return <div key={label} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                <div><p className="font-medium">{label}</p><p className="text-sm text-slate-500">{count} student{count === 1 ? "" : "s"}</p></div>
                <Button variant="outline" size="sm" onClick={() => openEditor("class", label)}>Edit class</Button>
              </div>;
            })}
            {classes.length === 0 && <p className="text-sm text-slate-500">No demo classes have been configured.</p>}
          </CardContent>
        </Card>
      </section>

      <section id="admin-subjects" className="scroll-mt-24">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><CardTitle className="text-base">Subject catalog</CardTitle><CardDescription>Core assessment subjects remain fixed to preserve teacher grade-entry compatibility.</CardDescription></div>
            <Button variant="outline" onClick={() => openEditor("subject")}><Plus className="mr-1.5 h-4 w-4" /> Add catalog subject</Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {settings.subjects.map((subject) => {
              const assignedTeachers = settings.teachers.filter((teacher) => teacher.subjects.includes(subject.name));
              const associatedClasses = [...new Set(assignedTeachers.flatMap((teacher) => teacher.classes))];
              return <div key={subject.name} className="flex flex-col gap-3 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="font-medium">{subject.name} {customSubject(subject.name) ? <Badge variant="outline">Catalog only</Badge> : <Badge variant="secondary">Assessment-enabled</Badge>}</p><p className="text-sm text-slate-500">{subject.description || "No description."}</p><p className="text-xs text-slate-500">Assigned profiles: {assignedTeachers.map((teacher) => teacher.name).join(", ") || "None"} · Classes: {associatedClasses.join(", ") || "None"}</p></div>
              <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => openEditor("subject", subject.name)}>Edit</Button>{customSubject(subject.name) && <Button size="sm" variant="outline" onClick={() => {
                if (!window.confirm(`Remove "${subject.name}" from the fictional subject catalog?`)) return;
                try {
                  persistSettings({ ...settings, subjects: settings.subjects.filter((item) => item.name !== subject.name) });
                  toast.success("Catalog subject removed.");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not remove the subject.");
                }
              }}>Remove</Button>}</div>
            </div>;
            })}
          </CardContent>
        </Card>
      </section>

      <section id="admin-academics" className="scroll-mt-24">
        <Card>
          <CardHeader><CardTitle className="text-base">Academic management</CardTitle><CardDescription>Inspect demo terms, subjects, and assessment records. Grade entry remains with teachers.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-slate-50 p-4"><p className="text-xs uppercase text-slate-500">Academic year</p><p className="mt-1 font-semibold">{[...new Set(assessments.map((item) => item.academicYear))].join(", ") || "No records"}</p></div>
              <div className="rounded-lg bg-slate-50 p-4"><p className="text-xs uppercase text-slate-500">Academic terms</p><p className="mt-1 font-semibold">{[...new Set(assessments.map((item) => item.term))].join(", ") || "No records"}</p></div>
              <div className="rounded-lg bg-slate-50 p-4"><p className="text-xs uppercase text-slate-500">Completed / upcoming</p><p className="mt-1 font-semibold">{assessments.filter((item) => item.status === "completed").length} / {assessments.filter((item) => item.status === "upcoming").length}</p></div>
            </div>
            <p className="text-sm text-slate-600">This assessment list combines seeded sample records, teacher-entered browser records, and older records whose source was not tracked. Individual grades are read-only here.</p>
            <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm">
              <thead><tr className="border-y bg-slate-50 text-xs uppercase text-slate-500"><th className="px-3 py-2">Assessment</th><th className="px-3 py-2">Student</th><th className="px-3 py-2">Subject / term</th><th className="px-3 py-2">Result</th><th className="px-3 py-2">Source</th></tr></thead>
              <tbody>{assessments.slice(0, 20).map((assessment) => <tr key={assessment.id} className="border-b border-slate-100">
                <td className="px-3 py-2">{assessment.title}</td><td className="px-3 py-2">{students.find((student) => student.id === assessment.studentId)?.name ?? "Unlinked demo record"}</td>
                <td className="px-3 py-2">{assessment.subject} · {assessment.term}</td><td className="px-3 py-2">{assessment.score === null ? "Upcoming" : `${Math.round((assessment.score / assessment.maxScore) * 100)}%`}</td>
                <td className="px-3 py-2">{assessment.origin === "sample" ? "Seeded sample" : assessment.origin === "teacher-entry" ? "Teacher-entered" : "Legacy / unknown"}</td>
              </tr>)}</tbody>
            </table></div>
            {assessments.length > 20 && <p className="text-xs text-slate-500">Showing 20 of {assessments.length} assessment records.</p>}
          </CardContent>
        </Card>
      </section>

      <section id="admin-reports" className="demo-progress-report scroll-mt-24">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div><CardTitle className="text-base">Administrator report</CardTitle><CardDescription>Printable summary calculated from the current local demo records.</CardDescription></div>
            <Button className="no-print" variant="outline" onClick={printReport}><FileText className="mr-1.5 h-4 w-4" /> Print report</Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div><p className="text-xs uppercase text-slate-500">Students</p><p className="text-xl font-semibold">{students.length}</p></div>
              <div><p className="text-xs uppercase text-slate-500">Recorded average</p><p className="text-xl font-semibold">{overallAverage === null ? "—" : `${overallAverage}%`}</p></div>
              <div><p className="text-xs uppercase text-slate-500">Attendance average</p><p className="text-xl font-semibold">{attendanceAverage === null ? "No data" : `${attendanceAverage}%`}</p></div>
              <div><p className="text-xs uppercase text-slate-500">Students for support</p><p className="text-xl font-semibold">{supportStudents.length}</p></div>
            </div>
            <div><h3 className="mb-2 font-medium">Class comparison</h3><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-y bg-slate-50"><th className="px-3 py-2">Class</th><th className="px-3 py-2">Students</th><th className="px-3 py-2">Recorded average</th></tr></thead><tbody>{classAverages.map((schoolClass) => <tr key={schoolClass.name} className="border-b"><td className="px-3 py-2">{schoolClass.name}</td><td className="px-3 py-2">{schoolClass.count}</td><td className="px-3 py-2">{schoolClass.average === null ? "No scores" : `${schoolClass.average}%`}</td></tr>)}</tbody></table></div></div>
            <div><h3 className="mb-2 font-medium">Subject performance</h3><div className="flex flex-wrap gap-2">{subjectAverages.map((item) => <Badge key={item.subject} variant="outline">{item.subject}: {item.average ? `${item.average}%` : "No scores"}</Badge>)}</div></div>
            <div><h3 className="mb-2 font-medium">Students who may need academic support</h3>{supportStudents.length ? <ul className="list-inside list-disc text-sm text-slate-700">{supportStudents.map((student) => <li key={student.id}>{student.name} · {classLabel(student)} · {recordedScore(student) === null ? "No score" : `${recordedScore(student)}% average`}{student.attendanceRecorded ? ` · ${student.attendance}% attendance` : ""}</li>)}</ul> : <p className="text-sm text-slate-500">No students meet the current support thresholds.</p>}</div>
            {attendanceAverage === null && <p className="text-sm text-slate-500">No reliable attendance figures are available in the current records.</p>}
            <p className="border-t pt-3 text-xs text-slate-500">Fictional demo report. Print opens the browser print dialog; it does not save a report or create a PDF.</p>
          </CardContent>
        </Card>
      </section>

      <section id="admin-settings" className="scroll-mt-24">
        <Card>
          <CardHeader><CardTitle className="text-base">Settings and implementation limits</CardTitle><CardDescription>Record storage and permissions for this demonstration.</CardDescription></CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <p>Administrator-managed teacher profiles, classes, and subject catalog entries are stored under a demo-only localStorage key. Student roster and assessments use the existing shared demo storage keys.</p>
            <p>Browser storage is device- and browser-specific, is not a security boundary, and does not synchronize. Do not enter real student records.</p>
            <p>Firebase Authentication custom role claims select the administrator interface. No server-side authorization protects these local records; a production school-management system requires trusted server-side role checks and persistence.</p>
            <p>Catalog-only subjects are not available in the current fixed teacher grade-entry model. No attendance register, parent relationship review, or account provisioning feature is connected.</p>
          </CardContent>
        </Card>
      </section>

      <Dialog open={editor !== null} onOpenChange={(open) => { if (!open) { setEditor(null); setFormError(""); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingKey === null ? "Add fictional" : "Edit fictional"} {editor === "student" ? "student" : editor === "teacher" ? "teacher profile" : editor === "class" ? "class" : "subject"}</DialogTitle>
            <DialogDescription>Changes save only to this browser’s fictional demo data.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={submitEditor}>
            {editor === "student" && <div className="grid gap-1.5"><Label htmlFor="admin-student-id">Student ID</Label><Input id="admin-student-id" type="number" min="1" step="1" required readOnly={editingKey !== null} value={form.id} onChange={(event) => setForm({ ...form, id: event.target.value })} /><p className="text-xs text-slate-500">{editingKey === null ? "Use a positive ID unique to the current roster. Historical IDs in separate browser stores are not checked." : "Student IDs stay fixed to preserve assessment and progress-history links."}</p></div>}
            {(editor === "student" || editor === "teacher") && <div className="grid gap-1.5"><Label htmlFor="admin-record-name">{editor === "student" ? "Student name" : "Teacher profile name"}</Label><Input id="admin-record-name" required maxLength={100} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>}
            {editor === "teacher" && <div className="grid gap-1.5"><Label htmlFor="admin-teacher-identifier">Profile identifier</Label><Input id="admin-teacher-identifier" required value={form.identifier} onChange={(event) => setForm({ ...form, identifier: event.target.value })} /><p className="text-xs text-slate-500">Profile identifier only; this does not provision or alter a login.</p></div>}
            {(editor === "student" || editor === "class") && <>
              <div className="grid gap-1.5"><Label htmlFor="admin-grade-level">Grade level</Label><select id="admin-grade-level" className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={form.level} onChange={(event) => { if (isLevel(event.target.value)) setForm({ ...form, level: event.target.value }); }}>{LEVELS.map((level) => <option key={level}>{level}</option>)}</select></div>
              <div className="grid gap-1.5"><Label htmlFor="admin-section">Section</Label><select id="admin-section" className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={form.stream} onChange={(event) => { if (isStream(event.target.value)) setForm({ ...form, stream: event.target.value }); }}>{STREAMS.map((stream) => <option key={stream}>{stream}</option>)}</select></div>
            </>}
            {editor === "teacher" && <>
              <div className="grid gap-1.5"><Label htmlFor="admin-teacher-classes">Assigned demo classes</Label><Input id="admin-teacher-classes" value={form.classes} onChange={(event) => setForm({ ...form, classes: event.target.value })} placeholder="JHS 2 Unique, Basic 5 B" /></div>
              <div className="grid gap-1.5"><Label htmlFor="admin-teacher-subjects">Assigned demo subjects</Label><Input id="admin-teacher-subjects" value={form.subjects} onChange={(event) => setForm({ ...form, subjects: event.target.value })} placeholder="Math, Science" /></div>
            </>}
            {editor === "subject" && <>
              <div className="grid gap-1.5"><Label htmlFor="admin-subject-name">Subject name</Label><Input id="admin-subject-name" required maxLength={80} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} readOnly={editingKey !== null && (SUBJECTS as readonly string[]).includes(String(editingKey))} /></div>
              <div className="grid gap-1.5"><Label htmlFor="admin-subject-description">Description</Label><Textarea id="admin-subject-description" maxLength={300} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></div>
              {editingKey === null && <p className="text-xs text-amber-800">New catalog subjects are not wired into teacher grade entry until its fixed assessment schema is extended.</p>}
            </>}
            {formError && <p role="alert" className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{formError}</p>}
            <DialogFooter><Button type="button" variant="outline" onClick={() => setEditor(null)}>Cancel</Button><Button type="submit">Save demo record</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}


function TeacherWelcome({ name, email, school, students, onContinue }: { name: string; email: string; school: string; students: Student[]; onContinue: () => void }) {
  const entered = students.filter((s) => Object.values(s.grades).some((g) => g > 0) || s.attendance > 0).length;
  const first = name.split(" ")[0] || "Teacher";
  return (
    <div className="mx-auto max-w-2xl py-10">
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-8 text-white">
          <p className="text-sm uppercase tracking-widest text-white/80">Your personal workspace</p>
          <h1 className="mt-2 text-3xl font-bold">Welcome, {first}</h1>
          <p className="mt-2 text-white/90">{school || "GODDY MONTESSORI SCHOOL"} · {email}</p>
        </div>
        <CardContent className="space-y-4 p-6">
          <p className="text-slate-600">
            This is a local teacher demo with a limited sample roster. Changes remain in this browser and are not sent to a school database.
            The displayed class assignment is a preview only; it is not secure authorization.
          </p>
          <div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
            {entered === 0
              ? "You haven't entered any assessments yet. Start by opening Enter Performance."
              : `You have saved assessments for ${entered} student${entered > 1 ? "s" : ""}.`}
          </div>
          <Button className="w-full" onClick={onContinue}>Open my dashboard</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function LoginPage({ role, onBack, onSuccess, onForgotPassword }: { role: LoginRole; onBack: () => void; onSuccess: (firstName: string, profile: Profile) => void; onForgotPassword: () => void }) {
  const demoRole: DemoRole | null = role === "administrator" ? null : role;
  const [demoCredentialsSelected, setDemoCredentialsSelected] = useState(false);
  const theme = ROLE_THEME[role];
  const Icon = theme.icon;
  const [school, setSchool] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    if (!identifier.trim() || !password) {
      setFormError("Enter your email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const [{ auth }, { getIdTokenResult, signInWithEmailAndPassword, signOut }] = await Promise.all([
        import("@/firebase"),
        import("firebase/auth"),
      ]);
      const credential = await signInWithEmailAndPassword(auth, identifier.trim(), password);
      const authenticatedEmail = credential.user.email?.trim().toLowerCase();
      const demoAccount = Object.values(DEMO_ACCOUNTS).find(
        (account) => account.email === authenticatedEmail,
      );
      let authenticatedRole: UserRole;

      if (demoAccount) {
        authenticatedRole = demoAccount.role;
      } else {
        const token = await getIdTokenResult(credential.user);
        const claimedRole: unknown = token.claims.role;
        if (!isUserRole(claimedRole)) {
          await signOut(auth);
          setFormError("This account has no valid role assigned by the school. Contact an administrator.");
          return;
        }
        authenticatedRole = claimedRole;
      }

      if (authenticatedRole !== role) {
        await signOut(auth);
        setFormError(
          `This account is assigned the ${authenticatedRole} role. Sign in through that role's page.`,
        );
        return;
      }

      const profile: Profile = {
        id: credential.user.uid,
        email: credential.user.email ?? identifier.trim(),
        full_name:
          credential.user.displayName?.trim() ||
          demoAccount?.displayName ||
          credential.user.email?.split("@")[0] ||
          "User",
        school_name: school.trim() || "GODDY MONTESSORI SCHOOL",
        role: authenticatedRole,
        student_id: demoAccount?.studentId ?? null,
      };
      onSuccess(profile.full_name.split(" ").at(-1) ?? profile.full_name, profile);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Firebase Authentication sign-in failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`relative min-h-screen ${theme.bg} text-white`}>
      <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_15%_20%,#fff_0,transparent_35%),radial-gradient(circle_at_85%_75%,#fff_0,transparent_35%)]" />
      <button onClick={onBack} className="absolute left-4 top-4 z-10 inline-flex items-center gap-1 text-sm text-white/70 hover:text-white sm:left-6 sm:top-6">
        <ChevronRight className="h-4 w-4 rotate-180" /> Back
      </button>
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-4 py-10 sm:px-6 lg:flex-row lg:gap-12">
        <div className="mb-8 max-w-md text-center lg:mb-0 lg:flex-1 lg:text-left">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20 backdrop-blur">
            <Icon className="h-7 w-7" />
          </div>
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-white/60">{theme.tag}</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Sign in as {theme.name}</h1>
          <p className="mt-3 text-sm text-white/70 sm:text-base">{theme.tagline}</p>
        </div>

        <Card className="w-full max-w-md border-0 shadow-2xl lg:flex-1">
          <CardHeader>
            <CardTitle className="text-xl text-slate-900">{theme.name} Login</CardTitle>
            <CardDescription>
              Sign in with your Firebase Authentication email and password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(event) => void handleSubmit(event)}
            >
              <div className="space-y-4">
                {demoRole && (
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      aria-pressed={demoCredentialsSelected}
                      onClick={() => {
                        const account = DEMO_ACCOUNTS[demoRole];
                        setIdentifier(account.email);
                        setPassword(account.password);
                        setShowPassword(true);
                        setDemoCredentialsSelected(true);
                        setFormError("");
                      }}
                      className="w-full"
                    >
                      {ROLE_THEME[demoRole].name} Demo
                    </Button>
                  </div>
                )}
                <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                  Demo accounts are shared preview credentials. Firebase Authentication is still required to sign in.
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="login-identifier" className="text-slate-700">Email</Label>
                  <Input
                    id="login-identifier"
                    type="email"
                    autoComplete="username"
                    value={identifier}
                    onChange={(event) => {
                      setIdentifier(event.target.value);
                      setDemoCredentialsSelected(false);
                    }}
                    className={theme.ring}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="login-password" className="text-slate-700">Password</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        setDemoCredentialsSelected(false);
                      }}
                      className={`pr-11 ${theme.ring}`}
                      required
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 inline-flex items-center px-3 text-slate-500 hover:text-slate-800"
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="school" className="text-slate-700">Demo school name (optional)</Label>
                  <Input
                    id="school"
                    value={school}
                    onChange={(event) => setSchool(event.target.value)}
                    placeholder="GODDY MONTESSORI SCHOOL"
                    className={theme.ring}
                  />
                </div>
                {formError && (
                  <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">
                    {formError}
                  </p>
                )}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full ${theme.accent} text-white`}
                >
                  {isSubmitting ? "Signing in…" : "Sign In"}
                </Button>
                <p className="text-center text-xs text-slate-500">
                  Demo credentials are public and must only be used for the isolated demonstration.
                </p>
                <button
                  type="button"
                  onClick={onForgotPassword}
                  className="w-full text-center text-xs font-medium text-slate-500 hover:text-slate-700"
                >
                  Forgot password?
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SplashScreen({ onDone }: { onDone: () => void }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFadeOut(true), 2800);
    const t2 = setTimeout(() => onDone(), 3500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-700 ${fadeOut ? "opacity-0" : "opacity-100"}`}
    >
      <img
        src={splashBg}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/80 via-violet-950/70 to-emerald-950/80" />
      <div className="relative z-10 mx-auto max-w-lg px-6 text-center">
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md ring-1 ring-white/20 shadow-2xl">
          <GraduationCap className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          GODDY MONTESSORI SCHOOL
        </h1>
        <p className="mt-3 text-sm font-medium uppercase tracking-[0.2em] text-indigo-200">
          Student Performance Tracker
        </p>
        <div className="mt-8 flex justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="inline-block h-2 w-2 animate-bounce rounded-full bg-white/80"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Landing({ onPick }: { onPick: (r: LoginRole) => void }) {
  const roles: { id: LoginRole; title: string; desc: string; icon: typeof Users; accent: string }[] = [
    { id: "teacher", title: "Teacher", desc: "Manage class performance, attendance & insights.", icon: GraduationCap, accent: "from-indigo-500 to-indigo-600" },
    { id: "student", title: "Student", desc: "Track your grades, attendance and progress.", icon: BookOpen, accent: "from-emerald-500 to-emerald-600" },
    { id: "parent", title: "Parent/Guardian", desc: "Stay informed about your child's journey.", icon: Award, accent: "from-amber-500 to-amber-600" },
    { id: "administrator", title: "School Administrator", desc: "Manage school and academic information.", icon: ShieldCheck, accent: "from-slate-500 to-slate-600" },
  ];
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#1a0f00] via-[#3a1d00] to-[#1a0f00] text-white">
      <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_20%_20%,#F68B1E_0,transparent_45%),radial-gradient(circle_at_80%_70%,#ff6b00_0,transparent_45%)]" />
      <div className="absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#F68B1E]/30 bg-[#F68B1E]/10 px-4 py-1.5 text-xs font-medium backdrop-blur animate-magical-rise">
            Student Performance Tracker
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl animate-magical-rise" style={{ animationDelay: "120ms" }}>
            <span className="text-magical">GODDY MONTESSORI SCHOOL</span>
          </h1>
          <p className="mt-4 text-base text-amber-100/80 sm:text-lg animate-magical-rise" style={{ animationDelay: "260ms" }}>
            Preview grades, attendance, and teacher-entered insights using local demo data.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {roles.map((r, i) => (
            <button
              key={r.id}
              onClick={() => onPick(r.id)}
              style={{ animationDelay: `${400 + i * 120}ms` }}
              className="group relative overflow-hidden rounded-2xl border border-[#F68B1E]/20 bg-white/5 p-6 text-left backdrop-blur transition hover:-translate-y-1 hover:border-[#F68B1E]/60 hover:bg-[#F68B1E]/10 hover:shadow-[0_20px_50px_-15px_rgba(246,139,30,0.5)] animate-magical-rise"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#F68B1E] to-[#ff6b00] shadow-lg shadow-[#F68B1E]/30">
                <r.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold">{r.title}</h3>
              <p className="mt-1 text-sm text-amber-100/70">{r.desc}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[#F68B1E] group-hover:text-amber-200">
                <LogIn className="h-4 w-4" /> Continue
                <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function NavBar({
  role,
  onSignOut,
  students,
  onSelectStudent,
  onNotificationClick,
  onOpenSettings,
  unread,
}: {
  role: Role;
  onSignOut: () => void;
  students: Student[];
  onSelectStudent: (id: number) => void;
  onNotificationClick: () => void;
  onOpenSettings: (tab: SettingsTab) => void;
  unread: number;
}) {

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-md shadow-indigo-500/30">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-tight">GODDY MONTESSORI SCHOOL</p>
            <p className="hidden text-xs text-slate-500 sm:block">Performance tracker</p>
          </div>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">
            {ROLE_THEME[role].name}
          </Badge>

          {role === "teacher" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                  <Users className="h-4 w-4" /> Students
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Class roster</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {students.map((s) => (
                  <DropdownMenuItem key={s.id} onClick={() => { onSelectStudent(s.id); toast.success(`Viewing ${s.name}`); }}>
                    <span className="truncate">{s.name}</span>
                    <span className="ml-auto text-xs text-slate-400">{classLabel(s)}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700 sm:hidden">
            {ROLE_THEME[role].name}
          </Badge>
          {role === "teacher" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-indigo-600 hover:bg-slate-50 sm:hidden" aria-label="Students">
                  <Users className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Class roster</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {students.map((s) => (
                  <DropdownMenuItem key={s.id} onClick={() => { onSelectStudent(s.id); toast.success(`Viewing ${s.name}`); }}>
                    <span className="truncate">{s.name}</span>
                    <span className="ml-auto text-xs text-slate-400">{classLabel(s)}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50" aria-label="Settings">
                <Settings className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onOpenSettings("profile")}>
                <span>Profile Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOpenSettings("security")}>
                <span>Change Password</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOpenSettings("notifications")}>
                <span>Notification Preferences</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOpenSettings("privacy")}>
                <span>Account Privacy</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onOpenSettings("about")}>
                <span>Help &amp; Support</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onOpenSettings("about")}>
                <span>About</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSignOut} className="text-red-600">
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {role !== "parent" && (
            <button onClick={onNotificationClick} className="relative grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50" aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}>
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>
          )}

        </div>
      </div>
    </header>
  );
}


function Metric({ icon: Icon, label, value, sub, tone }: { icon: typeof Users; label: string; value: string; sub?: string; tone: "indigo" | "emerald" | "amber" | "rose" }) {
  const tones = {
    indigo: "from-indigo-500 to-indigo-600 text-indigo-600 bg-indigo-50",
    emerald: "from-emerald-500 to-emerald-600 text-emerald-600 bg-emerald-50",
    amber: "from-amber-500 to-amber-600 text-amber-600 bg-amber-50",
    rose: "from-rose-500 to-rose-600 text-rose-600 bg-rose-50",
  }[tone].split(" ");
  return (
    <Card className="overflow-hidden border-slate-200/70 shadow-sm transition hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
            {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
          </div>
          <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${tones[0]} ${tones[1]} text-white shadow-md`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function teacherHasRecords(student: Student, subjects: Subject[]) {
  return (
    student.attendanceRecorded === true ||
    (Array.isArray(student.recordedSubjects) && student.recordedSubjects.some((subject) => subjects.includes(subject))) ||
    student.attendance > 0 ||
    subjects.some(
      (subject) =>
        student.grades[subject] > 0 ||
        student.participation[subject] > 0 ||
        student.remarks[subject].trim().length > 0,
    )
  );
}

function teacherAverage(student: Student, subjects: Subject[]) {
  const scores = subjects
    .filter((subject) =>
      (Array.isArray(student.recordedSubjects) && student.recordedSubjects.includes(subject)) ||
      student.grades[subject] > 0,
    )
    .map((subject) => student.grades[subject]);
  return scores.length
    ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
    : null;
}

function teacherAttendanceIsRecorded(student: Student) {
  return student.attendanceRecorded === true || student.attendance > 0;
}

function teacherStatus(student: Student, subjects: Subject[]) {
  if (!teacherHasRecords(student, subjects)) return "no-record" as const;
  const average = teacherAverage(student, subjects);
  if ((average !== null && average < 70) || (teacherAttendanceIsRecorded(student) && student.attendance < 85)) {
    return "at-risk" as const;
  }
  if (average !== null && average >= 85) return "excelling" as const;
  return "average" as const;
}

function TeacherDashboard({ userName, students, setStudents, academicYear, setAcademicYear, term, setTerm, subjects, demoAssessments, onDemoAssessmentsChange, isDemoTeacher }: { userName: string; students: Student[]; setStudents: React.Dispatch<React.SetStateAction<Student[]>>; academicYear: AcademicYear; setAcademicYear: (y: AcademicYear) => void; term: Term; setTerm: (t: Term) => void; subjects: Subject[]; demoAssessments: DemoAssessment[]; onDemoAssessmentsChange: (assessments: DemoAssessment[]) => void; isDemoTeacher: boolean }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "excelling" | "average" | "at-risk" | "no-record">("all");
  const [classFilter, setClassFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState<Subject | "all">("all");
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [entryOpen, setEntryOpen] = useState(false);
  const [view, setView] = useState<"overview" | "entry">("overview");

  const classes = useMemo(() => [...new Set(students.map(classLabel))], [students]);
  const visibleStudents = useMemo(
    () => classFilter === "all" ? students : students.filter((student) => classLabel(student) === classFilter),
    [classFilter, students],
  );
  const selectedSubjects = useMemo(
    () => subjectFilter === "all" ? subjects : subjects.filter((subject) => subject === subjectFilter),
    [subjectFilter, subjects],
  );
  const recordedStudents = visibleStudents.filter((student) => teacherHasRecords(student, subjects));
  const scoredValues = visibleStudents.flatMap((student) =>
    subjects
      .filter((subject) =>
        (Array.isArray(student.recordedSubjects) && student.recordedSubjects.includes(subject)) ||
        student.grades[subject] > 0,
      )
      .map((subject) => student.grades[subject]),
  );
  const attendanceValues = visibleStudents
    .filter(teacherAttendanceIsRecorded)
    .map((student) => student.attendance);

  const average = scoredValues.length
    ? Math.round(scoredValues.reduce((sum, score) => sum + score, 0) / scoredValues.length)
    : null;
  const attendanceAverage = attendanceValues.length
    ? Math.round(attendanceValues.reduce((sum, value) => sum + value, 0) / attendanceValues.length)
    : null;
  const stats = {
    total: visibleStudents.length,
    average,
    attendance: attendanceAverage,
    risk: visibleStudents.filter((student) => teacherStatus(student, subjects) === "at-risk").length,
    recorded: recordedStudents.length,
  };

  const subjectAvg = useMemo(
    () =>
      selectedSubjects.map((sub) => {
        const scores = visibleStudents
          .filter((student) =>
            (Array.isArray(student.recordedSubjects) && student.recordedSubjects.includes(sub)) ||
            student.grades[sub] > 0,
          )
          .map((student) => student.grades[sub]);
        return {
          subject: sub,
          average: scores.length
            ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
            : null,
        };
      }),
    [selectedSubjects, visibleStudents],
  );

  const filtered = useMemo(() => {
    return visibleStudents.filter((s) => {
      const matchQ = s.name.toLowerCase().includes(query.toLowerCase());
      const matchF = statusFilter === "all" || teacherStatus(s, subjects) === statusFilter;
      return matchQ && matchF;
    });
  }, [query, statusFilter, subjects, visibleStudents]);

  const selectedStudent = visibleStudents.find((student) => student.id === selectedStudentId);
  const studentsNeedingSupport = visibleStudents.filter((student) => teacherStatus(student, subjects) === "at-risk");

  if (view === "entry") {
    if (students.length === 0) {
      return (
        <Card>
          <CardContent className="space-y-4 p-6">
            <p className="text-sm text-slate-600">No students are assigned to this demo workspace.</p>
            <Button variant="outline" onClick={() => setView("overview")}>Back to dashboard</Button>
          </CardContent>
        </Card>
      );
    }
    return (
      <PerformanceEntryPage
        students={students}
        setStudents={setStudents}
        subjects={subjects}
        onBack={() => setView("overview")}
      />
    );
  }



  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Teacher Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Welcome back, {userName} — <span className="font-medium text-slate-700">{term}, {academicYear}</span>.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setView("entry")} disabled={students.length === 0} className="bg-indigo-600 hover:bg-indigo-700">
            <ClipboardList className="mr-1.5 h-4 w-4" /> Enter Performance
          </Button>
          <Button onClick={() => setEntryOpen(true)} variant="outline" disabled={students.length === 0}>
            <CheckSquare className="mr-1.5 h-4 w-4" /> Quick Entry
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        DEMO DATA — FICTIONAL RECORDS. This 25-student roster and assessment history are stored in a separate browser-local demo workspace. Teacher edits are shared with the matching Student and Parent demo views in this browser and other tabs on this origin only; no school database is updated.
      </div>
      {students.length === 0 && (
        <Card><CardContent className="p-6 text-sm text-slate-600">No class or student assignments are configured for this demo profile.</CardContent></Card>
      )}

      <Card className="border-slate-200/70 shadow-sm">
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Academic Session</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{term} · {academicYear}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={academicYear} onValueChange={(v) => setAcademicYear(v as AcademicYear)}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ACADEMIC_YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
              </SelectContent>
            </Select>
            <Tabs value={term} onValueChange={(v) => setTerm(v as Term)}>
              <TabsList className="bg-slate-100">
                {TERMS.map((t) => <TabsTrigger key={t} value={t}>{t}</TabsTrigger>)}
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Assessment history</CardTitle>
          <CardDescription>Fictional assignments, quizzes, tests, and examinations across all three terms.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          {(["assignment", "quiz", "test", "examination"] as const).map((kind) => {
            const count = demoAssessments.filter((assessment) => assessment.kind === kind && assessment.status === "completed").length;
            const label = kind === "quiz" ? "quizzes" : kind === "examination" ? "examinations" : `${kind}s`;
            return <div key={kind} className="rounded-lg bg-slate-50 p-4"><p className="text-xs uppercase tracking-wide text-slate-500">{label} recorded</p><p className="mt-1 text-2xl font-bold text-slate-900">{count}</p></div>;
          })}
          <div className="rounded-lg bg-indigo-50 p-4"><p className="text-xs uppercase tracking-wide text-indigo-700">Upcoming assignments</p><p className="mt-1 text-2xl font-bold text-indigo-950">{demoAssessments.filter((assessment) => assessment.status === "upcoming").length}</p></div>
        </CardContent>
      </Card>

      {isDemoTeacher && (
        <DemoAssessmentManager
          students={students}
          subjects={subjects}
          assessments={demoAssessments}
          term={term}
          academicYear={academicYear}
          onAssessmentsChange={onDemoAssessmentsChange}
        />
      )}

      <section aria-labelledby="assigned-classes-heading" className="space-y-3">
        <div>
          <h2 id="assigned-classes-heading" className="text-lg font-semibold text-slate-900">Assigned classes</h2>
          <p className="text-sm text-slate-500">Choose a class to focus the roster and summaries.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <button
            type="button"
            onClick={() => setClassFilter("all")}
            aria-pressed={classFilter === "all"}
            className={`rounded-xl border bg-white p-4 text-left shadow-sm transition hover:border-indigo-300 ${classFilter === "all" ? "border-indigo-500 ring-2 ring-indigo-100" : "border-slate-200"}`}
          >
            <span className="text-sm font-semibold text-slate-900">All assigned classes</span>
            <span className="mt-2 block text-2xl font-bold text-indigo-700">{students.length}</span>
            <span className="text-xs text-slate-500">fictional demo students</span>
          </button>
          {classes.map((className) => {
            const classStudents = students.filter((student) => classLabel(student) === className);
            return (
              <button
                type="button"
                key={className}
                onClick={() => setClassFilter(className)}
                aria-pressed={classFilter === className}
                className={`rounded-xl border bg-white p-4 text-left shadow-sm transition hover:border-indigo-300 ${classFilter === className ? "border-indigo-500 ring-2 ring-indigo-100" : "border-slate-200"}`}
              >
                <span className="text-sm font-semibold text-slate-900">{className}</span>
                <span className="mt-2 block text-2xl font-bold text-indigo-700">{classStudents.length}</span>
                <span className="text-xs text-slate-500">assigned students</span>
              </button>
            );
          })}
        </div>
      </section>

      <Card className="border-slate-200/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Assigned subjects</CardTitle>
          <CardDescription>Choose a subject to focus student records. Editing is limited to the subjects listed here in this demo.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button size="sm" variant={subjectFilter === "all" ? "default" : "outline"} onClick={() => setSubjectFilter("all")}>All subjects</Button>
          {subjects.map((subject) => (
            <Button key={subject} size="sm" variant={subjectFilter === subject ? "default" : "outline"} onClick={() => setSubjectFilter(subject)}>
              <BookOpen className="mr-1.5 h-4 w-4" /> {subject}
            </Button>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric icon={Users} label="Assigned Students" value={String(stats.total)} sub="In selected classes" tone="indigo" />
        <Metric icon={TrendingUp} label="Recorded Grade Average" value={stats.average === null ? "—" : `${stats.average}%`} sub="Entered scores only" tone="emerald" />
        <Metric icon={CalendarCheck} label="Attendance Average" value={stats.attendance === null ? "—" : `${stats.attendance}%`} sub="Entered attendance only" tone="amber" />
        <Metric icon={AlertTriangle} label="Need Support" value={String(stats.risk)} sub="Based on available records" tone="rose" />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="border-slate-200/70 shadow-sm lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Class performance summary</CardTitle>
            <CardDescription>Average entered score by assigned subject. These are single local demo marks, not dated assessment events; blank scores are excluded.</CardDescription>
          </CardHeader>
          <CardContent className="h-72 pl-0">
            {subjectAvg.some((item) => item.average !== null) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectAvg.filter((item) => item.average !== null)} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="subject" stroke="#64748b" fontSize={12} />
                  <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Bar dataKey="average" name="Average score" radius={[8, 8, 0, 0]} fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center px-6 text-center text-sm text-slate-500">No scores have been entered for this class and term yet.</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200/70 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Students needing support</CardTitle>
            <CardDescription>Flagged only when an entered grade is below 70% or attendance is below 85%.</CardDescription>
          </CardHeader>
          <CardContent className="max-h-72 space-y-2 overflow-y-auto">
            {studentsNeedingSupport.length ? studentsNeedingSupport.map((student) => (
              <button key={student.id} type="button" onClick={() => setSelectedStudentId(student.id)} className="flex w-full items-center justify-between rounded-lg border border-rose-100 p-3 text-left hover:bg-rose-50">
                <span>
                  <span className="block text-sm font-medium text-slate-900">{student.name}</span>
                  <span className="text-xs text-slate-500">{classLabel(student)}</span>
                </span>
                <span className="text-xs font-medium text-rose-700">
                  {teacherAttendanceIsRecorded(student) && student.attendance < 85 ? `Attendance ${student.attendance}%` : `Average ${teacherAverage(student, subjects)}%`}
                </span>
              </button>
            )) : (
              <p className="py-10 text-center text-sm text-slate-500">{recordedStudents.length ? "No students are currently flagged from the available records." : "No recorded results yet; sample zeros are not counted as risk indicators."}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200/70 shadow-sm">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Student Roster</CardTitle>
            <CardDescription>{filtered.length} of {visibleStudents.length} students · fictional demo roster</CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search assigned students" className="pl-8 sm:w-56" />
            </div>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger className="sm:w-44"><SelectValue placeholder="Class" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All assigned classes</SelectItem>
                {classes.map((className) => <SelectItem key={className} value={className}>{className}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="sm:w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="excelling">Excelling</SelectItem>
                <SelectItem value="average">Average</SelectItem>
                <SelectItem value="at-risk">At-Risk</SelectItem>
                <SelectItem value="no-record">No records</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="-mx-6 overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-y border-slate-100 bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3 font-medium">Student</th>
                  <th className="px-3 py-3 font-medium">Class</th>
                  <th className="px-3 py-3 font-medium">Overall</th>
                  <th className="px-3 py-3 font-medium">Attendance</th>
                  <th className="px-3 py-3 font-medium">Records</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const g = teacherAverage(s, subjects);
                  const st = teacherStatus(s, subjects);
                  return (
                    <tr key={s.id} onClick={() => setSelectedStudentId(s.id)} className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 text-xs font-bold text-indigo-700">
                            {s.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                          </div>
                          <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedStudentId(s.id); }} className="text-left font-medium text-indigo-700 hover:underline">{s.name}</button>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{classLabel(s)}</td>
                      <td className="px-3 py-3">{g === null ? "—" : <><span className="font-semibold text-slate-900">{g}%</span><span className="ml-1.5 text-xs text-slate-400">({letter(g)})</span></>}</td>
                      <td className="px-3 py-3">
                        {teacherAttendanceIsRecorded(s) ? <div className="flex items-center gap-2"><Progress value={s.attendance} className="h-1.5 w-20" /><span className="text-xs text-slate-600">{s.attendance}%</span></div> : "—"}
                      </td>
                      <td className="px-3 py-3 text-slate-600">{teacherHasRecords(s, subjects) ? "Available" : "Not entered"}</td>
                      <td className="px-6 py-3"><StatusBadge status={st} /></td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">No students match this class, search, or status.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {selectedStudent && (
        <Card className="border-indigo-100 shadow-sm">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-base">{selectedStudent.name}</CardTitle>
              <CardDescription>{classLabel(selectedStudent)} · fictional local demo record</CardDescription>
            </div>
            <Button size="sm" onClick={() => { setEntryOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700">
              <ClipboardList className="mr-1.5 h-4 w-4" /> Edit records
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="font-medium text-slate-700">Attendance:</span>
              <span>{teacherAttendanceIsRecorded(selectedStudent) ? `${selectedStudent.attendance}%` : "Not entered"}</span>
              <StatusBadge status={teacherStatus(selectedStudent, subjects)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {selectedSubjects.map((subject) => (
                <div key={subject} className="rounded-lg border border-slate-200 p-3">
                  <p className="text-sm font-semibold text-slate-900">{subject}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Grade: {(Array.isArray(selectedStudent.recordedSubjects) && selectedStudent.recordedSubjects.includes(subject)) || selectedStudent.grades[subject] > 0 ? `${selectedStudent.grades[subject]}%` : "Not entered"}
                    {" · "}Participation: {(Array.isArray(selectedStudent.recordedSubjects) && selectedStudent.recordedSubjects.includes(subject)) || selectedStudent.participation[subject] > 0 ? `${selectedStudent.participation[subject]}/10` : "Not entered"}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">{selectedStudent.remarks[subject] || "No teacher feedback yet."}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {subjects.filter((subject) => !selectedSubjects.includes(subject)).map((subject) => (
                <Button key={subject} size="sm" variant="outline" onClick={() => setSubjectFilter(subject)}>View {subject}</Button>
              ))}
              {subjectFilter !== "all" && <Button size="sm" variant="ghost" onClick={() => setSubjectFilter("all")}>Show all assigned subjects</Button>}
            </div>
          </CardContent>
        </Card>
      )}

      <PerformanceEntryDialog
        open={entryOpen}
        onOpenChange={setEntryOpen}
        students={visibleStudents}
        setStudents={setStudents}
        subjects={subjects}
        initialStudentId={selectedStudentId}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: "excelling" | "average" | "at-risk" | "no-record" }) {
  if (status === "excelling") return <Badge className="border-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Excelling</Badge>;
  if (status === "average") return <Badge className="border-0 bg-amber-100 text-amber-700 hover:bg-amber-100">Average</Badge>;
  if (status === "at-risk") return <Badge className="border-0 bg-rose-100 text-rose-700 hover:bg-rose-100">At-Risk</Badge>;
  return <Badge variant="outline" className="text-slate-500">No records</Badge>;
}

const DEMO_ASSESSMENT_KINDS: DemoAssessmentKind[] = ["assignment", "quiz", "test", "examination"];

function localDateInputValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function DemoAssessmentManager({
  students,
  subjects,
  assessments,
  term,
  academicYear,
  onAssessmentsChange,
}: {
  students: Student[];
  subjects: Subject[];
  assessments: DemoAssessment[];
  term: Term;
  academicYear: AcademicYear;
  onAssessmentsChange: (assessments: DemoAssessment[]) => void;
}) {
  const [studentId, setStudentId] = useState(String(students[0]?.id ?? DEMO_STUDENT_ID));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState<Subject>(subjects[0] ?? "Math");
  const [kind, setKind] = useState<DemoAssessmentKind>("assignment");
  const [date, setDate] = useState(localDateInputValue);
  const [maxScore, setMaxScore] = useState("100");
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [formError, setFormError] = useState("");
  const [formMessage, setFormMessage] = useState("");

  const selectedStudent = students.find((student) => String(student.id) === studentId);
  const studentAssessments = assessments
    .filter((assessment) => assessment.studentId === Number(studentId))
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate) || a.title.localeCompare(b.title));

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setSubject(subjects[0] ?? "Math");
    setKind("assignment");
    setDate(localDateInputValue());
    setMaxScore("100");
    setScore("");
    setFeedback("");
    setFormError("");
  };

  const editAssessment = (assessment: DemoAssessment) => {
    setStudentId(String(assessment.studentId));
    setEditingId(assessment.id);
    setTitle(assessment.title);
    setSubject(assessment.subject as Subject);
    setKind(assessment.kind);
    setDate(assessment.dueDate);
    setMaxScore(String(assessment.maxScore));
    setScore(assessment.score === null ? "" : String(assessment.score));
    setFeedback(assessment.feedback);
    setFormError("");
    setFormMessage("");
  };

  const saveAssessment = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setFormMessage("");

    const trimmedTitle = title.trim();
    const parsedMaxScore = Number(maxScore);
    const parsedScore = Number(score);
    const existing = editingId ? assessments.find((assessment) => assessment.id === editingId) : undefined;
    if (!selectedStudent) return setFormError("Select a student from the fictional demo roster.");
    if (editingId && !existing) return setFormError("This assessment changed in another tab. Reload the demo records before editing it.");
    if (!trimmedTitle) return setFormError("Enter an assessment title.");
    if (trimmedTitle.length > 120) return setFormError("Assessment titles must be 120 characters or fewer.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(`${date}T00:00:00`).getTime())) return setFormError("Enter a valid assessment date.");
    if (!subjects.includes(subject)) return setFormError("Select a subject assigned to the demo teacher.");
    if (!DEMO_ASSESSMENT_KINDS.includes(kind)) return setFormError("Select a valid assessment type.");
    if (!maxScore.trim() || !Number.isFinite(parsedMaxScore) || parsedMaxScore <= 0) return setFormError("Maximum score must be greater than zero.");
    if (!score.trim() || !Number.isFinite(parsedScore) || parsedScore < 0) return setFormError("Enter a valid score of zero or greater.");
    if (parsedScore > parsedMaxScore) return setFormError("Student score cannot be greater than the maximum score.");
    if (feedback.length > 500) return setFormError("Teacher feedback must be 500 characters or fewer.");

    const targetTerm = existing?.term ?? term;
    const targetAcademicYear = existing?.academicYear ?? academicYear;
    const duplicate = assessments.some((assessment) =>
      assessment.id !== editingId &&
      assessment.studentId === selectedStudent.id &&
      assessment.subject === subject &&
      assessment.kind === kind &&
      assessment.term === targetTerm &&
      assessment.academicYear === targetAcademicYear &&
      assessment.dueDate === date &&
      assessment.title.trim().toLocaleLowerCase() === trimmedTitle.toLocaleLowerCase(),
    );
    if (duplicate) return setFormError("An assessment with this student, subject, type, title, and date already exists.");

    const assessment: DemoAssessment = {
      id: existing?.id ?? `demo-assessment-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      studentId: selectedStudent.id,
      subject,
      term: targetTerm,
      academicYear: targetAcademicYear,
      kind,
      title: trimmedTitle,
      score: parsedScore,
      maxScore: parsedMaxScore,
      dueDate: date,
      feedback: feedback.trim(),
      status: "completed",
      origin: "teacher-entry",
    };
    const next = existing
      ? assessments.map((item) => item.id === existing.id ? assessment : item)
      : [...assessments, assessment];

    try {
      onAssessmentsChange(next);
      setFormMessage(`${existing ? "Updated" : "Saved"} assessment for ${selectedStudent.name}.`);
      toast.success(`${existing ? "Assessment updated" : "Assessment saved"} for ${selectedStudent.name}.`);
      resetForm();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not save the assessment in this browser.");
      toast.error("Assessment could not be saved.");
    }
  };

  const deleteAssessment = (assessment: DemoAssessment) => {
    const confirmed = window.confirm(
      `Delete "${assessment.title}" for ${selectedStudent?.name ?? "this student"}? This cannot be undone.`,
    );
    if (!confirmed) return;
    try {
      onAssessmentsChange(assessments.filter((item) => item.id !== assessment.id));
      if (editingId === assessment.id) resetForm();
      setFormMessage(`Deleted "${assessment.title}".`);
      toast.success("Demo assessment deleted.");
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not delete the assessment from this browser.");
      toast.error("Assessment could not be deleted.");
    }
  };

  return (
    <Card className="border-indigo-100 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardList className="h-4 w-4 text-indigo-600" /> Demo assessment workflow
        </CardTitle>
        <CardDescription>
          Add, edit, and remove fictional assessment records. Changes are saved only in this browser and are not sent to Firebase.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={saveAssessment} className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold text-slate-900">{editingId ? "Edit assessment" : "Add assessment"}</h3>
            <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">
              {editingId
                ? `${assessments.find((assessment) => assessment.id === editingId)?.term ?? term} · ${assessments.find((assessment) => assessment.id === editingId)?.academicYear ?? academicYear}`
                : `${term} · ${academicYear}`}
            </Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="grid gap-1.5">
              <Label htmlFor="demo-assessment-student">Student</Label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger id="demo-assessment-student"><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={String(student.id)}>{student.name} · ID {student.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="demo-assessment-subject">Subject</Label>
              <Select value={subject} onValueChange={(value) => setSubject(value as Subject)}>
                <SelectTrigger id="demo-assessment-subject"><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>{subjects.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="demo-assessment-kind">Assessment type</Label>
              <Select value={kind} onValueChange={(value) => setKind(value as DemoAssessmentKind)}>
                <SelectTrigger id="demo-assessment-kind"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {DEMO_ASSESSMENT_KINDS.map((item) => (
                    <SelectItem key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="demo-assessment-title">Assessment title</Label>
              <Input id="demo-assessment-title" required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Fractions practice" />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="demo-assessment-date">Assessment date</Label>
              <Input id="demo-assessment-date" type="date" required value={date} onChange={(event) => setDate(event.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="demo-assessment-max-score">Maximum score</Label>
                <Input id="demo-assessment-max-score" type="number" min="0.01" step="any" required value={maxScore} onChange={(event) => setMaxScore(event.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="demo-assessment-score">Student score</Label>
                <Input id="demo-assessment-score" type="number" min="0" step="any" required value={score} onChange={(event) => setScore(event.target.value)} />
              </div>
            </div>
            <div className="grid gap-1.5 sm:col-span-2 lg:col-span-3">
              <Label htmlFor="demo-assessment-feedback">Teacher feedback <span className="font-normal text-slate-500">(optional)</span></Label>
              <Textarea id="demo-assessment-feedback" maxLength={500} rows={3} value={feedback} onChange={(event) => setFeedback(event.target.value)} placeholder="Share specific feedback or a next step." />
              <p className="text-right text-xs text-slate-500">{feedback.length}/500</p>
            </div>
          </div>
          {formError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{formError}</p>}
          {formMessage && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{formMessage}</p>}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="mr-1.5 h-4 w-4" /> {editingId ? "Save assessment changes" : "Save assessment"}
            </Button>
            {editingId && <Button type="button" variant="outline" onClick={resetForm}><X className="mr-1.5 h-4 w-4" /> Cancel edit</Button>}
          </div>
        </form>

        <div className="space-y-3">
          <div className="grid gap-1.5 sm:max-w-sm">
            <Label htmlFor="demo-assessment-list-student">View assessments for</Label>
            <Select value={studentId} onValueChange={(value) => { setStudentId(value); resetForm(); }}>
              <SelectTrigger id="demo-assessment-list-student"><SelectValue placeholder="Select student" /></SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={String(student.id)}>{student.name} · {classLabel(student)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-slate-900">Saved assessments</h3>
            <Badge variant="outline">{studentAssessments.length} records</Badge>
          </div>
          <div className="max-h-[34rem] space-y-3 overflow-y-auto pr-1">
            {studentAssessments.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">No assessments have been saved for this student.</p>
            ) : studentAssessments.map((assessment) => (
              <div key={assessment.id} className="rounded-lg border border-slate-200 p-3 sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-900">{assessment.title}</p>
                      <Badge variant="outline">{assessment.kind}</Badge>
                      {assessment.status === "upcoming" && <Badge className="border-0 bg-amber-100 text-amber-800">Upcoming</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{assessment.subject} · {assessment.term} · {assessment.academicYear} · {new Date(`${assessment.dueDate}T00:00:00`).toLocaleDateString()}</p>
                    <p className="mt-1 text-sm font-semibold text-indigo-700">
                      {assessment.score === null ? "No score entered" : `${assessment.score} / ${assessment.maxScore} (${assessmentPercent(assessment)}%)`}
                    </p>
                    {assessment.feedback && <p className="mt-2 text-sm text-slate-600">{assessment.feedback}</p>}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => editAssessment(assessment)} aria-label={`Edit ${assessment.title}`}>
                      <Pencil className="mr-1.5 h-4 w-4" /> Edit
                    </Button>
                    <Button type="button" size="sm" variant="outline" className="border-rose-200 text-rose-700 hover:bg-rose-50" onClick={() => deleteAssessment(assessment)} aria-label={`Delete ${assessment.title}`}>
                      <Trash2 className="mr-1.5 h-4 w-4" /> Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PerformanceEntryPage({
  students,
  setStudents,
  subjects,
  onBack,
}: {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  subjects: Subject[];
  onBack: () => void;
}) {
  const [studentId, setStudentId] = useState<string>(String(students[0]?.id ?? "1"));
  const current = students.find((s) => String(s.id) === studentId)!;

  const [grades, setGrades] = useState<Record<Subject, string>>(
    Object.fromEntries(SUBJECTS.map((s) => [s, current.recordedSubjects?.includes(s) || current.grades[s] > 0 ? String(current.grades[s]) : ""])) as Record<Subject, string>,
  );
  const [participation, setParticipation] = useState<Record<Subject, string>>(
    Object.fromEntries(SUBJECTS.map((s) => [s, current.recordedSubjects?.includes(s) || current.participation[s] > 0 ? String(current.participation[s]) : ""])) as Record<Subject, string>,
  );
  const [remarks, setRemarks] = useState<Record<Subject, string>>(
    Object.fromEntries(SUBJECTS.map((s) => [s, current.remarks[s]])) as Record<Subject, string>,
  );
  const [attendance, setAttendance] = useState<string>(current.attendanceRecorded || current.attendance > 0 ? String(current.attendance) : "");
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    setGrades(Object.fromEntries(SUBJECTS.map((s) => [s, current.recordedSubjects?.includes(s) || current.grades[s] > 0 ? String(current.grades[s]) : ""])) as Record<Subject, string>);
    setParticipation(Object.fromEntries(SUBJECTS.map((s) => [s, current.recordedSubjects?.includes(s) || current.participation[s] > 0 ? String(current.participation[s]) : ""])) as Record<Subject, string>);
    setRemarks(Object.fromEntries(SUBJECTS.map((s) => [s, current.remarks[s]])) as Record<Subject, string>);
    setAttendance(current.attendanceRecorded || current.attendance > 0 ? String(current.attendance) : "");
  }, [studentId, current]);

  const errors: string[] = [];
  const att = Number(attendance);
  if (attendance === "" || isNaN(att) || att < 0 || att > 100) errors.push("Attendance must be a number between 0 and 100.");
  subjects.forEach((sub) => {
    const g = Number(grades[sub]);
    if (grades[sub] === "" || isNaN(g) || g < 0 || g > 100) errors.push(`${sub} grade must be 0–100.`);
    const p = Number(participation[sub]);
    if (participation[sub] === "" || isNaN(p) || p < 0 || p > 10) errors.push(`${sub} participation must be 0–10.`);
    if ((remarks[sub]?.length ?? 0) > 280) errors.push(`${sub} remark must be 280 characters or fewer.`);
  });

  const canSave = errors.length === 0;

  const doSave = () => {
    if (!canSave) {
      toast.error(errors[0]);
      return;
    }
    const id = Number(studentId);
    if (!students.some((student) => student.id === id)) {
      toast.error("Choose a student in your assigned classes.");
      return;
    }
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const nextGrades = { ...s.grades };
        const nextParticipation = { ...s.participation };
        const nextRemarks = { ...s.remarks };
        subjects.forEach((subject) => {
          nextGrades[subject] = Number(grades[subject]);
          nextParticipation[subject] = Number(participation[subject]);
          nextRemarks[subject] = remarks[subject].trim();
        });
        return {
          ...s,
          attendance: Number(attendance),
          attendanceRecorded: true,
          recordedSubjects: [...new Set([...(Array.isArray(s.recordedSubjects) ? s.recordedSubjects : []), ...subjects])],
          grades: nextGrades,
          participation: nextParticipation,
          remarks: nextRemarks,
        };
      }),
    );
    setConfirmOpen(true);
    toast.info(`Updated ${current.name}'s local demo data. No school database was updated.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <button onClick={onBack} className="mb-3 inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700">
            <ChevronRight className="h-4 w-4 rotate-180" /> Back to dashboard
          </button>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Enter Performance</h1>
          <p className="mt-1 text-sm text-slate-500">Update assigned-subject grades, attendance, participation and feedback. Changes remain in this browser and are not sent to a school database.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>Cancel</Button>
          <Button onClick={doSave} disabled={!canSave} className="bg-indigo-600 hover:bg-indigo-700">
            Update local demo
          </Button>
        </div>
      </div>

      <Card className="border-slate-200/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Student</CardTitle>
          <CardDescription>Choose a student from your assigned classes and enter an attendance percentage. A dated daily attendance register is not available in this demo.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label>Student</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {students.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name} — {classLabel(s)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Attendance (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={attendance}
              onChange={(e) => setAttendance(e.target.value)}
              className={attendance !== "" && (Number(attendance) < 0 || Number(attendance) > 100) ? "border-rose-400" : ""}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Per-subject Performance</CardTitle>
          <CardDescription>Grade (0–100), participation (0–10), and a remark per subject.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {subjects.map((sub) => {
            const g = Number(grades[sub]);
            const p = Number(participation[sub]);
            const gBad = grades[sub] === "" || isNaN(g) || g < 0 || g > 100;
            const pBad = participation[sub] === "" || isNaN(p) || p < 0 || p > 10;
            const rBad = (remarks[sub]?.length ?? 0) > 280;
            return (
              <div key={sub} className="rounded-xl border border-slate-200/70 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">{sub}</h3>
                  {!gBad && !isNaN(g) && (
                    <span className="text-xs text-slate-500">Grade: <span className="font-medium text-slate-700">{letter(g)}</span></span>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-1.5">
                    <Label>Grade (0–100)</Label>
                    <Input
                      type="number" min={0} max={100}
                      value={grades[sub]}
                      onChange={(e) => setGrades((prev) => ({ ...prev, [sub]: e.target.value }))}
                      className={gBad ? "border-rose-400" : ""}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Participation (0–10)</Label>
                    <Input
                      type="number" min={0} max={10}
                      value={participation[sub]}
                      onChange={(e) => setParticipation((prev) => ({ ...prev, [sub]: e.target.value }))}
                      className={pBad ? "border-rose-400" : ""}
                    />
                  </div>
                </div>
                <div className="mt-3 grid gap-1.5">
                  <div className="flex items-center justify-between">
                    <Label>Teacher Remark</Label>
                    <span className={`text-xs ${rBad ? "text-rose-600" : "text-slate-400"}`}>{(remarks[sub]?.length ?? 0)}/280</span>
                  </div>
                  <Textarea
                    value={remarks[sub] ?? ""}
                    onChange={(e) => setRemarks((prev) => ({ ...prev, [sub]: e.target.value }))}
                    placeholder={`Notes about ${current.name}'s ${sub} performance…`}
                    className={rBad ? "border-rose-400" : ""}
                    rows={2}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {errors.length > 0 && (
        <Card className="border-rose-200 bg-rose-50/50">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-rose-700">Please fix the following before saving:</p>
            <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-rose-700">
              {errors.map((e) => <li key={e}>{e}</li>)}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onBack}>Cancel</Button>
        <Button onClick={doSave} disabled={!canSave} className="bg-indigo-600 hover:bg-indigo-700">
          Update local demo
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-emerald-600" /> Local demo updated
            </DialogTitle>
            <DialogDescription>
              {current.name}'s in-browser demo state was updated for the assigned subjects. The app will attempt to retain it in this browser; no school database or other device is updated.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Stay on page</Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={onBack}>Back to dashboard</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PerformanceEntryDialog({
  open,
  onOpenChange,
  students,
  setStudents,
  subjects,
  initialStudentId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  subjects: Subject[];
  initialStudentId: number | null;
}) {
  const [studentId, setStudentId] = useState<string>(String(students[0]?.id ?? "1"));
  const [subject, setSubject] = useState<Subject>(subjects[0] ?? "Math");
  const [grade, setGrade] = useState<string>("");
  const [attendance, setAttendance] = useState<string>("");
  const [participation, setParticipation] = useState<string>("");
  const [remark, setRemark] = useState<string>("");

  const current = students.find((s) => String(s.id) === studentId);

  useEffect(() => {
    if (!open) return;
    if (initialStudentId !== null && students.some((student) => student.id === initialStudentId)) {
      setStudentId(String(initialStudentId));
      return;
    }
    if (students.length > 0 && !students.some((student) => String(student.id) === studentId)) {
      setStudentId(String(students[0].id));
    }
  }, [initialStudentId, open, studentId, students]);

  useEffect(() => {
    if (!current) return;
    setGrade(current.recordedSubjects?.includes(subject) || current.grades[subject] > 0 ? String(current.grades[subject]) : "");
    setAttendance(current.attendanceRecorded || current.attendance > 0 ? String(current.attendance) : "");
    setParticipation(current.recordedSubjects?.includes(subject) || current.participation[subject] > 0 ? String(current.participation[subject]) : "");
    setRemark(current.remarks[subject]);
  }, [studentId, subject, current]);

  const save = () => {
    const id = Number(studentId);
    const g = Number(grade);
    const a = Number(attendance);
    const p = Number(participation);
    if (!current || !students.some((student) => student.id === id)) return toast.error("Choose a student in your assigned classes.");
    if (!subjects.includes(subject)) return toast.error("Choose one of your assigned subjects.");
    if (isNaN(g) || g < 0 || g > 100) return toast.error("Grade must be 0–100");
    if (isNaN(a) || a < 0 || a > 100) return toast.error("Attendance must be 0–100");
    if (isNaN(p) || p < 0 || p > 10) return toast.error("Participation must be 0–10");
    setStudents((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              grades: { ...s.grades, [subject]: g },
              attendance: a,
              attendanceRecorded: true,
              recordedSubjects: [...new Set([...(Array.isArray(s.recordedSubjects) ? s.recordedSubjects : []), subject])],
              participation: { ...s.participation, [subject]: p },
              remarks: { ...s.remarks, [subject]: remark.trim() || s.remarks[subject] },
            }
          : s,
      ),
    );
    toast.info(`Updated ${subject} in the browser demo for ${current.name}. No school database was updated.`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Enter Student Performance</DialogTitle>
          <DialogDescription>Local demo entry only: changes remain in this browser and do not update a school database.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Student</Label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {students.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Subject</Label>
              <Select value={subject} onValueChange={(v) => setSubject(v as Subject)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <Label>Grade (0–100)</Label>
              <Input type="number" min={0} max={100} value={grade} onChange={(e) => setGrade(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Attendance (%)</Label>
              <Input type="number" min={0} max={100} value={attendance} onChange={(e) => setAttendance(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Participation (0–10)</Label>
              <Input type="number" min={0} max={10} value={participation} onChange={(e) => setParticipation(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Teacher Remark</Label>
            <Select value={remark} onValueChange={setRemark}>
              <SelectTrigger><SelectValue placeholder="Select a remark" /></SelectTrigger>
              <SelectContent className="max-h-96">
                <SelectItem value="">-- Clear Selection --</SelectItem>
                {TEACHER_REMARKS.good.map((r, i) => (
                  <SelectItem key={`good-${i}`} value={r}>{r}</SelectItem>
                ))}
                {TEACHER_REMARKS.bad.map((r, i) => (
                  <SelectItem key={`bad-${i}`} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={save}>Save Performance</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type ParentConnectionRequest = {
  id: string;
  childName: string;
  studentId: string;
  level: Level;
  school: string;
  createdAt: string;
  status: "pending";
};

const PARENT_DEMO_SUBJECTS = [
  { subject: "Mathematics", score: 82, coursework: 18, quiz: 16, exam: 48, feedback: "Keep practising multi-step problem solving." },
  { subject: "Science", score: 76, coursework: 17, quiz: 15, exam: 44, feedback: "Good observations; review the current topic vocabulary." },
  { subject: "English", score: 88, coursework: 19, quiz: 18, exam: 51, feedback: "Strong reading comprehension and clear written responses." },
  { subject: "History", score: 71, coursework: 16, quiz: 14, exam: 41, feedback: "Use a timeline to organize key events and dates." },
];

const PARENT_DEMO_PROGRESS = [
  { term: "Term 1", average: 72 },
  { term: "Term 2", average: 78 },
  { term: "Term 3", average: 79 },
];

const PARENT_DEMO_ATTENDANCE = [
  { month: "Jan", present: 18, absent: 2 },
  { month: "Feb", present: 19, absent: 1 },
  { month: "Mar", present: 17, absent: 2 },
  { month: "Apr", present: 18, absent: 1 },
];

function isParentConnectionRequest(value: unknown): value is ParentConnectionRequest {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value && typeof value.id === "string" &&
    "childName" in value && typeof value.childName === "string" &&
    "studentId" in value && typeof value.studentId === "string" &&
    "level" in value && (LEVELS as readonly unknown[]).includes(value.level) &&
    "school" in value && typeof value.school === "string" &&
    "createdAt" in value && typeof value.createdAt === "string" &&
    "status" in value && value.status === "pending"
  );
}

function ParentConnectionDashboard({ parentEmail, onBack }: { parentEmail: string; onBack: () => void }) {
  const storageKey = `gtech.parent-connection-requests.v1.${encodeURIComponent(parentEmail.toLowerCase())}`;
  const [requests, setRequests] = useState<ParentConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [childName, setChildName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [level, setLevel] = useState<Level | "">("");
  const [school, setSchool] = useState("");
  const [showDemoPreview, setShowDemoPreview] = useState(false);

  useEffect(() => {
    let active = true;
    const loadRequests = () => {
      try {
        const raw = window.localStorage.getItem(storageKey);
        const parsed: unknown = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(parsed)) throw new Error("Saved connection request data is not a list.");
        if (active) {
          setRequests(parsed.filter(isParentConnectionRequest));
          setStorageError(null);
        }
      } catch (error) {
        if (active) {
          setStorageError(error instanceof Error ? error.message : "Could not read local request status.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    loadRequests();
    const onStorage = (event: StorageEvent) => {
      if (event.key === storageKey) loadRequests();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      active = false;
      window.removeEventListener("storage", onStorage);
    };
  }, [storageKey]);

  const submitRequest = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = childName.trim();
    const trimmedId = studentId.trim();
    const trimmedSchool = school.trim();
    if (!trimmedName || !trimmedId || !level || !trimmedSchool) {
      setStorageError("Complete each field before saving this local request.");
      return;
    }
    const request: ParentConnectionRequest = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      childName: trimmedName,
      studentId: trimmedId,
      level,
      school: trimmedSchool,
      createdAt: new Date().toISOString(),
      status: "pending",
    };
    const nextRequests = [request, ...requests];
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(nextRequests));
      setRequests(nextRequests);
      setStorageError(null);
      setChildName("");
      setStudentId("");
      setLevel("");
      setSchool("");
      toast.info("Saved as a pending request in this browser only. It was not sent for school review.");
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : "Could not save the request in this browser.");
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <button onClick={onBack} className="mb-3 inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700">
          <ChevronRight className="h-4 w-4 rotate-180" /> Back to login
        </button>
        <p className="text-xs font-medium uppercase tracking-wider text-indigo-600">Parent/Guardian view</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Connect to a child</h1>
        <p className="mt-1 text-sm text-slate-500">No student records are displayed until a trusted school process verifies a relationship.</p>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        A child&apos;s name, student ID, class, and school help identify a record, but do not prove a parent-child relationship.
        Requests saved here remain local and are not sent to school staff. This demo cannot verify or approve a connection.
      </div>

      {storageError && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{storageError}</div>}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-slate-200/70 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4 text-indigo-600" /> Linked children</CardTitle>
            <CardDescription>Only children verified by an authorized school process may appear here.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
              No verified child connections are available. Submitting identifying details below will not unlock student information.
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Academic updates and alerts</CardTitle>
            <CardDescription>Notifications are unavailable until a child connection is verified by a trusted service.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No child academic records or alerts are shown in this parent demo.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200/70 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><UserPlus className="h-4 w-4 text-indigo-600" /> Request a child connection</CardTitle>
          <CardDescription>Enter identifying details for a future verification process. This local demo does not share the request with the school.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitRequest} className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="parent-child-name">Child&apos;s full name</Label>
              <Input id="parent-child-name" autoComplete="off" maxLength={120} required value={childName} onChange={(event) => setChildName(event.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="parent-student-id">Student ID</Label>
              <Input id="parent-student-id" autoComplete="off" maxLength={80} required value={studentId} onChange={(event) => setStudentId(event.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="parent-child-level">Class or academic level</Label>
              <Select value={level} onValueChange={(value) => setLevel(value as Level)}>
                <SelectTrigger id="parent-child-level"><SelectValue placeholder="Select a level" /></SelectTrigger>
                <SelectContent>{LEVELS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
              </Select>
              {!level && <span className="text-xs text-slate-500">Choose the child&apos;s current level.</span>}
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="parent-child-school">School</Label>
              <Input id="parent-child-school" autoComplete="organization" maxLength={160} required value={school} onChange={(event) => setSchool(event.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <div className="flex flex-col items-stretch gap-2 sm:items-start">
              <Button type="submit" disabled={!childName.trim() || !studentId.trim() || !level || !school.trim()} className="w-full sm:w-auto">
                Save local pending request
              </Button>
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setShowDemoPreview((current) => !current)}>
                {showDemoPreview ? "Close demo preview" : "Skip for a demo"}
              </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {showDemoPreview && (
        <Card className="border-indigo-200 bg-indigo-50/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Fictional parent dashboard preview</CardTitle>
            <CardDescription>This preview is hard-coded sample content, not a linked child or a real academic record.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-indigo-100 bg-white p-4">
                <p className="text-xs font-medium uppercase text-slate-500">Student</p>
                <p className="mt-1 font-semibold text-slate-900">Sample learner</p>
                <p className="text-sm text-slate-500">Fictional · JHS 2</p>
              </div>
              <div className="rounded-lg border border-indigo-100 bg-white p-4">
                <p className="text-xs font-medium uppercase text-slate-500">Overall average</p>
                <p className="mt-1 font-semibold text-slate-900">79%</p>
                <p className="text-sm text-slate-500">Fictional · Term 3</p>
              </div>
              <div className="rounded-lg border border-emerald-100 bg-white p-4">
                <p className="text-xs font-medium uppercase text-slate-500">Attendance preview</p>
                <p className="mt-1 font-semibold text-slate-900">94%</p>
                <p className="text-sm text-slate-500">47 of 50 sample school days</p>
              </div>
              <div className="rounded-lg border border-amber-100 bg-white p-4">
                <p className="text-xs font-medium uppercase text-slate-500">Support focus</p>
                <p className="mt-1 font-semibold text-slate-900">History review</p>
                <p className="text-sm text-slate-500">Sample suggestion only</p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border-indigo-100 bg-white shadow-none">
                <CardHeader>
                  <CardTitle className="text-sm">Academic progress by term</CardTitle>
                  <CardDescription>Fictional overall average · percent</CardDescription>
                </CardHeader>
                <CardContent className="h-64 pl-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={PARENT_DEMO_PROGRESS} margin={{ top: 8, right: 18, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="term" stroke="#64748b" fontSize={12} />
                      <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} />
                      <Tooltip formatter={(value) => [`${value}%`, "Sample average"]} />
                      <Line type="monotone" dataKey="average" name="Average" stroke="#4f46e5" strokeWidth={3} dot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border-emerald-100 bg-white shadow-none">
                <CardHeader>
                  <CardTitle className="text-sm">Attendance by month</CardTitle>
                  <CardDescription>Fictional school days present and absent</CardDescription>
                </CardHeader>
                <CardContent className="h-64 pl-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={PARENT_DEMO_ATTENDANCE} margin={{ top: 8, right: 18, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                      <YAxis allowDecimals={false} stroke="#64748b" fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="present" name="Present" stackId="days" fill="#10b981" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="absent" name="Absent" stackId="days" fill="#f59e0b" radius={[5, 5, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card className="border-slate-200 bg-white shadow-none">
              <CardHeader>
                <CardTitle className="text-sm">Subject results and assessment breakdown</CardTitle>
                <CardDescription>Coursework (20) + quiz (20) + examination (60) = sample score (100)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-56 pl-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={PARENT_DEMO_SUBJECTS} margin={{ top: 8, right: 18, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="subject" stroke="#64748b" fontSize={11} />
                      <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} />
                      <Tooltip formatter={(value) => [`${value}%`, "Sample score"]} />
                      <Bar dataKey="score" name="Sample score" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-left text-sm">
                    <thead>
                      <tr className="border-y bg-slate-50 text-xs uppercase text-slate-500">
                        <th className="px-3 py-2 font-medium">Subject</th>
                        <th className="px-3 py-2 font-medium">Coursework /20</th>
                        <th className="px-3 py-2 font-medium">Quiz /20</th>
                        <th className="px-3 py-2 font-medium">Exam /60</th>
                        <th className="px-3 py-2 font-medium">Total /100</th>
                      </tr>
                    </thead>
                    <tbody>
                      {PARENT_DEMO_SUBJECTS.map((item) => (
                        <tr key={item.subject} className="border-b border-slate-100">
                          <td className="px-3 py-3 font-medium text-slate-900">{item.subject}</td>
                          <td className="px-3 py-3 text-slate-600">{item.coursework}</td>
                          <td className="px-3 py-3 text-slate-600">{item.quiz}</td>
                          <td className="px-3 py-3 text-slate-600">{item.exam}</td>
                          <td className="px-3 py-3 font-semibold text-indigo-700">{item.score}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border-slate-200 bg-white shadow-none">
                <CardHeader><CardTitle className="text-sm">Sample teacher feedback</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {PARENT_DEMO_SUBJECTS.map((item) => (
                    <div key={item.subject} className="border-l-2 border-indigo-200 pl-3">
                      <p className="text-xs font-semibold text-slate-700">{item.subject}</p>
                      <p className="text-sm text-slate-600">{item.feedback}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="border-slate-200 bg-white shadow-none">
                <CardHeader><CardTitle className="text-sm">Attendance summary</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm"><span className="text-slate-600">Present</span><span className="font-semibold text-emerald-700">47 days</span></div>
                  <Progress value={94} className="h-2" />
                  <div className="flex items-center justify-between text-sm"><span className="text-slate-600">Absent</span><span className="font-semibold text-amber-700">3 days</span></div>
                  <p className="text-xs text-slate-500">Illustrative attendance counts only; not a real register.</p>
                </CardContent>
              </Card>
            </div>

            <p className="text-xs text-indigo-800">Every name, score, chart value, attendance count, and comment above is fictional. This preview does not identify, look up, link to, or grant access to any student.</p>
          </CardContent>
        </Card>
      )}

      <Card className="border-slate-200/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Connection request status</CardTitle>
          <CardDescription>These are browser-local drafts only. No administrator has received, reviewed, or verified them.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-slate-500">Loading local request drafts…</p>
          ) : requests.length === 0 ? (
            <p className="text-sm text-slate-500">No connection request drafts yet.</p>
          ) : requests.map((request) => (
            <div key={request.id} className="flex flex-col gap-2 rounded-lg border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-slate-900">{request.childName}</p>
                <p className="text-sm text-slate-500">Student ID {request.studentId} · {request.level} · {request.school}</p>
                <p className="text-xs text-slate-400">Saved {new Date(request.createdAt).toLocaleString()}</p>
              </div>
              <Badge variant="outline" className="w-fit border-amber-200 bg-amber-50 text-amber-800">Pending locally · not sent</Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function StudentParentDashboard({
  role,
  students,
  selectedStudentId,
  setSelectedStudentId,
  term,
  academicYear,
  onBack,
  demoMode,
  demoAssessments,
}: {
  role: Role;
  students: Student[];
  selectedStudentId: number;
  setSelectedStudentId: (id: number) => void;
  term: Term;
  academicYear: AcademicYear;
  onBack: () => void;
  demoMode: boolean;
  demoAssessments: DemoAssessment[];
}) {
  const base = students.find((s) => s.id === selectedStudentId) ?? students[0];

  // Local demo records update in this browser when a teacher saves changes.
  const { records, loading, error } = useLocalPerformance(demoMode ? null : (base?.id ?? null), term, academicYear);
  const [history, setHistory] = useState<StudentRecordSnapshot<Student>[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    if (demoMode) {
      setHistory([]);
      setHistoryLoading(false);
      setHistoryError(null);
      return;
    }
    let active = true;
    const loadHistory = () => {
      setHistoryLoading(true);
      setHistoryError(null);
      loadStudentHistory(base.id, isStudentSnapshot)
        .then((snapshots) => {
          if (active) setHistory(snapshots);
        })
        .catch((reason: unknown) => {
          if (active) {
            setHistoryError(
              reason instanceof Error ? reason.message : "Could not load local academic history.",
            );
          }
        })
        .finally(() => {
          if (active) setHistoryLoading(false);
        });
    };

    loadHistory();
    window.addEventListener(LOCAL_DATA_UPDATED, loadHistory);
    window.addEventListener("storage", loadHistory);
    return () => {
      active = false;
      window.removeEventListener(LOCAL_DATA_UPDATED, loadHistory);
      window.removeEventListener("storage", loadHistory);
    };
  }, [base.id, demoMode]);

  const student = useMemo<Student>(() => {
    if (records.length === 0) return base;
    const grades = { ...base.grades };
    const participation = { ...base.participation };
    const remarks = { ...base.remarks };
    let attendance = base.attendance;
    for (const r of records) {
      if (!(SUBJECTS as readonly string[]).includes(r.subject)) continue;
      const subject = r.subject as Subject;
      grades[subject] = totalScore(r);
      participation[subject] = r.participation;
      remarks[subject] = r.remark;
      attendance = r.attendance;
    }
    return { ...base, grades, participation, remarks, attendance };
  }, [base, records]);

  const hasResults = demoMode || history.length > 0 || records.length > 0;
  const dashboardLoading = loading || historyLoading;
  const studentAssessments = demoAssessments.filter((assessment) => assessment.studentId === student.id);
  const completedAssessments = studentAssessments.filter(
    (assessment) => assessment.status === "completed" && assessment.score !== null,
  );
  const gpa = overall(student);
  const upcomingAssessments = studentAssessments
    .filter((assessment) => assessment.status === "upcoming")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);
  const parentOnlyUpdates = DEMO_PARENT_ONLY_UPDATES.filter(
    (update) => update.studentId === student.id,
  );
  const parentReportRows = SUBJECTS.map((subject) => {
    const subjectAssessments = completedAssessments.filter(
      (assessment) => assessment.subject === subject,
    );
    const scores = subjectAssessments.flatMap((assessment) => {
      const percentage = assessmentPercent(assessment);
      return percentage === null ? [] : [percentage];
    });
    return {
      subject,
      average: scores.length
        ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
        : student.grades[subject],
      count: scores.length,
    };
  });
  const recentAssessments = [...completedAssessments]
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate))
    .slice(0, 6);
  const demoTermProgress = TERMS.map((academicTerm) => {
    const termAssessments = completedAssessments.filter((assessment) => assessment.term === academicTerm);
    const scores = termAssessments.flatMap((assessment) => {
      const percentage = assessmentPercent(assessment);
      return percentage === null ? [] : [percentage];
    });
    return {
      date: academicTerm,
      average: scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0,
    };
  });
  const avgParticipation = (
    Object.values(student.participation).reduce((a, b) => a + b, 0) / SUBJECTS.length
  ).toFixed(1);
  const progressHistory = demoMode ? demoTermProgress : history.map((snapshot) => ({
    date: new Date(snapshot.updated_at).toLocaleDateString(),
    average: overall(snapshot.data),
  }));
  const recentActivity = [...history].reverse().slice(0, 5);
  const improvementAreas = hasResults
    ? [
        ...SUBJECTS.filter((subject) => student.grades[subject] < 70).map((subject) => ({
          title: `${subject} performance`,
          detail: `Current recorded score: ${student.grades[subject]}%.`,
        })),
        ...(student.attendance < 85
          ? [{
              title: "Attendance",
              detail: `Current recorded attendance: ${student.attendance}%.`,
            }]
          : []),
      ]
    : [];
  const strengths = SUBJECTS.filter((subject) => student.grades[subject] >= 85);
  const teacherFeedback = SUBJECTS.flatMap((subject) =>
    student.remarks[subject].trim()
      ? [{ subject, remark: student.remarks[subject] }]
      : [],
  );

  return (
    <div className={demoMode ? "demo-progress-report space-y-6" : "space-y-6"}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <button onClick={onBack} className="no-print mb-3 inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700">
            <ChevronRight className="h-4 w-4 rotate-180" /> Back
          </button>
          <p className="text-xs font-medium uppercase tracking-wider text-indigo-600">
            {role === "parent" ? "Parent view" : "Student view"}
          </p>
          <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">
            {role === "parent" ? `${student.name}'s Progress` : `Hi, ${student.name.split(" ")[0]} 👋`}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Class {classLabel(student)} · {term}, {academicYear} · {demoMode ? "Fictional demo profile" : "Local demo data"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {demoMode && <Button className="no-print" variant="outline" onClick={() => window.print()}>Print progress report</Button>}
          {role === "parent" && (
            <div className="no-print">
              <Select value={String(selectedStudentId)} onValueChange={(v) => setSelectedStudentId(Number(v))}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Select child" /></SelectTrigger>
                <SelectContent>
                  {students.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">
            {hasResults ? `GPA ${(gpa / 25).toFixed(2)}` : "No results yet"}
          </Badge>
          <Badge
            variant="outline"
            className={dashboardLoading ? "border-slate-200 bg-slate-50 text-slate-500" : "border-amber-200 bg-amber-50 text-amber-700"}
          >
            {dashboardLoading ? "Loading local records..." : "Local demo · not authenticated"}
          </Badge>
        </div>
      </div>

      {!hasResults && !dashboardLoading && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="status">
          These dashboards start with fictional sample students and blank scores. No actual student results are included.
          Teacher-entered local demo records will appear here after they are saved in this browser.
        </div>
      )}
      {demoMode && (
        <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-sm font-semibold tracking-wide text-indigo-900">
          DEMO DATA — FICTIONAL RECORDS
        </div>
      )}
      {demoMode && role === "parent" && (
        <Card className="border-slate-200/70 shadow-sm">
          <CardContent className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Parent profile</p>
              <p className="font-semibold text-slate-900">Demo Parent</p>
            </div>
            <p className="text-sm text-slate-600">Linked fictional student: {student.name} · Student ID {student.id}</p>
          </CardContent>
        </Card>
      )}
      {(error || historyError) && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">
          Could not load some local academic records: {error ?? historyError}
        </div>
      )}

      <Card className="border-slate-200/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Academic overview</CardTitle>
          <CardDescription>
            {student.name} · {classLabel(student)} · {term}, {academicYear}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-indigo-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-indigo-700">Overall average</p>
            <p className="mt-1 text-2xl font-bold text-indigo-950">{hasResults ? `${gpa}%` : "—"}</p>
            <p className="text-xs text-indigo-700">{hasResults ? `Grade ${letter(gpa)}` : "No saved scores"}</p>
          </div>
          <div className="rounded-lg bg-emerald-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Attendance</p>
            <p className="mt-1 text-2xl font-bold text-emerald-950">{hasResults ? `${student.attendance}%` : "—"}</p>
            <p className="text-xs text-emerald-700">Teacher-entered local record</p>
          </div>
          <div className="rounded-lg bg-amber-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-amber-700">Participation</p>
            <p className="mt-1 text-2xl font-bold text-amber-950">{hasResults ? `${avgParticipation}/10` : "—"}</p>
            <p className="text-xs text-amber-700">Average across listed subjects</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/20">
          <CardContent className="p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-indigo-200">Overall Performance</p>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-5xl font-bold tracking-tight">{hasResults ? `${gpa}%` : "—"}</span>
              {hasResults && <span className="mb-1.5 text-xl font-semibold text-indigo-200">{letter(gpa)}</span>}
            </div>
            <p className="mt-2 text-sm text-indigo-100">
              {hasResults ? "Average of saved subject results for this demo profile." : "No results have been saved for this demo profile."}
            </p>
            {hasResults && (
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/20">
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-amber-300" style={{ width: `${gpa}%` }} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Attendance</CardTitle>
            <CardDescription>Attendance percentage recorded for this demo profile</CardDescription>
          </CardHeader>
          <CardContent className="grid place-items-center pb-6">
            {hasResults ? (
              <AttendanceGauge value={student.attendance} />
            ) : (
              <p className="py-12 text-center text-sm text-slate-500">No attendance record is available yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200/70 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HandMetal className="h-4 w-4 text-indigo-500" /> Participation
            </CardTitle>
            <CardDescription>{hasResults ? `Average ${avgParticipation} / 10 across subjects` : "No participation records yet"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
          {hasResults ? SUBJECTS.map((sub) => (
              <div key={sub}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">{sub}</span>
                  <span className="text-slate-500">{student.participation[sub]} / 10</span>
                </div>
                <Progress value={student.participation[sub] * 10} className="h-1.5" />
              </div>
            )) : <p className="text-sm text-slate-500">Participation appears after a teacher saves local demo records.</p>}
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Subject-by-subject results</CardTitle>
          <CardDescription>Results and participation recorded for this local demo profile</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {SUBJECTS.map((sub) => {
              const score = student.grades[sub];
              return (
                <div key={sub} className="rounded-xl border border-slate-200 bg-white p-4 transition hover:border-indigo-200 hover:shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{sub}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {hasResults ? `Participation: ${student.participation[sub]}/10` : "No result recorded"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      {hasResults ? (
                        <>
                          <p className="text-2xl font-bold tracking-tight text-slate-900">{letter(score)}</p>
                          <p className="text-xs text-slate-500">{score}%</p>
                        </>
                      ) : <p className="text-sm text-slate-400">—</p>}
                    </div>
                  </div>
                  {hasResults && <Progress value={score} className="mt-3 h-1.5" />}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {demoMode && role === "student" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-slate-200/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Recent assessment results</CardTitle>
              <CardDescription>Fictional assignments, quizzes, tests, and examinations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentAssessments.map((assessment) => (
                <div key={assessment.id} className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 p-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{assessment.subject} · {assessment.title}</p>
                    <p className="text-xs text-slate-500">{assessment.term} · {new Date(`${assessment.dueDate}T00:00:00`).toLocaleDateString()}</p>
                    <p className="mt-1 text-xs text-slate-600">{assessment.feedback}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-indigo-700">
                    {assessment.score}/{assessment.maxScore} ({assessmentPercent(assessment)}%)
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="border-slate-200/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Upcoming assignments</CardTitle>
              <CardDescription>Planned fictional practice activities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingAssessments.map((assessment) => (
                <div key={assessment.id} className="flex items-center justify-between gap-4 rounded-lg border border-indigo-100 bg-indigo-50/60 p-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{assessment.subject} · {assessment.title}</p>
                    <p className="text-xs text-slate-500">{assessment.term} · Due {new Date(`${assessment.dueDate}T00:00:00`).toLocaleDateString()}</p>
                  </div>
                  <Badge variant="outline" className="border-indigo-200 bg-white text-indigo-700">Upcoming</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
      {demoMode && role === "parent" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-slate-200/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Family progress report</CardTitle>
              <CardDescription>Parent-facing summary of the fictional assessment record across all three terms.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {parentReportRows.map(({ subject, average, count }) => (
                <div key={subject} className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 p-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{subject}</p>
                    <p className="text-xs text-slate-500">{count} completed fictional assessments</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-indigo-700">{average}%</p>
                    <p className="text-xs text-slate-500">subject average</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Parent-only family updates</CardTitle>
              <CardDescription>Fictional school-to-home guidance shown in the Parent demo view, not the Student dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {parentOnlyUpdates.map((update) => (
                <div key={update.id} className="rounded-lg border border-amber-200 bg-white p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{update.title}</p>
                    <Badge variant="outline" className="border-amber-300 text-amber-800">{update.term}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">{update.message}</p>
                  <p className="mt-2 text-sm text-amber-900"><span className="font-medium">Suggested family action:</span> {update.suggestedAction}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="border-slate-200/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Recent academic results</CardTitle>
              <CardDescription>Latest shared assessment records and teacher feedback for the linked student.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentAssessments.slice(0, 5).map((assessment) => (
                <div key={assessment.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{assessment.subject} · {assessment.title}</p>
                      <p className="text-xs text-slate-500">{assessment.kind} · {assessment.term} · {new Date(`${assessment.dueDate}T00:00:00`).toLocaleDateString()}</p>
                    </div>
                    <p className="text-sm font-semibold text-indigo-700">{assessment.score}/{assessment.maxScore} ({assessmentPercent(assessment)}%)</p>
                  </div>
                  {assessment.feedback && <p className="mt-2 text-sm text-slate-600">{assessment.feedback}</p>}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-slate-200/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Academic progress over time</CardTitle>
            <CardDescription>{demoMode ? "Calculated from fictional assessment scores across the three terms." : "Saved local teacher-workspace snapshots; no historical scores are generated."}</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {historyLoading ? (
              <div className="grid h-full place-items-center text-sm text-slate-500" role="status">Loading academic history...</div>
            ) : historyError ? (
              <div className="grid h-full place-items-center text-center text-sm text-rose-700" role="alert">{historyError}</div>
            ) : progressHistory.length < 2 ? (
              <div className="grid h-full place-items-center text-center text-sm text-slate-500">
                {demoMode ? "No assessment trend is available yet." : "Save results more than once to see progress over time. No trend data has been invented."}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressHistory} margin={{ top: 8, right: 16, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                  <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                  <Line type="monotone" dataKey="average" name="Average" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200/70 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-4 w-4 text-indigo-500" /> {role === "parent" ? "Shared subject feedback" : "Teacher feedback"}
            </CardTitle>
            <CardDescription>{role === "parent" ? "Subject remarks included in the shared academic record; parent-only family updates are shown separately." : "Feedback attached to the student&apos;s shared subject results."}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!hasResults ? (
              <p className="text-sm text-slate-500">Teacher feedback will appear after local demo results are saved.</p>
            ) : teacherFeedback.length === 0 ? (
              <p className="text-sm text-slate-500">No teacher feedback has been recorded.</p>
            ) : teacherFeedback.map(({ subject, remark }) => (
              <div key={subject} className="rounded-lg border border-slate-200 p-3">
                <p className="text-sm font-medium text-slate-900">{subject}</p>
                <p className="mt-1 text-sm text-slate-600">{remark}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-200/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">{role === "parent" ? "Support learning at home" : "Strengths and areas to review"}</CardTitle>
            <CardDescription>Based on the current fictional scores and attendance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {demoMode && strengths.length > 0 && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-sm font-medium text-emerald-950">Strengths: {strengths.join(", ")}</p>
                <p className="mt-1 text-sm text-emerald-800">Celebrate these successes and encourage the student to explain their learning strategies.</p>
              </div>
            )}
            {demoMode && role === "parent" && (
              <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                Set a consistent short study routine, ask the student to teach back one concept, and contact the teacher if a topic remains difficult.
              </p>
            )}
            {!hasResults ? (
              <p className="text-sm text-slate-500">No recommendations are shown until results are recorded.</p>
            ) : improvementAreas.length === 0 ? (
              <p className="text-sm text-slate-600">No areas below the demo review thresholds were found in the saved records.</p>
            ) : improvementAreas.map((area) => (
              <div key={area.title} className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-medium text-amber-950">{area.title}</p>
                <p className="mt-1 text-sm text-amber-800">{area.detail} Consider reviewing this area with the teacher.</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-200/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Recent academic activity</CardTitle>
            <CardDescription>Local record save history for this demo student</CardDescription>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <p className="text-sm text-slate-500" role="status">Loading recent activity...</p>
            ) : historyError ? (
              <p className="text-sm text-rose-700" role="alert">{historyError}</p>
            ) : recentActivity.length === 0 ? (
              <p className="text-sm text-slate-500">No academic activity has been saved yet.</p>
            ) : (
              <ol className="space-y-3">
                {recentActivity.map((snapshot, index) => (
                  <li key={`${snapshot.updated_at}-${index}`} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium text-slate-900">Student record saved</p>
                      <p className="text-xs text-slate-500">{classLabel(snapshot.data)}</p>
                    </div>
                    <time className="shrink-0 text-xs text-slate-500" dateTime={snapshot.updated_at}>
                      {new Date(snapshot.updated_at).toLocaleString()}
                    </time>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AttendanceGauge({ value }: { value: number }) {
  const r = 56;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  const color = value >= 90 ? "#10b981" : value >= 85 ? "#f59e0b" : "#f43f5e";
  return (
    <div className="relative grid place-items-center">
      <svg width="160" height="160" className="-rotate-90">
        <circle cx="80" cy="80" r={r} stroke="#e2e8f0" strokeWidth="12" fill="none" />
        <circle
          cx="80" cy="80" r={r} stroke={color} strokeWidth="12" fill="none"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="text-3xl font-bold tracking-tight text-slate-900">{value}%</p>
          <p className="text-xs text-slate-500">Present</p>
        </div>
      </div>
    </div>
  );
}
