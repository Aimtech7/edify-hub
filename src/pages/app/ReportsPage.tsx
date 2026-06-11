import { PageHeader, StatCard } from "@/components/ui-bits";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TEACHER_CLASSES, STUDENTS } from "@/lib/sample-data";
import { GraduationCap, TrendingUp, Activity, Users } from "lucide-react";

export default function ReportsPage() {
  return (
    <>
      <PageHeader title="Performance reports" description="Class and subject analytics." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Classes" value={TEACHER_CLASSES.length} icon={<Users className="size-5" />} />
        <StatCard label="Students" value={TEACHER_CLASSES.reduce((s, c) => s + c.students, 0)} tone="info" icon={<GraduationCap className="size-5" />} />
        <StatCard label="Avg mean" value="76.2%" tone="success" icon={<TrendingUp className="size-5" />} />
        <StatCard label="Attendance" value="94.2%" tone="success" icon={<Activity className="size-5" />} />
      </div>

      <Card className="shadow-card mt-6">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Class performance</h3>
          <Table>
            <TableHeader><TableRow><TableHead>Class</TableHead><TableHead>Subject</TableHead><TableHead className="text-right">Students</TableHead><TableHead className="text-right">Mean</TableHead><TableHead>Distribution</TableHead></TableRow></TableHeader>
            <TableBody>
              {TEACHER_CLASSES.map((c, i) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.subject}</TableCell>
                  <TableCell className="text-right">{c.students}</TableCell>
                  <TableCell className="text-right">{(72 + i * 3).toFixed(1)}%</TableCell>
                  <TableCell>
                    <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-muted w-48">
                      <span className="bg-success" style={{ width: "30%" }} />
                      <span className="bg-info" style={{ width: "35%" }} />
                      <span className="bg-warning" style={{ width: "25%" }} />
                      <span className="bg-destructive" style={{ width: "10%" }} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="shadow-card mt-6">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Top students this term</h3>
          <Table>
            <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Student</TableHead><TableHead>Class</TableHead><TableHead className="text-right">Mean</TableHead><TableHead>Grade</TableHead></TableRow></TableHeader>
            <TableBody>
              {STUDENTS.slice(0, 5).map((s, i) => (
                <TableRow key={s.id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell><Badge variant="outline">{s.classroom}</Badge></TableCell>
                  <TableCell className="text-right">{(85 - i * 2).toFixed(1)}%</TableCell>
                  <TableCell><Badge>{i < 2 ? "A" : "A-"}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
