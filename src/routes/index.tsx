import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
  ChevronRight,
  Bell,
  HandMetal,
  MessageSquare,
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

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "G-TECH AUTOMATION — Student Performance Tracker" },
      { name: "description", content: "Modern dashboard for teachers, students and parents to track grades, attendance and progress in real time." },
      { property: "og:title", content: "G-TECH AUTOMATION — Student Performance Tracker" },
      { property: "og:description", content: "Real-time analytics for teachers, students and parents." },
    ],
  }),
  component: App,
});

type Role = "teacher" | "student" | "parent";

const SUBJECTS = ["Math", "Science", "English", "History"] as const;
type Subject = typeof SUBJECTS[number];

type Student = {
  id: number;
  name: string;
  class: string;
  grades: Record<Subject, number>;
  attendance: number;
  participation: Record<Subject, number>;
  remarks: Record<Subject, string>;
};

const INITIAL_STUDENTS: Student[] = [
  { id: 1, name: "Amara Okafor", class: "10-A", grades: { Math: 94, Science: 91, English: 88, History: 90 }, attendance: 97, participation: { Math: 9, Science: 9, English: 8, History: 9 }, remarks: { Math: "Outstanding problem-solver.", Science: "Engaged in every lab.", English: "Strong essays.", History: "Insightful analysis." } },
  { id: 2, name: "Liam Chen", class: "10-A", grades: { Math: 76, Science: 82, English: 79, History: 74 }, attendance: 91, participation: { Math: 7, Science: 8, English: 7, History: 6 }, remarks: { Math: "Improving steadily.", Science: "Solid effort.", English: "Watch grammar.", History: "Needs deeper reading." } },
  { id: 3, name: "Sofia Martinez", class: "10-B", grades: { Math: 68, Science: 72, English: 81, History: 70 }, attendance: 83, participation: { Math: 5, Science: 6, English: 8, History: 6 }, remarks: { Math: "Schedule tutoring.", Science: "Catch up on labs.", English: "Creative writer.", History: "Missing homework." } },
  { id: 4, name: "Noah Patel", class: "10-B", grades: { Math: 88, Science: 85, English: 92, History: 87 }, attendance: 95, participation: { Math: 8, Science: 8, English: 9, History: 8 }, remarks: { Math: "Sharp logic.", Science: "Great curiosity.", English: "Eloquent voice.", History: "Excellent essays." } },
  { id: 5, name: "Zara Ahmed", class: "10-A", grades: { Math: 58, Science: 64, English: 70, History: 62 }, attendance: 78, participation: { Math: 4, Science: 5, English: 6, History: 5 }, remarks: { Math: "Urgent support needed.", Science: "Struggling with concepts.", English: "Reading practice.", History: "Falling behind." } },
  { id: 6, name: "Ethan Brooks", class: "10-B", grades: { Math: 84, Science: 80, English: 86, History: 83 }, attendance: 93, participation: { Math: 7, Science: 7, English: 8, History: 7 }, remarks: { Math: "Consistent.", Science: "Reliable.", English: "Strong reader.", History: "Good notes." } },
];

const TERM_TREND = [
  { term: "Term 1", avg: 78 },
  { term: "Term 2", avg: 81 },
  { term: "Midterm", avg: 83 },
  { term: "Finals", avg: 86 },
];

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

function App() {
  const [pendingRole, setPendingRole] = useState<Role | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [splashDone, setSplashDone] = useState(false);
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [selectedStudentId, setSelectedStudentId] = useState<number>(INITIAL_STUDENTS[0].id);

  if (!splashDone) return <SplashScreen onDone={() => setSplashDone(true)} />;
  if (!role && !pendingRole) return <Landing onPick={setPendingRole} />;
  if (!role && pendingRole)
    return (
      <LoginPage
        role={pendingRole}
        onBack={() => setPendingRole(null)}
        onSuccess={() => {
          setRole(pendingRole);
          setPendingRole(null);
        }}
      />
    );
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <NavBar
        role={role!}
        setRole={(r) => { setRole(r); if (!r) setPendingRole(null); }}
        students={students}
        onSelectStudent={(id) => setSelectedStudentId(id)}
      />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {role === "teacher" ? (
          <TeacherDashboard students={students} setStudents={setStudents} />
        ) : (
          <StudentParentDashboard
            role={role!}
            students={students}
            selectedStudentId={selectedStudentId}
            setSelectedStudentId={setSelectedStudentId}
          />
        )}
      </main>
    </div>
  );
}

