import { Link } from "react-router-dom";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      subtitle="We'll send a reset link to your registered email."
      footer={<Link to="/login/student" className="text-primary">Back to sign in</Link>}
    >
      <form onSubmit={(e) => { e.preventDefault(); toast.success("Reset link sent if the account exists."); }} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="e">Email or Username</Label>
          <Input id="e" placeholder="you@horizon.edu" />
        </div>
        <Button className="w-full gradient-primary text-primary-foreground">Send reset link</Button>
      </form>
    </AuthShell>
  );
}
