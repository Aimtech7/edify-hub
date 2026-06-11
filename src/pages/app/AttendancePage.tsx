import { useState } from "react";
import { PageHeader } from "@/components/ui-bits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { STUDENTS, ATTENDANCE_RECENT, CEFR_LEVELS } from "@/lib/sample-data";
import { CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function AttendancePage() {
  const [lvl, setLvl] = useState("B2");
  const students = STUDENTS.filter((s) => s.level === lvl);
  const [present, setPresent] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(students.map((s) => [s.id, true]))
  );

  const handleLevelChange = (v: string) => {
    setLvl(v);
    const newStudents = STUDENTS.filter((s) => s.level === v);
    setPresent(Object.fromEntries(newStudents.map((s) => [s.id, true])));
  };

  const presentCount = Object.values(present).filter(Boolean).length;
  const absentCount = Object.values(present).length - presentCount;

  return (
    <>
      <PageHeader
        title="Attendance"
        description={`Level ${lvl} · Today · ${new Date().toLocaleDateString("en-KE", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`}
        action={
          <Button className="gradient-primary text-primary-foreground" onClick={() => toast.success(`Attendance recorded — ${presentCount} present, ${absentCount} absent`)}>
            Submit attendance
          </Button>
        }
      />

      {/* Level selector */}
      <Card className="shadow-card mb-4">
        <CardContent className="p-4 flex items-center gap-4">
          <label className="text-sm font-medium text-muted-foreground">CEFR Level:</label>
          <Select value={lvl} onValueChange={handleLevelChange}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CEFR_LEVELS.map((l) => <SelectItem key={l} value={l}>Level {l}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="ml-auto flex gap-2">
            <Badge className="bg-success/15 text-success border-success/20">{presentCount} present</Badge>
            <Badge className="bg-destructive/10 text-destructive border-destructive/20">{absentCount} absent</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Recent history */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {ATTENDANCE_RECENT.map((a) => (
          <Card key={a.date} className="shadow-card">
            <CardContent className="p-5">
              <div className="text-xs text-muted-foreground font-medium">{a.date} · Level {a.classroom}</div>
              <div className="mt-2 flex items-center gap-3">
                <Badge className="bg-success/15 text-success border-success/20">{a.present} present</Badge>
                <Badge className="bg-destructive/10 text-destructive border-destructive/20">{a.absent} absent</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's roll call */}
      <Card className="shadow-card">
        <CardContent className="p-6">
          {students.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No students enrolled in Level {lvl}.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Student No.</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="font-mono text-xs">{s.admissionNo}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{s.batch}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex rounded-md border border-border overflow-hidden">
                        <button
                          onClick={() => setPresent((p) => ({ ...p, [s.id]: true }))}
                          className={`px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors ${present[s.id] ? "bg-success/15 text-success" : "text-muted-foreground hover:text-foreground"}`}
                        >
                          <CheckCircle2 className="size-3.5" />Present
                        </button>
                        <button
                          onClick={() => setPresent((p) => ({ ...p, [s.id]: false }))}
                          className={`px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors ${!present[s.id] ? "bg-destructive/10 text-destructive" : "text-muted-foreground hover:text-foreground"}`}
                        >
                          <XCircle className="size-3.5" />Absent
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
