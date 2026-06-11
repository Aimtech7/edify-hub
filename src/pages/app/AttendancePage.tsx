import { useState } from "react";
import { PageHeader } from "@/components/ui-bits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { STUDENTS, ATTENDANCE_RECENT } from "@/lib/sample-data";
import { CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function AttendancePage() {
  const students = STUDENTS.filter((s) => s.classroom === "Form 3 Blue");
  const [present, setPresent] = useState<Record<string, boolean>>(() => Object.fromEntries(students.map((s) => [s.id, true])));

  return (
    <>
      <PageHeader title="Attendance" description="Form 3 Blue · Today" action={<Button className="gradient-primary text-primary-foreground" onClick={() => toast.success("Attendance recorded")}>Submit</Button>} />
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {ATTENDANCE_RECENT.map((a) => (
          <Card key={a.date} className="shadow-card">
            <CardContent className="p-5">
              <div className="text-xs text-muted-foreground">{a.date} · {a.classroom}</div>
              <div className="mt-2 flex items-center gap-3">
                <Badge className="bg-success/15 text-success border-success/20">{a.present} present</Badge>
                <Badge className="bg-destructive/10 text-destructive border-destructive/20">{a.absent} absent</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="shadow-card">
        <CardContent className="p-6">
          <Table>
            <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Adm. No</TableHead><TableHead className="text-right">Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {students.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="font-mono text-xs">{s.admissionNo}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex rounded-md border border-border overflow-hidden">
                      <button onClick={() => setPresent((p) => ({ ...p, [s.id]: true }))} className={`px-3 py-1.5 text-xs flex items-center gap-1.5 ${present[s.id] ? "bg-success/15 text-success" : "text-muted-foreground"}`}><CheckCircle2 className="size-3.5" />Present</button>
                      <button onClick={() => setPresent((p) => ({ ...p, [s.id]: false }))} className={`px-3 py-1.5 text-xs flex items-center gap-1.5 ${!present[s.id] ? "bg-destructive/10 text-destructive" : "text-muted-foreground"}`}><XCircle className="size-3.5" />Absent</button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
