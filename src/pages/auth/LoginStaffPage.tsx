import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/contexts/auth-context";
import type { Role } from "@/types";
import { toast } from "sonner";

export default function LoginStaffPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [u, setU] = useState("amueller");
  const [pw, setPw] = useState("staff");
  const [role, setRole] = useState<Role>("teacher");

  return (
    <AuthShell
      title="Staff sign in"
      subtitle="Instructors and accountants — pick your role to continue."
      footer={<>Are you a student? <Link to="/login/student" className="text-primary font-medium">Student login</Link></>}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!u || !pw) { toast.error("Enter your credentials"); return; }
          await login(role, { username: u, password: pw });
          toast.success(`Signed in as ${role}`);
          navigate("/app/dashboard");
        }}
        className="space-y-5"
      >
        <div className="space-y-1.5">
          <Label>Role</Label>
          <RadioGroup value={role} onValueChange={(v) => setRole(v as Role)} className="grid grid-cols-2 gap-2">
            {(["teacher", "accountant"] as Role[]).map((r) => (
              <label key={r} className={`cursor-pointer border rounded-lg p-3 text-sm flex items-center gap-2 ${role === r ? "border-primary bg-primary/5" : "border-border"}`}>
                <RadioGroupItem value={r} id={r} />
                <span className="capitalize">{r === "teacher" ? "Instructor" : r}</span>
              </label>
            ))}
          </RadioGroup>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="u">Username</Label>
          <Input id="u" value={u} onChange={(e) => setU(e.target.value)} />
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