function passwordStrength(pw: string): { label: "Weak" | "Strong" | "Stronger" | "Better" | ""; score: number; color: string; valid: boolean; issues: string[] } {
  const issues: string[] = [];
  if (pw.length === 0) return { label: "", score: 0, color: "bg-slate-200", valid: false, issues };
  if (pw.length < 10) issues.push("At least 10 characters");
  if (pw.length > 15) issues.push("No more than 15 characters");
  const hasSpecial = /[!@#$%^&*()_\-+=\[\]{};:'",.<>/?\\|`~]/.test(pw);
  if (!hasSpecial) issues.push("Include a special character");
  const hasUpper = /[A-Z]/.test(pw);
  const hasLower = /[a-z]/.test(pw);
  const hasNum = /\d/.test(pw);

  let score = 0;
  if (pw.length >= 10 && pw.length <= 15) score++;
  if (hasSpecial) score++;
  if (hasUpper && hasLower) score++;
  if (hasNum) score++;

  const labels = ["Weak", "Weak", "Strong", "Stronger", "Better"] as const;
  const colors = ["bg-rose-500", "bg-rose-500", "bg-amber-500", "bg-indigo-500", "bg-emerald-500"];
  return { label: labels[score], score, color: colors[score], valid: issues.length === 0, issues };
}

const ROLE_THEME: Record<Role, { name: string; bg: string; card: string; accent: string; ring: string; icon: typeof Users; tag: string; tagline: string }> = {
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
    name: "Parent",
    bg: "bg-gradient-to-br from-amber-950 via-slate-900 to-rose-950",
    card: "bg-white",
    accent: "bg-amber-600 hover:bg-amber-700",
    ring: "focus-visible:ring-amber-500",
    icon: Award,
    tag: "Guardian Portal",
    tagline: "Stay close to every milestone.",
  },
};

