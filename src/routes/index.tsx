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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "G-TECH AUTOMATION — Automated Student Performance Tracker" },
      { name: "description", content: "Modern dashboard for teachers, students and parents to track grades, attendance and progress in real time." },
      { property: "og:title", content: "G-TECH AUTOMATION — Student Performance Tracker" },
      { property: "og:description", content: "Real-time analytics for teachers, students and parents." },
    ],
  }),
  component: App,
});

type Role = "teacher" | "student" | "parent";

const SUBJECTS = ["Math", "Science", "English", "History"] as const;

const STUDENTS = [
  { id: 1, name: "Amara Okafor", class: "10-A", grades: { Math: 94, Science: 91, English: 88, History: 90 }, attendance: 97, remarks: { Math: "Outstanding problem-solver.", Science: "Engaged in every lab.", English: "Strong essays.", History: "Insightful analysis." } },
  { id: 2, name: "Liam Chen", class: "10-A", grades: { Math: 76, Science: 82, English: 79, History: 74 }, attendance: 91, remarks: { Math: "Improving steadily.", Science: "Solid effort.", English: "Watch grammar.", History: "Needs deeper reading." } },
  { id: 3, name: "Sofia Martinez", class: "10-B", grades: { Math: 68, Science: 72, English: 81, History: 70 }, attendance: 83, remarks: { Math: "Schedule tutoring.", Science: "Catch up on labs.", English: "Creative writer.", History: "Missing homework." } },
  { id: 4, name: "Noah Patel", class: "10-B", grades: { Math: 88, Science: 85, English: 92, History: 87 }, attendance: 95, remarks: { Math: "Sharp logic.", Science: "Great curiosity.", English: "Eloquent voice.", History: "Excellent essays." } },
  { id: 5, name: "Zara Ahmed", class: "10-A", grades: { Math: 58, Science: 64, English: 70, History: 62 }, attendance: 78, remarks: { Math: "Urgent support needed.", Science: "Struggling with concepts.", English: "Reading practice.", History: "Falling behind." } },
  { id: 6, name: "Ethan Brooks", class: "10-B", grades: { Math: 84, Science: 80, English: 86, History: 83 }, attendance: 93, remarks: { Math: "Consistent.", Science: "Reliable.", English: "Strong reader.", History: "Good notes." } },
];

const TERM_TREND = [
  { term: "Term 1", avg: 78 },
  { term: "Term 2", avg: 81 },
  { term: "Midterm", avg: 83 },
  { term: "Finals", avg: 86 },
];

function overall(s: typeof STUDENTS[number]) {
  const v = Object.values(s.grades);
  return Math.round(v.reduce((a, b) => a + b, 0) / v.length);
}

