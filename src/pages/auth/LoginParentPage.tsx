import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

export default function LoginParentPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [u, setU] = useState("dwanjiru");
  const [pw, setPw] = useState("parent");

  return (
    <AuthShell
      title="Parent / Guardian sign in"
      subtitle="Access real-time CEFR language progress, attendance records, and fee balances for your enrolled children."
      footer={<>Student? <Link to="/login/student" className="text-primary font-medium">Student login</Link> · <Link to="/login/staff" className="text-primary font-medium">Staff</Link></>}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!u || !pw) { toast.error("Enter your credentials"); return; }
          try {
            await login("parent", { username: u, password: pw });
            toast.success("Welcome to Parent Portal!");
            navigate("/app/dashboard");
          } catch (err: any) {
            const errorMsg = err.response?.data?.detail || "Invalid username or password";
            toast.error(errorMsg);
          }
        }}
        className="space-y-4"
      >
        <div className="space-y-1.5">
          <Label htmlFor="u">Email or Phone or Username</Label>
          <Input id="u" value={u} onChange={(e) => setU(e.target.value)} placeholder="e.g. david.wanjiru@gmail.com or dwanjiru" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pw">Password</Label>
          <Input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
        </div>
        <div className="flex items-center justify-between text-sm">
          <Link to="/forgot-password" className="text-primary hover:underline">Forgot password?</Link>
        </div>
        <Button type="submit" className="w-full gradient-primary text-primary-foreground">Sign in to Portal</Button>
      </form>
    </AuthShell>
  );
}
