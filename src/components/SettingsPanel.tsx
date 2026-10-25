import { useEffect, useState } from "react";
import {
  User,
  ShieldCheck,
  BellRing,
  KeyRound,
  Info,
  LifeBuoy,
  Mail,
  School,
  BadgeCheck,
  Lock,
  Database,
  Eye,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { notify } from "@/lib/notifications";
import { toast } from "sonner";

export type NotificationPrefs = {
  gradeUpdates: boolean;
  attendanceAlerts: boolean;
  atRiskAlerts: boolean;
  termReminders: boolean;
  emailDigest: boolean;
};

const PREFS_KEY = "gtech.notification-prefs.v1";
export const DEFAULT_PREFS: NotificationPrefs = {
  gradeUpdates: true,
  attendanceAlerts: true,
  atRiskAlerts: true,
  termReminders: true,
  emailDigest: false,
};

export function loadPrefs(): NotificationPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    return raw ? { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<NotificationPrefs>) } : DEFAULT_PREFS;
  } catch {
    return DEFAULT_PREFS;
  }
}

function savePrefs(p: NotificationPrefs) {
  try {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

type SettingsProfile = {
  fullName: string;
  email: string;
  school: string;
  role: string;
  studentId?: number | null;
};

export type SettingsTab = "profile" | "security" | "privacy" | "notifications" | "about";

export function SettingsPanel({
  open,
  onOpenChange,
  profile,
  onProfileSaved,
  tab,
  onTabChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  profile: SettingsProfile;
  onProfileSaved?: (fullName: string, school: string) => void;
  tab?: SettingsTab;
  onTabChange?: (t: SettingsTab) => void;
}) {
  const [fullName, setFullName] = useState(profile.fullName);
  const [school, setSchool] = useState(profile.school);
  const [savingProfile, setSavingProfile] = useState(false);


  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);

  useEffect(() => {
    if (open) {
      setFullName(profile.fullName);
      setSchool(profile.school);
      setPrefs(loadPrefs());
    }
  }, [open, profile.fullName, profile.school]);

  const setPref = (key: keyof NotificationPrefs, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    savePrefs(next);
    notify({
      title: "Notification preference updated",
      body: `${PREF_LABELS[key]} is now ${value ? "on" : "off"}.`,
      kind: "info",
      toast: false,
    });
  };

  const saveProfile = async () => {
    if (fullName.trim().length < 2) {
      toast.error("Please enter your full name.");
      return;
    }
    setSavingProfile(true);
    onProfileSaved?.(fullName.trim(), school.trim());
    notify({
      title: "Demo profile updated",
      body: "This change only affects the current local demo session.",
      kind: "info",
    });
    setSavingProfile(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b border-slate-200 px-6 py-4 text-left">
          <DialogTitle className="text-slate-900">Settings</DialogTitle>
          <DialogDescription>Manage this browser&apos;s local demo profile and preferences.</DialogDescription>
        </DialogHeader>

        <Tabs value={tab ?? "profile"} onValueChange={(v) => onTabChange?.(v as SettingsTab)} className="flex flex-col">
          <div className="border-b border-slate-200 px-4 py-3">
            <TabsList className="flex w-full flex-wrap gap-1 bg-slate-100">
              <TabsTrigger value="profile" className="gap-1.5 text-xs sm:text-sm"><User className="h-3.5 w-3.5" /> Profile</TabsTrigger>
              <TabsTrigger value="security" className="gap-1.5 text-xs sm:text-sm"><KeyRound className="h-3.5 w-3.5" /> Security</TabsTrigger>
              <TabsTrigger value="privacy" className="gap-1.5 text-xs sm:text-sm"><ShieldCheck className="h-3.5 w-3.5" /> Privacy</TabsTrigger>
              <TabsTrigger value="notifications" className="gap-1.5 text-xs sm:text-sm"><BellRing className="h-3.5 w-3.5" /> Alerts</TabsTrigger>
              <TabsTrigger value="about" className="gap-1.5 text-xs sm:text-sm"><Info className="h-3.5 w-3.5" /> About</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="max-h-[60vh]">
            <div className="px-6 py-5">
              <TabsContent value="profile" className="mt-0 space-y-5">
                <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 text-lg font-bold text-white">
                    {(profile.fullName || profile.email || "U").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-slate-900">{profile.fullName || "Unnamed user"}</p>
                    <p className="truncate text-sm text-slate-500">{profile.email || "No email on file"}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <Badge variant="secondary" className="capitalize"><BadgeCheck className="mr-1 h-3 w-3" />{profile.role}</Badge>
                      {profile.studentId != null && <Badge variant="outline">Student #{profile.studentId}</Badge>}
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="set-name">Full name</Label>
                    <Input id="set-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="set-school">School name</Label>
                    <Input id="set-school" value={school} onChange={(e) => setSchool(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="set-email" className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Email</Label>
                    <Input id="set-email" value={profile.email} readOnly className="bg-slate-50 text-slate-500" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="flex items-center gap-1.5"><School className="h-3.5 w-3.5" /> Role</Label>
                    <Input value={profile.role} readOnly className="bg-slate-50 capitalize text-slate-500" />
                  </div>
                </div>
                <p className="text-xs text-slate-500">
                  This is a temporary local demo profile. Changes are not sent to a school account or shared with other users.
                </p>
                <Button onClick={saveProfile} disabled={savingProfile}>{savingProfile ? "Saving…" : "Save changes"}</Button>
              </TabsContent>

              <TabsContent value="security" className="mt-0 space-y-5">
                <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  <p className="flex items-center gap-2 font-semibold"><Lock className="h-4 w-4" /> Authentication is unavailable</p>
                  <p>This local demo does not have accounts, password storage, password changes, or secure sessions. Do not enter a real password.</p>
                </div>
              </TabsContent>

              <TabsContent value="privacy" className="mt-0 space-y-4">
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-900"><ShieldCheck className="h-4 w-4" /> How your data is protected</p>
                  <ul className="mt-3 space-y-2 text-sm text-slate-600">
                    <li className="flex gap-2"><Database className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" /> Demo grades and workspace edits are stored in this browser&apos;s local storage and are not uploaded to a school database.</li>
                    <li className="flex gap-2"><Eye className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" /> Demo roles are selectable and do not restrict access. This is not suitable for private student records.</li>
                    <li className="flex gap-2"><Lock className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" /> The application has no authentication or account password handling.</li>
                    <li className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" /> Local demo data can be viewed by anyone using this browser profile.</li>
                  </ul>
                </div>
                <Separator />
                <div className="space-y-2 text-sm text-slate-600">
                  <p className="font-semibold text-slate-900">Your rights</p>
                  <p>Demo data is stored in this browser and can be cleared using your browser&apos;s site-data controls. There is no online account or school data service connected.</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                  Do not enter real student information. Local demo records are not official school records and are not protected by account access controls.
                </div>
              </TabsContent>

              <TabsContent value="notifications" className="mt-0 space-y-2">
                {(Object.keys(DEFAULT_PREFS) as (keyof NotificationPrefs)[]).map((key) => (
                  <div key={key} className="flex items-start justify-between gap-4 rounded-lg border border-slate-200 p-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{PREF_LABELS[key]}</p>
                      <p className="text-xs text-slate-500">{PREF_HINTS[key]}</p>
                    </div>
                    <Switch checked={prefs[key]} onCheckedChange={(v) => setPref(key, v)} />
                  </div>
                ))}
                <p className="pt-2 text-xs text-slate-500">
                  Preferences are stored locally. Email notifications are not sent in this demo.
                </p>
              </TabsContent>

              <TabsContent value="about" className="mt-0 space-y-4">
                <div className="rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-slate-900">GODDY MONTESSORI SCHOOL</p>
                  <p className="text-xs text-slate-500">Student Performance Tracker · Version 1.0</p>
                  <p className="mt-3 text-sm text-slate-600">
                    A performance tracking platform built for Ghanaian Primary and JHS schools, following the Ghana Education Service structure: Basic 1–6 and JHS 1–3, three terms per academic year, and dual class-score / exam-score assessment with terminal report cards.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 p-3 text-sm">
                    <p className="font-medium text-slate-900">What teachers can do</p>
                    <p className="mt-1 text-xs text-slate-500">Preview grade, attendance, participation and remark entry. Data remains in this browser.</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 p-3 text-sm">
                    <p className="font-medium text-slate-900">What families see</p>
                    <p className="mt-1 text-xs text-slate-500">Preview subject performance, attendance summaries, teacher remarks and terminal report cards from local browser data.</p>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
                  <p className="flex items-center gap-2 font-semibold text-slate-900"><LifeBuoy className="h-4 w-4" /> Help &amp; support</p>
                  <p className="mt-2">This is a local demonstration only. Secure sign-in, account registration, and shared school records require a real backend and are unavailable.</p>
                  <p className="mt-1">Changes are stored only in this browser and may be cleared by the browser.</p>
                </div>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

const PREF_LABELS: Record<keyof NotificationPrefs, string> = {
  gradeUpdates: "Grade updates",
  attendanceAlerts: "Attendance alerts",
  atRiskAlerts: "At-risk student alerts",
  termReminders: "Term & report reminders",
  emailDigest: "Email digest (not sent in demo)",
};

const PREF_HINTS: Record<keyof NotificationPrefs, string> = {
  gradeUpdates: "Get notified whenever scores or remarks are saved.",
  attendanceAlerts: "Alerts when attendance drops below the school threshold.",
  atRiskAlerts: "Flags students who need academic or attendance support.",
  termReminders: "Reminders about the active term and report card deadlines.",
  emailDigest: "Email delivery is unavailable in this local demo.",
};
