import { useCurrentUser } from "@/components/app-shell";
import { PageHeader, StatCard } from "@/components/ui-bits";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ANNOUNCEMENTS, RECEIPTS, STUDENTS, STUDENT_RESULTS, TEACHER_CLASSES, CEFR_LEVEL_INFO, currency,
} from "@/lib/sample-data";
import {
  Wallet, TrendingUp, Clock, GraduationCap, Users, AlertTriangle, ClipboardList,
  Calendar, FileBarChart2, Activity, ShieldAlert, Database, Award,
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
  const user = useCurrentUser();
  if (!user) return null;
  const me = STUDENTS.find((s) => s.admissionNo === user.admissionNo) ?? STUDENTS[0];
  const balance = me.totalFees - me.paid;
  const levelInfo = CEFR_LEVEL_INFO[me.level];
  const completed = me.progressionHistory.filter((e) => e.status === "completed").length;

  return (
    <>
      <PageHeader
        title={`Willkommen, ${user.name.split(" ")[0]}`}
        description={`Level ${me.level} · ${me.batch} · ${me.admissionNo}`}
      />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Current Level" value={me.level} hint={levelInfo.band} tone="info" icon={<GraduationCap className="size-5" />} />
        <StatCard label="Levels Completed" value={`${completed} of 6`} tone="success" icon={<Award className="size-5" />} />
        <StatCard label="Attendance Rate" value="93.3%" tone="success" icon={<Activity className="size-5" />} />
        <StatCard label="Total Fees" value={currency(me.totalFees)} icon={<Wallet className="size-5" />} />
        <StatCard label="Balance Due" value={currency(balance)} tone={balance > 0 ? "warning" : "success"} icon={<Clock className="size-5" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        <Card className="lg:col-span-2 shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Latest assessment · Level {me.level}</h3>
              <Badge variant="secondary">
                Avg {(STUDENT_RESULTS.reduce((s, r) => s + r.score, 0) / STUDENT_RESULTS.length).toFixed(1)}%
              </Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Skill (Fertigkeit)</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Instructor</TableHead>
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
              {RECEIPTS.filter((r) => r.studentId === me.id).slice(0, 4).map((r) => (
                <li key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                  <div>
                    <div className="text-sm font-medium">{r.receiptNo}</div>
                    <div className="text-xs text-muted-foreground">{r.date} · {r.method}</div>
                  </div>
                  <div className="text-sm font-semibold text-success">{currency(r.amount)}</div>
                </li>
              ))}
              {RECEIPTS.filter((r) => r.studentId === me.id).length === 0 && (
                <li className="text-sm text-muted-foreground">No payments yet.</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Level progression timeline & textual summary side-by-side */}
      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        <Card className="lg:col-span-2 shadow-card">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">My CEFR progression</h3>
            <div className="flex items-center gap-0 flex-wrap py-2">
              {(["A1", "A2", "B1", "B2", "C1", "C2"] as const).map((lvl, i) => {
                const event = me.progressionHistory.find((e) => e.level === lvl);
                const status = event?.status ?? "upcoming";
                return (
                  <div key={lvl} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div className={`size-10 rounded-full border-2 grid place-items-center text-xs font-bold transition-colors
                        ${status === "completed" ? "bg-success/15 border-success text-success" :
                          status === "active" ? "gradient-primary text-primary-foreground border-primary" :
                          "bg-muted/40 border-border text-muted-foreground"}`}>
                        {lvl}
                      </div>
                      <div className="text-[10px] mt-1 text-muted-foreground capitalize">{status === "upcoming" ? "" : status}</div>
                    </div>
                    {i < 5 && <div className={`w-6 sm:w-12 h-0.5 mx-0.5 mb-4 ${status === "completed" ? "bg-success" : "bg-border"}`} />}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3">Progress Path</h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-xs text-muted-foreground font-medium uppercase">Completed:</div>
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  {me.progressionHistory.filter((e) => e.status === "completed").map((e) => (
                    <Badge key={e.level} variant="secondary" className="bg-success/10 text-success border-success/20">
                      ✓ {e.level}
                    </Badge>
                  ))}
                  {me.progressionHistory.filter((e) => e.status === "completed").length === 0 && (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                <div>
                  <div className="text-xs text-muted-foreground font-medium uppercase">Current:</div>
                  <Badge className="mt-1 gradient-primary text-primary-foreground border-transparent">
                    {me.level}
                  </Badge>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground font-medium uppercase">Next Level:</div>
                  <Badge variant="outline" className="mt-1">
                    {(() => {
                      const idx = ["A1", "A2", "B1", "B2", "C1", "C2"].indexOf(me.level);
                      return idx >= 0 && idx < 5 ? ["A1", "A2", "B1", "B2", "C1", "C2"][idx + 1] : "Max Level Reached";
                    })()}
                  </Badge>
                </div>
              </div>
            </div>
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
            {ANNOUNCEMENTS.slice(0, 3).map((a) => (
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
      <PageHeader title="Teaching overview" description="Your language level groups · 2025" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Level Groups" value={TEACHER_CLASSES.length} icon={<Users className="size-5" />} />
        <StatCard label="Students" value={totalStudents} tone="info" icon={<GraduationCap className="size-5" />} />
        <StatCard label="Pending Marks" value={pending} tone={pending ? "warning" : "success"} icon={<AlertTriangle className="size-5" />} />
        <StatCard label="Avg Attendance" value="93.8%" tone="success" icon={<Activity className="size-5" />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-6">
        <Card className="lg:col-span-2 shadow-card">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">My level groups</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Level</TableHead>
                  <TableHead>Skills focus</TableHead>
                  <TableHead className="text-right">Students</TableHead>
                  <TableHead>Marks status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {TEACHER_CLASSES.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <span className="font-bold text-base mr-2">{c.name}</span>
                      <Badge variant="outline" className="text-[10px]">{CEFR_LEVEL_INFO[c.name as keyof typeof CEFR_LEVEL_INFO]?.band}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{c.subject}</TableCell>
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
              <li className="flex gap-3"><ClipboardList className="size-4 text-primary mt-0.5" /><div><div>Saved marks for B2 · Grammatik</div><div className="text-xs text-muted-foreground">2 hours ago</div></div></li>
              <li className="flex gap-3"><Activity className="size-4 text-primary mt-0.5" /><div><div>Recorded attendance · C1 group</div><div className="text-xs text-muted-foreground">Yesterday</div></div></li>
              <li className="flex gap-3"><FileBarChart2 className="size-4 text-primary mt-0.5" /><div><div>Generated results · A2 Batch-01</div><div className="text-xs text-muted-foreground">2 days ago</div></div></li>
              <li className="flex gap-3"><Award className="size-4 text-primary mt-0.5" /><div><div>Promoted Amani Wanjiru: B1 → B2</div><div className="text-xs text-muted-foreground">5 days ago</div></div></li>
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
        <StatCard label="This month" value={currency(today * 6)} tone="info" icon={<TrendingUp className="size-5" />} />
        <StatCard label="Outstanding" value={currency(outstanding)} tone="warning" icon={<AlertTriangle className="size-5" />} />
        <StatCard label="Unallocated" value={currency(18000)} tone="destructive" icon={<ShieldAlert className="size-5" />} />
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
            <h3 className="font-semibold mb-4">Collections by method</h3>
            <ul className="space-y-3">
              {[
                { l: "M-Pesa",       v: 38000, pct: 50 },
                { l: "Bank Transfer",v: 30000, pct: 30 },
                { l: "Cash",         v: 10000, pct: 13 },
                { l: "Cheque",       v: 20000, pct: 7  },
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
  const levelCounts: Record<string, number> = {};
  STUDENTS.forEach((s) => { levelCounts[s.level] = (levelCounts[s.level] ?? 0) + 1; });
  return (
    <>
      <PageHeader title="Administrator control" description="System health, enrollments, and audit at a glance." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Users"     value="312"    tone="info"    icon={<Users className="size-5" />} />
        <StatCard label="Enrolled Students" value="1,218" icon={<GraduationCap className="size-5" />} />
        <StatCard label="System Uptime"    value="99.98%" tone="success" icon={<Activity className="size-5" />} />
        <StatCard label="DB Size"          value="0.82 GB" hint="36 tables · 42k rows" icon={<Database className="size-5" />} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-6">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Enrollment by CEFR level</h3>
            <ul className="space-y-3">
              {(["A1", "A2", "B1", "B2", "C1", "C2"] as const).map((lvl) => {
                const count = STUDENTS.filter((s) => s.level === lvl).length;
                const pct = Math.round((count / STUDENTS.length) * 100);
                return (
                  <li key={lvl}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold">{lvl} <span className="text-muted-foreground font-normal">— {CEFR_LEVEL_INFO[lvl].band}</span></span>
                      <span className="font-medium">{count} students</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-muted overflow-hidden"><div className="h-full gradient-primary" style={{ width: `${pct * 3}%` }} /></div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Latest audit events</h3>
            <ul className="divide-y divide-border text-sm">
              {[
                { t: "Student DA-2024-1042 promoted: B1 → B2", who: "admin",    ago: "5d" },
                { t: "Receipt RCT-00451 issued",                 who: "gachieng", ago: "1h" },
                { t: "Password reset for amueller",              who: "admin",    ago: "10m" },
                { t: "New user created: hwagner",                who: "admin",    ago: "2d" },
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