function statusOf(s: typeof STUDENTS[number]) {
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
  const [role, setRole] = useState<Role | null>(null);

  if (!role) return <Landing onPick={setRole} />;
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <NavBar role={role} setRole={setRole} />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {role === "teacher" ? <TeacherDashboard /> : <StudentParentDashboard role={role} />}
      </main>
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
            Automated Student Performance Tracker
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            <span className="bg-gradient-to-r from-white via-indigo-200 to-emerald-200 bg-clip-text text-transparent">
              G-TECH AUTOMATION
            </span>
          </h1>
          <p className="mt-4 text-base text-slate-300 sm:text-lg">
            Real-time grades, attendance, and AI-powered insights for everyone in the classroom.
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

function NavBar({ role, setRole }: { role: Role; setRole: (r: Role | null) => void }) {
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

        <Tabs value={role} onValueChange={(v) => setRole(v as Role)} className="hidden sm:block">
          <TabsList className="bg-slate-100">
            <TabsTrigger value="teacher">Teacher</TabsTrigger>
            <TabsTrigger value="student">Student</TabsTrigger>
            <TabsTrigger value="parent">Parent</TabsTrigger>
          </TabsList>
        </Tabs>

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

function TeacherDashboard() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "excelling" | "average" | "at-risk">("all");
  const [gradeOpen, setGradeOpen] = useState(false);

  const stats = useMemo(() => {
    const total = STUDENTS.length;
    const avg = Math.round(STUDENTS.reduce((a, s) => a + overall(s), 0) / total);
    const att = Math.round(STUDENTS.reduce((a, s) => a + s.attendance, 0) / total);
    const risk = STUDENTS.filter((s) => statusOf(s) === "at-risk").length;
    return { total, avg, att, risk };
  }, []);

  const subjectAvg = useMemo(
    () =>
      SUBJECTS.map((sub) => ({
        subject: sub,
        average: Math.round(STUDENTS.reduce((a, s) => a + s.grades[sub], 0) / STUDENTS.length),
      })),
    [],
  );

  const filtered = useMemo(() => {
    return STUDENTS.filter((s) => {
      const matchQ = s.name.toLowerCase().includes(query.toLowerCase()) || s.class.toLowerCase().includes(query.toLowerCase());
      const matchF = filter === "all" ? true : statusOf(s) === filter;
      return matchQ && matchF;
    });
  }, [query, filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Teacher Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Welcome back, Ms. Reyes — here's how your classes are doing.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => toast.success("New student form opened")} className="bg-indigo-600 hover:bg-indigo-700">
            <UserPlus className="mr-1.5 h-4 w-4" /> Add Student
          </Button>
          <Button onClick={() => setGradeOpen(true)} variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">
            <ClipboardList className="mr-1.5 h-4 w-4" /> Bulk Input Grades
          </Button>
          <Button onClick={() => toast.success("Attendance marked")} variant="outline" className="border-emerald-200 text-emerald-700 hover:bg-emerald-50">
            <CheckSquare className="mr-1.5 h-4 w-4" /> Mark Attendance
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric icon={Users} label="Total Students" value={String(stats.total)} sub="Across all classes" tone="indigo" />
        <Metric icon={TrendingUp} label="Class Average" value={`${stats.avg}%`} sub="↑ 3% vs last term" tone="emerald" />
        <Metric icon={CalendarCheck} label="Attendance Rate" value={`${stats.att}%`} sub="Past 30 days" tone="amber" />
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
            <CardDescription>{filtered.length} of {STUDENTS.length} students</CardDescription>
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

      <GradeFormDialog open={gradeOpen} onOpenChange={setGradeOpen} />
    </div>
  );
}

function StatusBadge({ status }: { status: ReturnType<typeof statusOf> }) {
  if (status === "excelling") return <Badge className="border-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Excelling</Badge>;
  if (status === "average") return <Badge className="border-0 bg-amber-100 text-amber-700 hover:bg-amber-100">Average</Badge>;
  return <Badge className="border-0 bg-rose-100 text-rose-700 hover:bg-rose-100">At-Risk</Badge>;
}

function GradeFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [studentId, setStudentId] = useState<string>("1");
  const [subject, setSubject] = useState<string>("Math");
  const [type, setType] = useState<string>("Assignment");
  const [score, setScore] = useState<string>("");
  const [weight, setWeight] = useState<string>("10");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Input Grade</DialogTitle>
          <DialogDescription>Record a new graded item for a student.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <Label>Student</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STUDENTS.map((s) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Subject</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Assignment Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Assignment">Assignment</SelectItem>
                  <SelectItem value="Quiz">Quiz</SelectItem>
                  <SelectItem value="Exam">Exam</SelectItem>
                  <SelectItem value="Project">Project</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Weight (%)</Label>
              <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Score (0–100)</Label>
            <Input type="number" value={score} onChange={(e) => setScore(e.target.value)} placeholder="e.g. 87" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={() => {
              if (!score) return toast.error("Enter a score");
              const s = STUDENTS.find((x) => x.id === Number(studentId));
              toast.success(`Saved ${type} (${score}%) for ${s?.name} — ${subject}`);
              onOpenChange(false);
              setScore("");
            }}
          >Save Grade</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StudentParentDashboard({ role }: { role: Role }) {
  // Pick a student to view
  const student = STUDENTS[0];
  const gpa = overall(student);
  const present = Math.round((student.attendance / 100) * 180);
  const absent = 180 - present;

  const insights = [
    { tone: "emerald", icon: TrendingUp, text: `Great job! Your Math grade improved by 5% this week.` },
    { tone: "amber", icon: AlertTriangle, text: `Heads up: Your Science attendance is close to dropping below 85%.` },
    { tone: "indigo", icon: Sparkles, text: `You're in the top 10% of your class for English this term.` },
  ];

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
          <p className="mt-1 text-sm text-slate-500">Class {student.class} · Spring Term</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="border-indigo-200 bg-indigo-50 text-indigo-700">GPA {(gpa / 25).toFixed(2)}</Badge>
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">{student.attendance}% attendance</Badge>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-lg shadow-indigo-500/20">
          <CardContent className="p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-indigo-200">Overall Average</p>
            <div className="mt-3 flex items-end gap-2">
              <span className="text-5xl font-bold tracking-tight">{gpa}%</span>
              <span className="mb-1.5 text-xl font-semibold text-indigo-200">{letter(gpa)}</span>
            </div>
            <p className="mt-2 text-sm text-indigo-100">↑ 3% from last term — keep it up!</p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-amber-300" style={{ width: `${gpa}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Attendance</CardTitle>
            <CardDescription>{present} present · {absent} absent</CardDescription>
          </CardHeader>
          <CardContent className="grid place-items-center pb-6">
            <AttendanceGauge value={student.attendance} />
          </CardContent>
        </Card>

        <Card className="border-slate-200/70 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-indigo-500" /> AI Insights
            </CardTitle>
            <CardDescription>Automated feedback for this week</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {insights.map((i, idx) => {
              const tones: Record<string, string> = {
                emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
                amber: "bg-amber-50 text-amber-800 border-amber-100",
                indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
              };
              return (
                <div key={idx} className={`flex items-start gap-2.5 rounded-lg border p-3 text-sm ${tones[i.tone]}`}>
                  <i.icon className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{i.text}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Subject Breakdown</CardTitle>
          <CardDescription>Grades, progress and teacher remarks</CardDescription>
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
                      <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">"{student.remarks[sub]}"</p>
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
          <CardDescription>Your performance across terms</CardDescription>
        </CardHeader>
        <CardContent className="h-64 pl-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={TERM_TREND.map((t) => ({ ...t, avg: t.avg + 5 }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="term" stroke="#64748b" fontSize={12} />
              <YAxis domain={[60, 100]} stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="avg" name="Your average" stroke="#10b981" strokeWidth={3} dot={{ r: 5, fill: "#10b981" }} />
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
