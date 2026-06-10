import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-bits";
import { useCurrentUser } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { STUDENT_RESULTS, TEACHER_CLASSES, STUDENTS } from "@/lib/sample-data";
import { Printer, Download, BookOpen } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/results")({
  head: () => ({ meta: [{ title: "Results — Horizon Academy" }] }),
  component: ResultsPage,
});

function ResultsPage() {
  const user = useCurrentUser();
  if (!user) return null;
  if (user.role === "student") return <StudentResults />;
  return <TeacherResults />;
}

function StudentResults() {
  const avg = (STUDENT_RESULTS.reduce((s, r) => s + r.score, 0) / STUDENT_RESULTS.length).toFixed(1);
  return (
    <>
      <PageHeader title="Academic Results" description="Term 1, 2025 · Form 3 Blue" action={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}><Printer className="size-4 mr-2" />Print</Button>
          <Button className="gradient-primary text-primary-foreground" onClick={() => toast.success("Report card PDF downloaded")}><Download className="size-4 mr-2" />Download PDF</Button>
        </div>
      } />

      <div className="grid lg:grid-cols-4 gap-4 mb-6">
        {[
          { l: "Mean Score", v: `${avg}%` },
          { l: "Mean Grade", v: "B+" },
          { l: "Position", v: "4 / 32" },
          { l: "Stream Position", v: "12 / 128" },
        ].map((s) => (
          <Card key={s.l} className="shadow-card"><CardContent className="p-5"><div className="text-xs text-muted-foreground uppercase tracking-wide">{s.l}</div><div className="text-2xl font-display font-bold mt-1">{s.v}</div></CardContent></Card>
        ))}
      </div>

      <Card className="shadow-card">
        <CardContent className="p-6">
          <Table>
            <TableHeader><TableRow><TableHead>Subject</TableHead><TableHead className="text-right">Score</TableHead><TableHead>Grade</TableHead><TableHead>Teacher</TableHead><TableHead>Remark</TableHead></TableRow></TableHeader>
            <TableBody>
              {STUDENT_RESULTS.map((r) => (
                <TableRow key={r.subject}>
                  <TableCell className="font-medium flex items-center gap-2"><BookOpen className="size-4 text-primary" />{r.subject}</TableCell>
                  <TableCell className="text-right">{r.score}</TableCell>
                  <TableCell><Badge variant="outline">{r.grade}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{r.teacher}</TableCell>
                  <TableCell className="text-muted-foreground">{r.remark}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="shadow-card mt-6">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-2">Class teacher's remark</h3>
          <p className="text-sm text-muted-foreground">Amani has shown commendable improvement this term, especially in the sciences. With consistent effort she can break into the top three. Keep it up. — Ms. Wairimu</p>
        </CardContent>
      </Card>
    </>
  );
}

function TeacherResults() {
  return (
    <>
      <PageHeader title="Results Management" description="Generate, review and publish class results." action={<Button className="gradient-primary text-primary-foreground" onClick={() => toast.success("Results published")}>Publish results</Button>} />
      <Card className="shadow-card mb-6">
        <CardContent className="p-6">
          <Table>
            <TableHeader><TableRow><TableHead>Class</TableHead><TableHead>Subject</TableHead><TableHead className="text-right">Students</TableHead><TableHead className="text-right">Mean</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {TEACHER_CLASSES.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.subject}</TableCell>
                  <TableCell className="text-right">{c.students}</TableCell>
                  <TableCell className="text-right">{(72 + Math.random() * 10).toFixed(1)}%</TableCell>
                  <TableCell>{c.pending ? <Badge className="bg-warning/15 text-warning border-warning/30">Draft</Badge> : <Badge className="bg-success/15 text-success border-success/20">Ready</Badge>}</TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="sm">Review</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Form 3 Blue · Mathematics rankings</h3>
          <Table>
            <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Student</TableHead><TableHead>Adm. No</TableHead><TableHead className="text-right">Score</TableHead><TableHead>Grade</TableHead><TableHead>Remark</TableHead></TableRow></TableHeader>
            <TableBody>
              {STUDENTS.filter((s) => s.classroom === "Form 3 Blue").map((s, i) => (
                <TableRow key={s.id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="font-mono text-xs">{s.admissionNo}</TableCell>
                  <TableCell className="text-right">{82 - i * 3}</TableCell>
                  <TableCell><Badge variant="outline">{i < 2 ? "A-" : "B+"}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">Solid work this term.</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
