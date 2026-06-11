import { useState } from "react";
import { PageHeader } from "@/components/ui-bits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { STUDENTS, SUBJECTS, CEFR_LEVELS } from "@/lib/sample-data";
import { Save, Send } from "lucide-react";
import { toast } from "sonner";

function germanGrade(v: number): { label: string; tone: string } {
  if (v >= 90) return { label: "Sehr gut",    tone: "text-success" };
  if (v >= 75) return { label: "Gut",         tone: "text-success" };
  if (v >= 60) return { label: "Befriedigend", tone: "text-warning" };
  if (v >= 45) return { label: "Ausreichend", tone: "text-warning" };
  return { label: "Nicht bestanden", tone: "text-destructive" };
}

export default function MarksPage() {
  const [cls, setCls] = useState<string>("B2");
  const [subject, setSubject] = useState("Grammatik");
  const [module, setModule] = useState("m1");
  const students = STUDENTS.filter((s) => s.level === cls);
  const [marks, setMarks] = useState<Record<string, string>>(() =>
    Object.fromEntries(students.map((s, i) => [s.id, String(60 + ((i * 13) % 35))]))
  );

  const studentsForLevel = STUDENTS.filter((s) => s.level === cls);

  return (
    <>
      <PageHeader
        title="Marks Entry"
        description="Enter assessment scores per student. Save as draft or submit for review."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => toast.success("Draft saved")}><Save className="size-4 mr-2" />Save draft</Button>
            <Button className="gradient-primary text-primary-foreground" onClick={() => toast.success("Marks submitted for review")}><Send className="size-4 mr-2" />Submit</Button>
          </div>
        }
      />

      <Card className="shadow-card mb-4">
        <CardContent className="p-4 grid sm:grid-cols-3 gap-3">
          <Select value={cls} onValueChange={(v) => { setCls(v); setMarks(Object.fromEntries(STUDENTS.filter((s) => s.level === v).map((s, i) => [s.id, String(60 + ((i * 13) % 35))]))); }}>
            <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
            <SelectContent>
              {CEFR_LEVELS.map((l) => <SelectItem key={l} value={l}>Level {l}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={module} onValueChange={setModule}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="m1">Module 1 · End assessment</SelectItem>
              <SelectItem value="m2">Module 1 · Mid assessment</SelectItem>
              <SelectItem value="m3">Mock exam</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="p-6">
          {studentsForLevel.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No students enrolled in level {cls}.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Student No.</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead className="w-40">Score (out of 100)</TableHead>
                  <TableHead>Rating</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentsForLevel.map((s, i) => {
                  const v = parseInt(marks[s.id] || "0", 10);
                  const { label, tone } = germanGrade(v);
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="font-mono text-xs">{s.admissionNo}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{s.batch}</TableCell>
                      <TableCell>
                        <Input
                          value={marks[s.id] ?? ""}
                          onChange={(e) => setMarks((m) => ({ ...m, [s.id]: e.target.value }))}
                          type="number" min={0} max={100}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={tone}>{label}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