function LoginPage({ role, onBack, onSuccess }: { role: Role; onBack: () => void; onSuccess: () => void }) {
  const theme = ROLE_THEME[role];
  const Icon = theme.icon;
  const [school, setSchool] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const strength = passwordStrength(password);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const canSubmit = school.trim().length > 1 && emailValid && strength.valid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      toast.error("Please complete all fields correctly.");
      return;
    }
    toast.success(`Welcome, ${theme.name.toLowerCase()}!`);
    onSuccess();
  };

  return (
    <div className={`relative min-h-screen ${theme.bg} text-white`}>
      <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_15%_20%,#fff_0,transparent_35%),radial-gradient(circle_at_85%_75%,#fff_0,transparent_35%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-4 py-10 sm:px-6 lg:flex-row lg:gap-12">
        <div className="mb-8 max-w-md text-center lg:mb-0 lg:flex-1 lg:text-left">
          <button onClick={onBack} className="mb-6 inline-flex items-center gap-1 text-sm text-white/70 hover:text-white">
            <ChevronRight className="h-4 w-4 rotate-180" /> Back
          </button>
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
            <CardDescription>Enter your school credentials to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="school" className="text-slate-700">School Name</Label>
                <Input id="school" value={school} onChange={(e) => setSchool(e.target.value)} placeholder="e.g. Greenfield High" className={theme.ring} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-slate-700">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu" className={theme.ring} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-slate-700">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value.slice(0, 15))}
                    placeholder="10–15 chars, include a special char"
                    maxLength={15}
                    className={`pr-16 ${theme.ring}`}
                  />
                  <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute inset-y-0 right-2 my-auto h-7 rounded px-2 text-xs font-medium text-slate-500 hover:bg-slate-100">
                    {showPw ? "Hide" : "Show"}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <span key={i} className={`h-1.5 flex-1 rounded-full transition ${i < strength.score ? strength.color : "bg-slate-200"}`} />
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className={`font-semibold ${
                        strength.label === "Weak" ? "text-rose-600" :
                        strength.label === "Strong" ? "text-amber-600" :
                        strength.label === "Stronger" ? "text-indigo-600" :
                        strength.label === "Better" ? "text-emerald-600" : "text-slate-500"
                      }`}>
                        {strength.label}
                      </span>
                      <span className="text-slate-500">{password.length}/15</span>
                    </div>
                    {strength.issues.length > 0 && (
                      <ul className="space-y-0.5 text-xs text-slate-500">
                        {strength.issues.map((i) => (
                          <li key={i}>• {i}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
              <Button type="submit" disabled={!canSubmit} className={`w-full ${theme.accent} text-white`}>
                <LogIn className="mr-2 h-4 w-4" /> Sign in
              </Button>
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
          G-TECH AUTOMATION
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

function Landing({ onPick }: { onPick: (r: Role) => void }) {
  const roles: { id: Role; title: string; desc: string; icon: typeof Users; accent: string }[] = [
    { id: "teacher", title: "Teacher", desc: "Manage class performance, attendance & insights.", icon: GraduationCap, accent: "from-indigo-500 to-indigo-600" },
    { id: "student", title: "Student", desc: "Track your grades, attendance and progress.", icon: BookOpen, accent: "from-emerald-500 to-emerald-600" },
    { id: "parent", title: "Parent", desc: "Stay informed about your child's journey.", icon: Award, accent: "from-amber-500 to-amber-600" },
  ];
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_20%_20%,#6366f1_0,transparent_40%),radial-gradient(circle_at_80%_60%,#10b981_0,transparent_40%)]" />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            Student Performance Tracker
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            <span className="bg-gradient-to-r from-white via-indigo-200 to-emerald-200 bg-clip-text text-transparent">
              G-TECH AUTOMATION
            </span>
          </h1>
          <p className="mt-4 text-base text-slate-300 sm:text-lg">
            Real-time grades, attendance, and teacher-entered insights for everyone in the classroom.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-3">
          {roles.map((r) => (
            <button
              key={r.id}
              onClick={() => onPick(r.id)}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 text-left backdrop-blur transition hover:-translate-y-1 hover:border-white/20 hover:bg-white/10"
            >
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${r.accent} shadow-lg`}>
                <r.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold">{r.title}</h3>
              <p className="mt-1 text-sm text-slate-300">{r.desc}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-300 group-hover:text-indigo-200">
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
  setRole,
  students,
  onSelectStudent,
}: {
  role: Role;
  setRole: (r: Role | null) => void;
  students: Student[];
  onSelectStudent: (id: number) => void;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-md shadow-indigo-500/30">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-tight">G-TECH AUTOMATION</p>
            <p className="hidden text-xs text-slate-500 sm:block">Performance tracker</p>
          </div>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <Tabs value={role} onValueChange={(v) => setRole(v as Role)}>
            <TabsList className="bg-slate-100">
              <TabsTrigger value="teacher">Teacher</TabsTrigger>
              <TabsTrigger value="student">Student</TabsTrigger>
              <TabsTrigger value="parent">Parent</TabsTrigger>
            </TabsList>
          </Tabs>

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
                    <span className="ml-auto text-xs text-slate-400">{s.class}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Select value={role} onValueChange={(v) => setRole(v as Role)}>
            <SelectTrigger className="w-[120px] sm:hidden">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="teacher">Teacher</SelectItem>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="parent">Parent</SelectItem>
            </SelectContent>
          </Select>
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
                    <span className="ml-auto text-xs text-slate-400">{s.class}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <button className="relative grid h-9 w-9 place-items-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50" aria-label="Notifications">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-500" />
          </button>
          <button onClick={() => setRole(null)} className="hidden rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 sm:inline-flex">
            Sign out
          </button>
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

function TeacherDashboard({ students, setStudents }: { students: Student[]; setStudents: React.Dispatch<React.SetStateAction<Student[]>> }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "excelling" | "average" | "at-risk">("all");
  const [entryOpen, setEntryOpen] = useState(false);

  const stats = useMemo(() => {
    const total = students.length;
    const avg = Math.round(students.reduce((a, s) => a + overall(s), 0) / total);
    const att = Math.round(students.reduce((a, s) => a + s.attendance, 0) / total);
    const risk = students.filter((s) => statusOf(s) === "at-risk").length;
    return { total, avg, att, risk };
  }, [students]);

  const subjectAvg = useMemo(
    () =>
      SUBJECTS.map((sub) => ({
        subject: sub,
        average: Math.round(students.reduce((a, s) => a + s.grades[sub], 0) / students.length),
      })),
    [students],
  );

  const filtered = useMemo(() => {
    return students.filter((s) => {
      const matchQ = s.name.toLowerCase().includes(query.toLowerCase()) || s.class.toLowerCase().includes(query.toLowerCase());
      const matchF = filter === "all" ? true : statusOf(s) === filter;
      return matchQ && matchF;
    });
  }, [query, filter, students]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Teacher Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Welcome back, Ms. Reyes — enter grades, attendance and participation to update what parents and students see.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setEntryOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <ClipboardList className="mr-1.5 h-4 w-4" /> Enter Performance
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric icon={Users} label="Total Students" value={String(stats.total)} sub="Across all classes" tone="indigo" />
        <Metric icon={TrendingUp} label="Class Average" value={`${stats.avg}%`} sub="From entered grades" tone="emerald" />
        <Metric icon={CalendarCheck} label="Attendance Rate" value={`${stats.att}%`} sub="From entered attendance" tone="amber" />
        <Metric icon={AlertTriangle} label="At-Risk Students" value={String(stats.risk)} sub="Need intervention" tone="rose" />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="border-slate-200/70 shadow-sm lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">Class Grade Trend</CardTitle>
            <CardDescription>Average performance across the academic year</CardDescription>
          </CardHeader>
          <CardContent className="h-72 pl-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={TERM_TREND} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="term" stroke="#64748b" fontSize={12} />
                <YAxis domain={[60, 100]} stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Line type="monotone" dataKey="avg" stroke="url(#lineGrad)" strokeWidth={3} dot={{ r: 5, fill: "#6366f1" }} activeDot={{ r: 7 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-200/70 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Subject Performance</CardTitle>
            <CardDescription>Average score per subject</CardDescription>
          </CardHeader>
          <CardContent className="h-72 pl-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectAvg} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="subject" stroke="#64748b" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Bar dataKey="average" radius={[8, 8, 0, 0]} fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200/70 shadow-sm">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Student Roster</CardTitle>
            <CardDescription>{filtered.length} of {students.length} students</CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or class" className="pl-8 sm:w-64" />
            </div>
            <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
              <SelectTrigger className="sm:w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="excelling">Excelling</SelectItem>
                <SelectItem value="average">Average</SelectItem>
                <SelectItem value="at-risk">At-Risk</SelectItem>
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
                  <th className="px-6 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const g = overall(s);
                  const st = statusOf(s);
                  return (
                    <tr key={s.id} className="border-b border-slate-100 transition hover:bg-slate-50">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 text-xs font-bold text-indigo-700">
                            {s.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                          </div>
                          <span className="font-medium text-slate-900">{s.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{s.class}</td>
                      <td className="px-3 py-3">
                        <span className="font-semibold text-slate-900">{g}%</span>
                        <span className="ml-1.5 text-xs text-slate-400">({letter(g)})</span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <Progress value={s.attendance} className="h-1.5 w-20" />
                          <span className="text-xs text-slate-600">{s.attendance}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-3"><StatusBadge status={st} /></td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">No students match.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <PerformanceEntryDialog open={entryOpen} onOpenChange={setEntryOpen} students={students} setStudents={setStudents} />
    </div>
  );
}

function StatusBadge({ status }: { status: ReturnType<typeof statusOf> }) {
  if (status === "excelling") return <Badge className="border-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Excelling</Badge>;
  if (status === "average") return <Badge className="border-0 bg-amber-100 text-amber-700 hover:bg-amber-100">Average</Badge>;
  return <Badge className="border-0 bg-rose-100 text-rose-700 hover:bg-rose-100">At-Risk</Badge>;
}

function PerformanceEntryDialog({
  open,
  onOpenChange,
  students,
  setStudents,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
}) {
  const [studentId, setStudentId] = useState<string>(String(students[0]?.id ?? "1"));
  const [subject, setSubject] = useState<Subject>("Math");
  const [grade, setGrade] = useState<string>("");
  const [attendance, setAttendance] = useState<string>("");
  const [participation, setParticipation] = useState<string>("");
  const [remark, setRemark] = useState<string>("");

  const current = students.find((s) => String(s.id) === studentId);

  useEffect(() => {
    if (!current) return;
    setGrade(String(current.grades[subject]));
    setAttendance(String(current.attendance));
    setParticipation(String(current.participation[subject]));
    setRemark(current.remarks[subject]);
  }, [studentId, subject, current]);

  const save = () => {
    const id = Number(studentId);
    const g = Number(grade);
    const a = Number(attendance);
    const p = Number(participation);
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
              participation: { ...s.participation, [subject]: p },
              remarks: { ...s.remarks, [subject]: remark.trim() || s.remarks[subject] },
            }
          : s,
      ),
    );
    toast.success(`Saved ${subject} performance for ${current?.name}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Enter Student Performance</DialogTitle>
          <DialogDescription>What you enter here is what students and parents will see.</DialogDescription>
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
                  {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
            <Textarea rows={3} value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Add a note for the parent and student" />
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

function StudentParentDashboard({
  role,
  students,
  selectedStudentId,
  setSelectedStudentId,
}: {
  role: Role;
  students: Student[];
  selectedStudentId: number;
  setSelectedStudentId: (id: number) => void;
}) {
  const student = students.find((s) => s.id === selectedStudentId) ?? students[0];
  const gpa = overall(student);
  const present = Math.round((student.attendance / 100) * 180);
  const absent = 180 - present;
  const avgParticipation = (
    Object.values(student.participation).reduce((a, b) => a + b, 0) / SUBJECTS.length
  ).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-indigo-600">
            {role === "parent" ? "Parent view" : "Student view"}
          </p>
          <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">
            {role === "parent" ? `${student.name}'s Progress` : `Hi, ${student.name.split(" ")[0]} 👋`}
          </h1>
          <p className="mt-1 text-sm text-slate-500">Class {student.class} · Showing what the teacher has recorded</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {role === "parent" && (
            <Select value={String(selectedStudentId)} onValueChange={(v) => setSelectedStudentId(Number(v))}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Select child" /></SelectTrigger>
              <SelectContent>
                {students.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">GPA {(gpa / 25).toFixed(2)}</Badge>
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">{student.attendance}% attendance</Badge>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/20">
          <CardContent className="p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-indigo-200">Overall Average (from teacher)</p>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-5xl font-bold tracking-tight">{gpa}%</span>
              <span className="mb-1.5 text-xl font-semibold text-indigo-200">{letter(gpa)}</span>
            </div>
            <p className="mt-2 text-sm text-indigo-100">Average of all subject grades recorded by the teacher.</p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-amber-300" style={{ width: `${gpa}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Attendance</CardTitle>
            <CardDescription>{present} present · {absent} absent (teacher-recorded)</CardDescription>
          </CardHeader>
          <CardContent className="grid place-items-center pb-6">
            <AttendanceGauge value={student.attendance} />
          </CardContent>
        </Card>

        <Card className="border-slate-200/70 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HandMetal className="h-4 w-4 text-indigo-500" /> Participation
            </CardTitle>
            <CardDescription>Average {avgParticipation} / 10 across subjects</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {SUBJECTS.map((sub) => (
              <div key={sub}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">{sub}</span>
                  <span className="text-slate-500">{student.participation[sub]} / 10</span>
                </div>
                <Progress value={student.participation[sub] * 10} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200/70 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquare className="h-4 w-4 text-indigo-500" /> Subject Breakdown & Teacher Remarks
          </CardTitle>
          <CardDescription>Grades, participation and notes recorded by the teacher</CardDescription>
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
                      <p className="mt-0.5 text-xs italic text-slate-500 line-clamp-3">"{student.remarks[sub]}"</p>
                      <p className="mt-2 text-xs text-slate-500">Participation: <span className="font-medium text-slate-700">{student.participation[sub]}/10</span></p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-2xl font-bold tracking-tight text-slate-900">{letter(score)}</p>
                      <p className="text-xs text-slate-500">{score}%</p>
                    </div>
                  </div>
                  <Progress value={score} className="mt-3 h-1.5" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Grade Trend</CardTitle>
          <CardDescription>Performance across terms</CardDescription>
        </CardHeader>
        <CardContent className="h-64 pl-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={TERM_TREND.map((t) => ({ ...t, avg: t.avg + 5 }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="term" stroke="#64748b" fontSize={12} />
              <YAxis domain={[60, 100]} stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="avg" name="Average" stroke="#10b981" strokeWidth={3} dot={{ r: 5, fill: "#10b981" }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
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
