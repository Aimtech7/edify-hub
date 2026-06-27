import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

export default function LoginStudentPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [adm, setAdm] = useState("DA-2024-1042");
  const [pw, setPw] = useState("student");

  return (
    <AuthShell
      title="Student sign in"
      subtitle="Use your student number and password to access your results, fees and CEFR progress."
      footer={<>Parent? <Link to="/login/parent" className="text-primary font-medium">Parent login</Link> · Staff? <Link to="/login/staff" className="text-primary font-medium">Staff login</Link> · <Link to="/login/admin" className="text-primary font-medium">Admin</Link></>}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!adm || !pw) { toast.error("Enter your credentials"); return; }
          try {
            await login("student", { username: adm, password: pw });
            toast.success("Welcome back!");
            navigate("/app/dashboard");
          } catch (err: any) {
            const errorMsg = err.response?.data?.detail || "Invalid username or password";
            toast.error(errorMsg);
          }
        }}
        className="space-y-4"
      >
        <div className="space-y-1.5">
          <Label htmlFor="adm">Student Number</Label>
          <Input id="adm" value={adm} onChange={(e) => setAdm(e.target.value)} placeholder="DA-2024-1042" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pw">Password</Label>
          <PasswordInput id="pw" value={pw} onChange={(e) => setPw(e.target.value)} />
        </div>
        <div className="flex items-center justify-between text-sm">
          <Link to="/forgot-password" className="text-primary hover:underline">Forgot password?</Link>
        </div>
        <Button type="submit" className="w-full gradient-primary text-primary-foreground">Sign in</Button>
      </form>
    </AuthShell>
  );
}
