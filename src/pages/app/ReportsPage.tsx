import { PageHeader, StatCard } from "@/components/ui-bits";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TEACHER_CLASSES, STUDENTS, CEFR_LEVEL_INFO } from "@/lib/sample-data";
import { GraduationCap, TrendingUp, Activity, Users, Award } from "lucide-react";

export default function ReportsPage() {
  const totalStudents = TEACHER_CLASSES.reduce((s, c) => s + c.students, 0);

  return (
    <>
      <PageHeader title="Performance reports" description="Language level analytics and skill assessments." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Level groups"   value={TEACHER_CLASSES.length}  icon={<Users className="size-5" />} />
        <StatCard label="Students"        value={totalStudents}            tone="info"    icon={<GraduationCap className="size-5" />} />
        <StatCard label="Avg mean score"  value="77.4%"                   tone="success" icon={<TrendingUp className="size-5" />} />
        <StatCard label="Avg attendance"  value="93.8%"                   tone="success" icon={<Activity className="size-5" />} />
      </div>

      {/* Level group performance */}
      <Card className="shadow-card mt-6">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Level group performance</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Level</TableHead>
                <TableHead>Band</TableHead>
                <TableHead className="text-right">Students</TableHead>
                <TableHead className="text-right">Mean</TableHead>
                <TableHead>Score distribution</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TEACHER_CLASSES.map((c, i) => {
                const info = CEFR_LEVEL_INFO[c.name as keyof typeof CEFR_LEVEL_INFO];
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-bold text-base">{c.name}</TableCell>
                    <TableCell>
                      {info && <Badge variant="outline">{info.band}</Badge>}
                    </TableCell>
                    <TableCell className="text-right">{c.students}</TableCell>
                    <TableCell className="text-right">{(73 + i * 4).toFixed(1)}%</TableCell>
                    <TableCell>
                      <div className="flex gap-0.5 h-2.5 rounded-full overflow-hidden bg-muted w-40">
                        <span className="bg-success"     style={{ width: "30%" }} title="Sehr gut / Gut" />
                        <span className="bg-info"        style={{ width: "38%" }} title="Befriedigend" />
                        <span className="bg-warning"     style={{ width: "22%" }} title="Ausreichend" />
                        <span className="bg-destructive" style={{ width: "10%" }} title="Nicht bestanden" />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Top students */}
      <Card className="shadow-card mt-6">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Top performers this module</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead className="text-right">Mean</TableHead>
                <TableHead>Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {STUDENTS.slice(0, 5).map((s, i) => (
                <TableRow key={s.id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell><Badge variant="outline">{s.level}</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{s.instructor}</TableCell>
                  <TableCell className="text-right">{(86 - i * 2).toFixed(1)}%</TableCell>
                  <TableCell>
                    <Badge className={i < 2 ? "bg-success/15 text-success border-success/20" : "bg-info/15 text-info border-info/20"}>
                      {i < 2 ? "Sehr gut" : "Gut"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Certifications */}
      <Card className="shadow-card mt-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="size-5 text-primary" />
            <h3 className="font-semibold">Certificates issued — 2025</h3>
          </div>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
            {(["A1", "A2", "B1", "B2", "C1", "C2"] as const).map((lvl) => {
              const cnt = STUDENTS.filter((s) => s.progressionHistory.some((e) => e.level === lvl && e.status === "completed" && e.certificateNo)).length;
              return (
                <div key={lvl} className="rounded-lg border border-border bg-muted/30 p-4 text-center">
                  <div className="text-xl font-display font-extrabold">{lvl}</div>
                  <div className="text-2xl font-bold mt-1">{cnt}</div>
                  <div className="text-xs text-muted-foreground">certs</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
