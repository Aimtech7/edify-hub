import { PageHeader } from "@/components/ui-bits";
import { useCurrentUser } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { STUDENT_RESULTS, TEACHER_CLASSES, STUDENTS, CEFR_LEVEL_INFO } from "@/lib/sample-data";
import { Printer, Download, BookOpen } from "lucide-react";
import { toast } from "sonner";

export default function ResultsPage() {
  const user = useCurrentUser();
  if (!user) return null;
  if (user.role === "student") return <StudentResults />;
  return <TeacherResults />;
}

function StudentResults() {
  const user = useCurrentUser()!;
  const me = STUDENTS.find((s) => s.admissionNo === user.admissionNo) ?? STUDENTS[0];
  const avg = (STUDENT_RESULTS.reduce((s, r) => s + r.score, 0) / STUDENT_RESULTS.length).toFixed(1);
  const levelInfo = CEFR_LEVEL_INFO[me.level];

  return (
    <>
      <PageHeader
        title="Assessment Results"
        description={`Level ${me.level} · ${me.batch} · Module 1 Assessment`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.print()}><Printer className="size-4 mr-2" />Print</Button>
            <Button className="gradient-primary text-primary-foreground" onClick={() => toast.success("Result sheet PDF downloaded")}><Download className="size-4 mr-2" />Download PDF</Button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-4 gap-4 mb-6">
        {[
          { l: "Mean Score",    v: `${avg}%`     },
          { l: "Overall Grade", v: "Gut"          },
          { l: "Level",         v: me.level       },
          { l: "Band",          v: levelInfo.band },
        ].map((s) => (
          <Card key={s.l} className="shadow-card">
            <CardContent className="p-5">
              <div className="text-xs text-muted-foreground uppercase tracking-wide">{s.l}</div>
              <div className="text-2xl font-display font-bold mt-1">{s.v}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-card">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Skills assessment — Fertigkeiten</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Skill (Fertigkeit)</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Remark</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {STUDENT_RESULTS.map((r) => (
                <TableRow key={r.subject}>
                  <TableCell className="font-medium flex items-center gap-2">
                    <BookOpen className="size-4 text-primary" />{r.subject}
                  </TableCell>
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
          <h3 className="font-semibold mb-2">Instructor's remark</h3>
          <p className="text-sm text-muted-foreground">
            Amani hat sich in diesem Modul sehr gut entwickelt, besonders im Grammatik- und Leseverständnis.
            Mit regelmäßigem Üben ist eine Promotion nach C1 im nächsten Kurs realistisch. Weiter so! — Frau Müller
          </p>
        </CardContent>
      </Card>
    </>
  );
}

function TeacherResults() {
  return (
    <>
      <PageHeader
        title="Results Management"
        description="Generate, review and publish level group results."
        action={<Button className="gradient-primary text-primary-foreground" onClick={() => toast.success("Results published")}>Publish results</Button>}
      />
      <Card className="shadow-card mb-6">
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Level</TableHead>
                <TableHead>Focus</TableHead>
                <TableHead className="text-right">Students</TableHead>
                <TableHead className="text-right">Mean</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TEACHER_CLASSES.map((c, i) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <span className="font-bold">{c.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{CEFR_LEVEL_INFO[c.name as keyof typeof CEFR_LEVEL_INFO]?.band}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{c.subject}</TableCell>
                  <TableCell className="text-right">{c.students}</TableCell>
                  <TableCell className="text-right">{(74 + i * 4).toFixed(1)}%</TableCell>
                  <TableCell>
                    {c.pending
                      ? <Badge className="bg-warning/15 text-warning border-warning/30">Draft</Badge>
                      : <Badge className="bg-success/15 text-success border-success/20">Ready</Badge>}
                  </TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="sm">Review</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Level B2 — Module assessment rankings</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Student No.</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Remark</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {STUDENTS.filter((s) => s.level === "B2").map((s, i) => (
                <TableRow key={s.id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="font-mono text-xs">{s.admissionNo}</TableCell>
                  <TableCell className="text-right">{84 - i * 4}</TableCell>
                  <TableCell><Badge variant="outline">{i === 0 ? "Sehr gut" : "Gut"}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">Gute Leistung in diesem Modul.</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
