import { Link } from "react-router-dom";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ChangePasswordPage() {
  return (
    <AuthShell
      title="Change password"
      subtitle="Choose a strong password you haven't used elsewhere."
      footer={<Link to="/app/dashboard" className="text-primary">Back to dashboard</Link>}
    >
      <form onSubmit={(e) => { e.preventDefault(); toast.success("Password updated"); }} className="space-y-4">
        <div className="space-y-1.5"><Label htmlFor="c">Current password</Label><Input id="c" type="password" /></div>
        <div className="space-y-1.5"><Label htmlFor="n">New password</Label><Input id="n" type="password" /></div>
        <div className="space-y-1.5"><Label htmlFor="r">Confirm new password</Label><Input id="r" type="password" /></div>
        <Button className="w-full gradient-primary text-primary-foreground">Update password</Button>
      </form>
    </AuthShell>
  );
}
