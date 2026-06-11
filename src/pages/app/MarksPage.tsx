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
  if (v >= 90) return { label: "Sehr gut",    tone: "text-success border-success/30 bg-success/10" };
  if (v >= 75) return { label: "Gut",         tone: "text-success border-success/20 bg-success/5" };
  if (v >= 60) return { label: "Befriedigend", tone: "text-warning border-warning/30 bg-warning/10" };
  if (v >= 45) return { label: "Ausreichend", tone: "text-warning border-warning/20 bg-warning/5" };
  return { label: "Nicht bestanden", tone: "text-destructive border-destructive/20 bg-destructive/10" };
}

export default function MarksPage() {
  const [cls, setCls] = useState<string>("B2");
  const [subject, setSubject] = useState("Grammatik");
  const [module, setModule] = useState("m1");
  const students = STUDENTS.filter((s) => s.level === cls);
  
  const [marks, setMarks] = useState<Record<string, string>>(() =>
    Object.fromEntries(students.map((s, i) => [s.id, String(60 + ((i * 13) % 35))]))
  );

  const [remarks, setRemarks] = useState<Record<string, string>>(() =>
    Object.fromEntries(students.map((s) => [s.id, "Gute Leistung in diesem Modul."]))
  );

  const handleLevelChange = (v: string) => {
    setCls(v);
    const newStudents = STUDENTS.filter((s) => s.level === v);
    setMarks(Object.fromEntries(newStudents.map((s, i) => [s.id, String(60 + ((i * 13) % 35))])));
    setRemarks(Object.fromEntries(newStudents.map((s) => [s.id, "Gute Leistung in diesem Modul."])));
  };

  const studentsForLevel = STUDENTS.filter((s) => s.level === cls);

  const handleSaveDraft = () => {
    toast.success("Draft scores and remarks saved successfully!");
  };

  const handleSubmit = () => {
    toast.success("Marks and instructor remarks published to student profiles!");
  };

  return (
    <>
      <PageHeader
        title="Marks Entry"
        description="Enter assessment scores and German course remarks per student."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSaveDraft}>
              <Save className="size-4 mr-2" />Save draft
            </Button>
            <Button className="gradient-primary text-primary-foreground" onClick={handleSubmit}>
              <Send className="size-4 mr-2" />Publish Marks
            </Button>
          </div>
        }
      />

      <Card className="shadow-card mb-4">
        <CardContent className="p-4 grid sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Language Level</label>
            <Select value={cls} onValueChange={handleLevelChange}>
              <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
              <SelectContent>
                {CEFR_LEVELS.map((l) => <SelectItem key={l} value={l}>Level {l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Skill Focus (Fertigkeit)</label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground">Assessment Module</label>
            <Select value={module} onValueChange={setModule}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="m1">Module 1 · End assessment</SelectItem>
                <SelectItem value="m2">Module 1 · Mid assessment</SelectItem>
                <SelectItem value="m3">Mock exam</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="p-6">
          {studentsForLevel.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No students enrolled in Level {cls}.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Student No.</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead className="w-28">Score (0-100)</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Instructor Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentsForLevel.map((s, i) => {
                  const scoreVal = parseInt(marks[s.id] || "0", 10);
                  const { label, tone } = germanGrade(scoreVal);
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
                          className="h-8"
                        />
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-xs ${tone}`}>{label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={remarks[s.id] ?? ""}
                          onChange={(e) => setRemarks((r) => ({ ...r, [s.id]: e.target.value }))}
                          placeholder="Add remark in German..."
                          className="h-8 min-w-64"
                        />
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
