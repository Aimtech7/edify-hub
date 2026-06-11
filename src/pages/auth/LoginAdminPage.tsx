import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function LoginAdminPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [u, setU] = useState("admin");
  const [pw, setPw] = useState("admin");

  return (
    <AuthShell
      title="Administrator sign in"
      subtitle="Restricted area. Activity is monitored and audited."
      footer={<Link to="/login/staff" className="text-primary font-medium">Back to staff login</Link>}
    >
      <div className="mb-5 flex items-center gap-3 p-3 rounded-lg border border-warning/40 bg-warning/10 text-warning-foreground text-sm">
        <ShieldCheck className="size-4 text-warning" />
        <span>Two-factor authentication is required after login.</span>
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!u || !pw) { toast.error("Enter your credentials"); return; }
          await login("admin", { username: u, password: pw });
          toast.success("Welcome, Administrator");
          navigate("/app/dashboard");
        }}
        className="space-y-4"
      >
        <div className="space-y-1.5">
          <Label htmlFor="u">Admin Username</Label>
          <Input id="u" value={u} onChange={(e) => setU(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pw">Password</Label>
          <Input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} />
        </div>
        <Button type="submit" className="w-full gradient-primary text-primary-foreground">Continue</Button>
      </form>
    </AuthShell>
  );
}
