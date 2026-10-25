import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { GraduationCap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Password Recovery Unavailable — GODDY MONTESSORI SCHOOL" },
      { name: "description", content: "Password recovery is disabled for shared demo accounts." },
    ],
  }),
  component: ResetPasswordRoute,
});

function ResetPasswordRoute() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 px-4 py-12 text-white">
      <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold">Password recovery</h1>
          <p className="mt-2 text-sm text-white/70">GODDY MONTESSORI SCHOOL · Student Performance Tracker</p>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl text-slate-900">Unavailable in demo</CardTitle>
            <CardDescription>Demo accounts use a shared, pre-provisioned password.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="flex gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              <ShieldCheck className="h-5 w-5 shrink-0" />
              Password recovery is disabled for shared demo accounts. Contact the project administrator if a demo credential needs to be reset.
            </p>
            <Button className="w-full" onClick={() => void navigate({ to: "/" })}>Back to demo</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
