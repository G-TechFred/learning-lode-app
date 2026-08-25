import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GraduationCap, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/external-supabase/client";
import { updatePassword } from "@/lib/gtech-auth";
import { notify } from "@/lib/notifications";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset Password — GODDY MONTESSORI SCHOOL" },
      { name: "description", content: "Set a new password for your GODDY MONTESSORI SCHOOL student performance tracker account." },
      { property: "og:title", content: "Reset Password — GODDY MONTESSORI SCHOOL" },
      { property: "og:description", content: "Securely choose a new password for your school account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPasswordRoute,
});

function issuesFor(pw: string) {
  const issues: string[] = [];
  if (pw.length < 10) issues.push("At least 10 characters");
  if (pw.length > 15) issues.push("No more than 15 characters");
  if (!/[!@#$%^&*()_\-+=[\]{};:'",.<>/?\\|`~]/.test(pw)) issues.push("Include a special character");
  return issues;
}

function ResetPasswordRoute() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setHasSession(!!session);
      setReady(true);
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setHasSession(!!data.session);
      setReady(true);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const issues = issuesFor(pw);
  const canSubmit = pw.length > 0 && issues.length === 0 && pw === pw2 && !saving;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) {
      toast.error(issues[0] ?? "Passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      await updatePassword(pw);
      notify({
        title: "Password reset complete",
        body: "You can now sign in with your new password.",
        kind: "success",
        hint: "Keep your password private — the school will never ask for it.",
      });
      await supabase.auth.signOut();
      void navigate({ to: "/" });
    } catch (err) {
      notify({ title: "Password reset failed", body: err instanceof Error ? err.message : "Please try again.", kind: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 px-4 py-12 text-white">
      <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold">Create a new password</h1>
          <p className="mt-2 text-sm text-white/70">GODDY MONTESSORI SCHOOL · Student Performance Tracker</p>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl text-slate-900">Reset Password</CardTitle>
            <CardDescription>10–15 characters, including at least one special character.</CardDescription>
          </CardHeader>
          <CardContent>
            {!ready ? (
              <p className="py-6 text-center text-sm text-slate-500">Verifying your reset link…</p>
            ) : !hasSession ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                  This reset link is invalid or has expired. Request a new link from the sign-in screen.
                </div>
                <Button className="w-full" onClick={() => void navigate({ to: "/" })}>Back to sign in</Button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="rp-pw" className="text-slate-700">New password</Label>
                  <div className="relative">
                    <Input id="rp-pw" type={show ? "text" : "password"} maxLength={15} value={pw} onChange={(e) => setPw(e.target.value.slice(0, 15))} className="pr-16" />
                    <button type="button" onClick={() => setShow((v) => !v)} className="absolute inset-y-0 right-2 my-auto h-7 rounded px-2 text-xs font-medium text-slate-500 hover:bg-slate-100">
                      {show ? "Hide" : "Show"}
                    </button>
                  </div>
                  {pw.length > 0 && issues.length > 0 && (
                    <ul className="space-y-0.5 pt-1 text-xs text-rose-600">
                      {issues.map((i) => <li key={i}>• {i}</li>)}
                    </ul>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rp-pw2" className="text-slate-700">Confirm password</Label>
                  <Input id="rp-pw2" type={show ? "text" : "password"} maxLength={15} value={pw2} onChange={(e) => setPw2(e.target.value.slice(0, 15))} />
                  {pw2 && pw !== pw2 && <p className="text-xs text-rose-600">Passwords do not match</p>}
                </div>
                <Button type="submit" disabled={!canSubmit} className="w-full">{saving ? "Updating…" : "Reset password"}</Button>
                <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                  <ShieldCheck className="h-3.5 w-3.5" /> Your password is encrypted and never visible to the school.
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
