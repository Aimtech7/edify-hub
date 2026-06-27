import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthShell } from "@/components/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { apiClient } from "@/services/api-client";

export default function SignupParentPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    student_admission: "DA-2024-1042",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.email || !formData.password) {
      toast.error("Please fill in all required fields.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await apiClient.post("/auth/signup/parent/", {
        first_name: formData.first_name,
        last_name: formData.last_name,
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        student_admission: formData.student_admission,
      });
      toast.success("Account created successfully! You can now sign in.");
      navigate("/login/parent");
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.response?.data?.username?.[0] || err.response?.data?.email?.[0] || "Failed to create account.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Parent / Guardian Registration"
      subtitle="Create your parent portal account to monitor your child's language journey and fee ledgers."
      footer={<>Already have an account? <Link to="/login/parent" className="text-primary font-medium hover:underline">Sign in</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="first_name">First Name</Label>
            <Input id="first_name" value={formData.first_name} onChange={handleChange} placeholder="David" required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="last_name">Last Name</Label>
            <Input id="last_name" value={formData.last_name} onChange={handleChange} placeholder="Wanjiru" required />
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="username">Username *</Label>
          <Input id="username" value={formData.username} onChange={handleChange} placeholder="e.g. dwanjiru2" required />
        </div>

        <div className="space-y-1">
          <Label htmlFor="email">Email Address *</Label>
          <Input id="email" type="email" value={formData.email} onChange={handleChange} placeholder="parent@example.com" required />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" value={formData.phone} onChange={handleChange} placeholder="+254700000000" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="student_admission">Student Admission No.</Label>
            <Input id="student_admission" value={formData.student_admission} onChange={handleChange} placeholder="DA-2024-1042" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="password">Password *</Label>
            <PasswordInput id="password" value={formData.password} onChange={handleChange} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <PasswordInput id="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground mt-2">
          {loading ? "Creating Account..." : "Register Parent Account"}
        </Button>
      </form>
    </AuthShell>
  );
}
