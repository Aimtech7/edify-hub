import { useCurrentUser } from "@/components/app-shell";
import { PageHeader, StatCard } from "@/components/ui-bits";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ANNOUNCEMENTS, RECEIPTS, STUDENTS, STUDENT_RESULTS, TEACHER_CLASSES, currency,
} from "@/lib/sample-data";
import {
  Wallet, Receipt, TrendingUp, Clock, GraduationCap, Users, AlertTriangle, ClipboardList,
  Calendar, FileBarChart2, Activity, ShieldAlert, Database,
} from "lucide-react";

export default function DashboardPage() {
  const user = useCurrentUser();
  if (!user) return null;
  if (user.role === "student") return <StudentDash />;
  if (user.role === "teacher") return <TeacherDash />;
  if (user.role === "accountant") return <AccountantDash />;
  return <AdminDash />;
}

function StudentDash() {
  const user = useCurrentUser()!;
  const me = STUDENTS.find((s) => s.admissionNo === user.admissionNo) ?? STUDENTS[0];
  const balance = me.totalFees - me.paid;
  return (
    <>
      <PageHeader title={`Welcome back, ${user.name.split(" ")[0]}`} description={`${me.classroom} · ${me.admissionNo}`} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Fees" value={currency(me.totalFees)} icon={<Wallet className="size-5" />} />
        <StatCard label="Total Paid" value={currency(me.paid)} tone="success" icon={<TrendingUp className="size-5" />} />
        <StatCard label="Balance" value={currency(balance)} tone={balance > 0 ? "warning" : "success"} icon={<Clock className="size-5" />} />
        <StatCard label="Class Rank" value="#4 of 32" tone="info" hint="Form 3 Blue · Term 1" icon={<GraduationCap className="size-5" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        <Card className="lg:col-span-2 shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Latest results · Term 1, 2025</h3>
              <Badge variant="secondary">Average 79.4%</Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Teacher</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {STUDENT_RESULTS.slice(0, 5).map((r) => (
                  <TableRow key={r.subject}>
                    <TableCell className="font-medium">{r.subject}</TableCell>
                    <TableCell className="text-right">{r.score}</TableCell>
                    <TableCell><Badge variant="outline">{r.grade}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{r.teacher}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Recent payments</h3>
            <ul className="space-y-3">
              {RECEIPTS.filter((r) => r.studentId === me.id).map((r) => (
                <li key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                  <div>
                    <div className="text-sm font-medium">{r.receiptNo}</div>
                    <div className="text-xs text-muted-foreground">{r.date} · {r.method}</div>
                  </div>
                  <div className="text-sm font-semibold text-success">{currency(r.amount)}</div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 shadow-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Announcements</h3>
            <Button variant="ghost" size="sm">View all</Button>
          </div>
          <ul className="divide-y divide-border">
            {ANNOUNCEMENTS.map((a) => (
              <li key={a.id} className="py-3 flex items-start gap-4">
                <div className="size-9 rounded-md bg-primary/10 text-primary grid place-items-center"><Calendar className="size-4" /></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{a.title}</span>
                    <Badge variant="secondary" className="text-[10px]">{a.tag}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">{a.body}</div>
                </div>
                <span className="text-xs text-muted-foreground">{a.date}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </>
  );
}

function TeacherDash() {
  const totalStudents = TEACHER_CLASSES.reduce((s, c) => s + c.students, 0);
  const pending = TEACHER_CLASSES.reduce((s, c) => s + c.pending, 0);
  return (
    <>
      <PageHeader title="Teaching overview" description="Term 1, 2025 · Mathematics department" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Assigned Classes" value={TEACHER_CLASSES.length} icon={<Users className="size-5" />} />
        <StatCard label="Students" value={totalStudents} tone="info" icon={<GraduationCap className="size-5" />} />
        <StatCard label="Pending Marks" value={pending} tone={pending ? "warning" : "success"} icon={<AlertTriangle className="size-5" />} />
        <StatCard label="Avg Attendance" value="94.2%" tone="success" icon={<Activity className="size-5" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        <Card className="lg:col-span-2 shadow-card">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">My classes</h3>
            <Table>
              <TableHeader>
                <TableRow><TableHead>Class</TableHead><TableHead>Subject</TableHead><TableHead className="text-right">Students</TableHead><TableHead>Marks status</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {TEACHER_CLASSES.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.subject}</TableCell>
                    <TableCell className="text-right">{c.students}</TableCell>
                    <TableCell>
                      {c.pending === 0
                        ? <Badge className="bg-success/15 text-success border-success/20">Complete</Badge>
                        : <Badge className="bg-warning/15 text-warning border-warning/30">{c.pending} pending</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Recent activity</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-3"><ClipboardList className="size-4 text-primary mt-0.5" /><div><div>Saved marks for Form 3 Blue</div><div className="text-xs text-muted-foreground">2 hours ago</div></div></li>
              <li className="flex gap-3"><Activity className="size-4 text-primary mt-0.5" /><div><div>Recorded attendance · Form 4 Red</div><div className="text-xs text-muted-foreground">Yesterday</div></div></li>
              <li className="flex gap-3"><FileBarChart2 className="size-4 text-primary mt-0.5" /><div><div>Generated results · Term 1</div><div className="text-xs text-muted-foreground">2 days ago</div></div></li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function AccountantDash() {
  const today = RECEIPTS.reduce((s, r) => s + r.amount, 0);
  const outstanding = STUDENTS.reduce((s, st) => s + (st.totalFees - st.paid), 0);
  return (
    <>
      <PageHeader title="Finance overview" description="Today · 14 May 2025" action={<Button className="gradient-primary text-primary-foreground">New payment</Button>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today's collections" value={currency(today)} tone="success" icon={<Wallet className="size-5" />} />
        <StatCard label="This month" value={currency(today * 18)} tone="info" icon={<TrendingUp className="size-5" />} />
        <StatCard label="Outstanding" value={currency(outstanding)} tone="warning" icon={<AlertTriangle className="size-5" />} />
        <StatCard label="Unallocated" value={currency(4500)} tone="destructive" icon={<ShieldAlert className="size-5" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        <Card className="lg:col-span-2 shadow-card">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Recent receipts</h3>
            <Table>
              <TableHeader><TableRow><TableHead>Receipt</TableHead><TableHead>Student</TableHead><TableHead>Method</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
              <TableBody>
                {RECEIPTS.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.receiptNo}</TableCell>
                    <TableCell><div className="font-medium">{r.studentName}</div><div className="text-xs text-muted-foreground">{r.admissionNo}</div></TableCell>
                    <TableCell><Badge variant="outline">{r.method}</Badge></TableCell>
                    <TableCell className="text-right font-semibold">{currency(r.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Collections by method (today)</h3>
            <ul className="space-y-3">
              {[
                { l: "M-Pesa", v: 40000, pct: 55 },
                { l: "Bank Transfer", v: 40000, pct: 30 },
                { l: "Cash", v: 10000, pct: 10 },
                { l: "Cheque", v: 20000, pct: 5 },
              ].map((m) => (
                <li key={m.l}>
                  <div className="flex items-center justify-between text-sm"><span>{m.l}</span><span className="font-medium">{currency(m.v)}</span></div>
                  <div className="mt-1 h-2 rounded-full bg-muted overflow-hidden"><div className="h-full gradient-primary" style={{ width: `${m.pct}%` }} /></div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function AdminDash() {
  return (
    <>
      <PageHeader title="Administrator control" description="System health, users, and audit at a glance." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Users" value="312" tone="info" icon={<Users className="size-5" />} />
        <StatCard label="Students" value="4,218" icon={<GraduationCap className="size-5" />} />
        <StatCard label="System Uptime" value="99.98%" tone="success" icon={<Activity className="size-5" />} />
        <StatCard label="DB Size" value="1.42 GB" hint="42 tables · 86k rows" icon={<Database className="size-5" />} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-6">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">User distribution</h3>
            <ul className="space-y-3">
              {[
                { l: "Students", v: 4218, pct: 92 },
                { l: "Teachers", v: 184, pct: 4 },
                { l: "Accountants", v: 6, pct: 1 },
                { l: "Administrators", v: 3, pct: 1 },
              ].map((m) => (
                <li key={m.l}>
                  <div className="flex items-center justify-between text-sm"><span>{m.l}</span><span className="font-medium">{m.v.toLocaleString()}</span></div>
                  <div className="mt-1 h-2 rounded-full bg-muted overflow-hidden"><div className="h-full gradient-primary" style={{ width: `${m.pct}%` }} /></div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Latest audit events</h3>
            <ul className="divide-y divide-border text-sm">
              {[
                { t: "Password reset for dkimani", who: "admin", ago: "10m" },
                { t: "Receipt RCT-00451 issued", who: "gachieng", ago: "1h" },
                { t: "New user created: mwairimu", who: "admin", ago: "1d" },
                { t: "Failed login: unknown", who: "system", ago: "2d" },
              ].map((a, i) => (
                <li key={i} className="py-3 flex items-center justify-between">
                  <div><div>{a.t}</div><div className="text-xs text-muted-foreground">by {a.who}</div></div>
                  <span className="text-xs text-muted-foreground">{a.ago} ago</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

const _Receipt = Receipt;
void _Receipt;
