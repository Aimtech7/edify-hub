import { PageHeader } from "@/components/ui-bits";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { GraduationCap, Users, Wallet, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const ROLES = [
  { key: "student", label: "Student", icon: GraduationCap, desc: "View results, fees and receipts.", count: 4218 },
  { key: "teacher", label: "Teacher", icon: Users, desc: "Manage marks, attendance and class reports.", count: 184 },
  { key: "accountant", label: "Accountant", icon: Wallet, desc: "Record payments and issue receipts.", count: 6 },
  { key: "admin", label: "Administrator", icon: ShieldCheck, desc: "Full system access and audit.", count: 3 },
];

const PERMISSIONS = [
  "view_own_results", "view_own_fees",
  "record_attendance", "enter_marks", "publish_results",
  "record_payment", "issue_receipt", "manage_allocations",
  "manage_users", "manage_roles", "view_audit_logs",
];

function defaultPerm(p: string, role: string): boolean {
  if (role === "admin") return true;
  if (role === "student") return p === "view_own_results" || p === "view_own_fees";
  if (role === "teacher") return p === "record_attendance" || p === "enter_marks" || p === "publish_results";
  if (role === "accountant") return p === "record_payment" || p === "issue_receipt" || p === "manage_allocations";
  return false;
}

export default function RolesPage() {
  return (
    <>
      <PageHeader title="Role Management" description="Roles and permissions across the platform." />
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {ROLES.map((r) => (
          <Card key={r.key} className="shadow-card">
            <CardContent className="p-5">
              <div className="size-10 rounded-lg gradient-primary grid place-items-center text-primary-foreground mb-3"><r.icon className="size-5" /></div>
              <div className="font-semibold">{r.label}</div>
              <div className="text-xs text-muted-foreground">{r.desc}</div>
              <div className="mt-3 text-xs text-muted-foreground">{r.count.toLocaleString()} users</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Permissions matrix</h3>
            <Button variant="outline" onClick={() => toast.success("Permissions saved")}>Save changes</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-xs text-muted-foreground">
                <th className="text-left py-2">Permission</th>
                {ROLES.map((r) => <th key={r.key} className="px-2 py-2 text-center">{r.label}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-border">
                {PERMISSIONS.map((p) => (
                  <tr key={p}>
                    <td className="py-2 font-mono text-xs">{p}</td>
                    {ROLES.map((r) => (
                      <td key={r.key} className="px-2 py-2 text-center">
                        <Checkbox defaultChecked={defaultPerm(p, r.key)} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
