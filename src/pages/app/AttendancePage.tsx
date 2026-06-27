import { useState, useMemo } from "react";
import { useCurrentUser } from "@/components/app-shell";
import { PageHeader, StatCard } from "@/components/ui-bits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { STUDENTS, ATTENDANCE_RECENT, CEFR_LEVELS } from "@/lib/sample-data";
import { CheckCircle2, XCircle, Clock, AlertCircle, Calendar, TrendingUp, Save, Filter, FileText, PieChart } from "lucide-react";
import { toast } from "sonner";

type AttendanceStatus = "Present" | "Absent" | "Late" | "Excused";

const CAMPUSES = ["Ambwere Centre", "KNP Campus", "Bungoma Town Campus", "CTI Campus", "Virtual / Online"];
const COHORTS = ["May 2026 Intake", "January 2026 Intake", "September 2025 Intake", "Express Weekend Batch"];
const COURSES = ["Intensive Grammar & Conversation", "Goethe Exam Prep Intensive", "Ausbildung Pathway Integration", "Healthcare Nurse Vocabulary"];

export default function AttendancePage() {
  const user = useCurrentUser();
  
  // Selection workflow state
  const [campus, setCampus] = useState(CAMPUSES[0]);
  const [level, setLevel] = useState("B1");
  const [cohort, setCohort] = useState(COHORTS[0]);
  const [course, setCourse] = useState(COURSES[0]);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  
  // Tab state for Reports vs Roll Call
  const [activeTab, setActiveTab] = useState<"rollcall" | "history">("rollcall");

  // Filtered roster based on Level selection
  const roster = useMemo(() => {
    return STUDENTS.filter(s => s.level === level || level === "all").length > 0
      ? STUDENTS.filter(s => s.level === level || level === "all")
      : STUDENTS.slice(0, 6);
  }, [level]);

  const [records, setRecords] = useState<Record<string, { status: AttendanceStatus; remarks: string }>>(() =>
    Object.fromEntries(STUDENTS.map(s => [s.id, { status: "Present", remarks: "" }]))
  );

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setRecords(prev => ({
      ...prev,
      [studentId]: { status, remarks: prev[studentId]?.remarks || "" }
    }));
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setRecords(prev => ({
      ...prev,
      [studentId]: { status: prev[studentId]?.status || "Present", remarks }
    }));
  };

  const markAll = (status: AttendanceStatus) => {
    const updated: Record<string, { status: AttendanceStatus; remarks: string }> = {};
    roster.forEach(s => {
      updated[s.id] = { status, remarks: records[s.id]?.remarks || "" };
    });
    setRecords(prev => ({ ...prev, ...updated }));
    toast.info(`Marked entire class as ${status}`);
  };

  if (!user) return null;

  // Student-specific view
  if (user.role === "student") {
    const myStudent = STUDENTS.find((s) => s.admissionNo === user.admissionNo) ?? STUDENTS[0];
    const myAttendance = [
      { date: "2026-06-26", status: "Present", remark: "On time" },
      { date: "2026-06-25", status: "Present", remark: "On time" },
      { date: "2026-06-24", status: "Late", remark: "Arrived 15 mins late due to traffic" },
      { date: "2026-06-23", status: "Excused", remark: "Medical leave approved" },
      { date: "2026-06-22", status: "Present", remark: "On time" },
    ];
    return (
      <>
        <PageHeader title="My Attendance History" description={`Attendance ledger for Level ${myStudent.level} · Cohort ${myStudent.batch}`} />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Sessions" value={32} icon={<Calendar className="size-5" />} />
          <StatCard label="Present Days" value={29} tone="success" icon={<CheckCircle2 className="size-5" />} />
          <StatCard label="Late / Excused" value="2 / 1" icon={<Clock className="size-5" />} />
          <StatCard label="Attendance Rate" value="96.8%" tone="success" icon={<TrendingUp className="size-5" />} />
        </div>
        <Card className="shadow-card">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Detailed Session Log</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Remarks / Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myAttendance.map((a) => (
                  <TableRow key={a.date}>
                    <TableCell className="font-medium">{a.date}</TableCell>
                    <TableCell>
                      <Badge className={
                        a.status === "Present" ? "bg-success/15 text-success border-success/20" :
                        a.status === "Late" ? "bg-warning/15 text-warning border-warning/20" :
                        a.status === "Excused" ? "bg-blue-500/15 text-blue-500 border-blue-500/20" :
                        "bg-destructive/10 text-destructive border-destructive/20"
                      }>
                        {a.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.remark}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </>
    );
  }

  // Teacher / Admin statistics calculation
  const stats = roster.reduce(
    (acc, s) => {
      const st = records[s.id]?.status || "Present";
      acc[st] = (acc[st] || 0) + 1;
      return acc;
    },
    { Present: 0, Absent: 0, Late: 0, Excused: 0 } as Record<AttendanceStatus, number>
  );
  const total = roster.length || 1;
  const attendancePercentage = ((stats.Present + stats.Late * 0.5) / total * 100).toFixed(1);

  const saveAttendance = () => {
    toast.success(`Successfully saved attendance for ${roster.length} learners on ${date}!`);
  };

  return (
    <>
      <PageHeader
        title="Class Attendance & Register"
        description="Select class filter criteria, record multi-status roll call, or inspect historical session attendance summaries."
        action={
          <div className="flex items-center gap-2">
            <Button variant={activeTab === "rollcall" ? "default" : "outline"} onClick={() => setActiveTab("rollcall")} className={activeTab === "rollcall" ? "gradient-primary text-primary-foreground" : ""}>
              <Calendar className="size-4 mr-2" /> Roll Call Entry
            </Button>
            <Button variant={activeTab === "history" ? "default" : "outline"} onClick={() => setActiveTab("history")} className={activeTab === "history" ? "gradient-primary text-primary-foreground" : ""}>
              <PieChart className="size-4 mr-2" /> Reports & Summaries
            </Button>
          </div>
        }
      />

      {/* Cascading Filter Bar */}
      <Card className="shadow-card mb-6 border-t-4 border-t-primary">
        <CardContent className="p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
            <Filter className="size-3.5 text-primary" /> Step 1: Select Session Criteria
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Campus</label>
              <Select value={campus} onValueChange={setCampus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CAMPUSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Level</label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CEFR_LEVELS.map(l => <SelectItem key={l} value={l}>Level {l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Cohort Intake</label>
              <Select value={cohort} onValueChange={setCohort}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{COHORTS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Course Module</label>
              <Select value={course} onValueChange={setCourse}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{COURSES.map(c => <SelectItem key={c} value={c}>{c.slice(0, 24)}...</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Session Date</label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      {activeTab === "rollcall" ? (
        <>
          {/* Summary Statistics Pill Card */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
            <div className="bg-card border border-border rounded-xl p-3 text-center">
              <div className="text-xs text-muted-foreground">Class Attendance</div>
              <div className="text-xl font-bold text-primary mt-0.5">{attendancePercentage}%</div>
            </div>
            <div className="bg-success/10 border border-success/20 rounded-xl p-3 text-center">
              <div className="text-xs text-success">Present</div>
              <div className="text-xl font-bold text-success mt-0.5">{stats.Present}</div>
            </div>
            <div className="bg-warning/10 border border-warning/20 rounded-xl p-3 text-center">
              <div className="text-xs text-warning">Late</div>
              <div className="text-xl font-bold text-warning mt-0.5">{stats.Late}</div>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 text-center">
              <div className="text-xs text-blue-500">Excused</div>
              <div className="text-xl font-bold text-blue-500 mt-0.5">{stats.Excused}</div>
            </div>
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 text-center">
              <div className="text-xs text-destructive">Absent</div>
              <div className="text-xl font-bold text-destructive mt-0.5">{stats.Absent}</div>
            </div>
          </div>

          {/* Roll Call Table */}
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
                <div>
                  <h3 className="font-semibold text-lg">Step 2: Student Roll Call</h3>
                  <p className="text-xs text-muted-foreground">Mark status for each student below or apply a quick bulk action.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Quick Mark All:</span>
                  <Button size="sm" variant="outline" className="text-success hover:bg-success/10" onClick={() => markAll("Present")}>All Present</Button>
                  <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => markAll("Absent")}>All Absent</Button>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Student No.</TableHead>
                    <TableHead>Status Selection</TableHead>
                    <TableHead className="w-64">Remarks / Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roster.map((s) => {
                    const st = records[s.id]?.status || "Present";
                    return (
                      <TableRow key={s.id} className="hover:bg-muted/20">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-bold">
                              {s.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                            </div>
                            <span>{s.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">{s.admissionNo}</TableCell>
                        <TableCell>
                          <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted/30">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(s.id, "Present")}
                              className={`px-3 py-1 text-xs rounded-md font-medium transition-all flex items-center gap-1 ${st === "Present" ? "bg-success text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                            >
                              <CheckCircle2 className="size-3" /> Present
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(s.id, "Late")}
                              className={`px-3 py-1 text-xs rounded-md font-medium transition-all flex items-center gap-1 ${st === "Late" ? "bg-warning text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                            >
                              <Clock className="size-3" /> Late
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(s.id, "Excused")}
                              className={`px-3 py-1 text-xs rounded-md font-medium transition-all flex items-center gap-1 ${st === "Excused" ? "bg-blue-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                            >
                              <AlertCircle className="size-3" /> Excused
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusChange(s.id, "Absent")}
                              className={`px-3 py-1 text-xs rounded-md font-medium transition-all flex items-center gap-1 ${st === "Absent" ? "bg-destructive text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                            >
                              <XCircle className="size-3" /> Absent
                            </button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            size={1}
                            placeholder="Optional remark..."
                            value={records[s.id]?.remarks || ""}
                            onChange={(e) => handleRemarksChange(s.id, e.target.value)}
                            className="h-8 text-xs"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="mt-8 pt-4 border-t border-border flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Ready to commit roll call for <strong>{roster.length}</strong> students.
                </div>
                <Button onClick={saveAttendance} className="gradient-primary text-primary-foreground gap-2 font-bold px-6">
                  <Save className="size-4" /> Save Class Attendance
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* History & Reports Tab */
        <Card className="shadow-card">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4">Historical Attendance Ledger & Summaries</h3>
            <div className="grid lg:grid-cols-3 gap-4">
              {ATTENDANCE_RECENT.map((a) => (
                <div key={a.date} className="p-4 rounded-xl border border-border bg-card">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-sm">{a.date}</span>
                    <Badge variant="outline">Level {a.classroom}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mb-3">Campus: {campus}</div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-success/15 text-success border-success/20">{a.present} Present</Badge>
                    <Badge className="bg-destructive/10 text-destructive border-destructive/20">{a.absent} Absent</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
