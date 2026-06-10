import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/ui-bits";
import { RoleGate } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { STUDENTS, SUBJECTS, CLASSES } from "@/lib/sample-data";
import { Save, Send } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/marks")({
  head: () => ({ meta: [{ title: "Marks Entry — Horizon Academy" }] }),
  component: () => <RoleGate allowed={["teacher"]}><Marks /></RoleGate>,
});

function Marks() {
  const [cls, setCls] = useState("Form 3 Blue");
  const [subject, setSubject] = useState("Mathematics");
  const students = STUDENTS.filter((s) => s.classroom === cls);
  const [marks, setMarks] = useState<Record<string, string>>(() => Object.fromEntries(students.map((s, i) => [s.id, String(60 + ((i * 13) % 35))])));

  return (
    <>
      <PageHeader title="Marks Entry" description="Enter scores per student. Save as draft or submit for review." action={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => toast.success("Draft saved")}><Save className="size-4 mr-2" />Save draft</Button>
          <Button className="gradient-primary text-primary-foreground" onClick={() => toast.success("Marks submitted")}><Send className="size-4 mr-2" />Submit</Button>
        </div>
      } />
      <Card className="shadow-card mb-4">
        <CardContent className="p-4 grid sm:grid-cols-3 gap-3">
          <Select value={cls} onValueChange={setCls}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{SUBJECTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
          <Select defaultValue="t1">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="t1">Term 1 · End of term</SelectItem><SelectItem value="m1">Term 1 · Mid term</SelectItem></SelectContent>
          </Select>
        </CardContent>
      </Card>
      <Card className="shadow-card">
        <CardContent className="p-6">
          <Table>
            <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Student</TableHead><TableHead>Adm. No</TableHead><TableHead className="w-40">Score (out of 100)</TableHead><TableHead>Grade</TableHead></TableRow></TableHeader>
            <TableBody>
              {students.map((s, i) => {
                const v = parseInt(marks[s.id] || "0", 10);
                const g = v >= 80 ? "A" : v >= 70 ? "B+" : v >= 60 ? "B" : v >= 50 ? "C" : "D";
                return (
                  <TableRow key={s.id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="font-mono text-xs">{s.admissionNo}</TableCell>
                    <TableCell><Input value={marks[s.id]} onChange={(e) => setMarks((m) => ({ ...m, [s.id]: e.target.value }))} type="number" min={0} max={100} /></TableCell>
                    <TableCell className="font-semibold">{g}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
