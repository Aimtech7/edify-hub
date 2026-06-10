import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAs } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/login/student")({
  head: () => ({ meta: [{ title: "Student Login — Horizon Academy" }] }),
  component: StudentLogin,
});

function StudentLogin() {
  const nav = useNavigate();
  const [adm, setAdm] = useState("ADM-2024-1042");
  const [pw, setPw] = useState("student");

  return (
    <AuthShell
      title="Student sign in"
      subtitle="Use your admission number and password to access results, fees and receipts."
      footer={<>Staff? <Link to="/login/staff" className="text-primary font-medium">Staff login</Link> · <Link to="/login/admin" className="text-primary font-medium">Admin</Link></>}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!adm || !pw) { toast.error("Enter your credentials"); return; }
          loginAs("student", adm);
          toast.success("Welcome back!");
          nav({ to: "/app/dashboard" });
        }}
        className="space-y-4"
      >
        <div className="space-y-1.5">
          <Label htmlFor="adm">Admission Number</Label>
          <Input id="adm" value={adm} onChange={(e) => setAdm(e.target.value)} placeholder="ADM-2024-1042" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pw">Password</Label>
          <Input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
        </div>
        <div className="flex items-center justify-between text-sm">
          <Link to="/forgot-password" className="text-primary hover:underline">Forgot password?</Link>
        </div>
        <Button type="submit" className="w-full gradient-primary text-primary-foreground">Sign in</Button>
      </form>
    </AuthShell>
  );
}
