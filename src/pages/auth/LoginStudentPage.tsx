import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

export default function LoginStudentPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [adm, setAdm] = useState("ADM-2024-1042");
  const [pw, setPw] = useState("student");

  return (
    <AuthShell
      title="Student sign in"
      subtitle="Use your admission number and password to access results, fees and receipts."
      footer={<>Staff? <Link to="/login/staff" className="text-primary font-medium">Staff login</Link> · <Link to="/login/admin" className="text-primary font-medium">Admin</Link></>}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!adm || !pw) { toast.error("Enter your credentials"); return; }
          await login("student", { username: adm, password: pw });
          toast.success("Welcome back!");
          navigate("/app/dashboard");
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
