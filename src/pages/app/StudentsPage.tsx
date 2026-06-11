import { useState } from "react";
import { PageHeader } from "@/components/ui-bits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { STUDENTS, CEFR_LEVELS, CEFR_LEVEL_INFO, currency } from "@/lib/sample-data";
import { Search, TrendingUp, UserPlus } from "lucide-react";

const BAND_COLORS: Record<string, string> = {
  Beginner:     "bg-blue-50 text-blue-700 border-blue-200",
  Intermediate: "bg-amber-50 text-amber-700 border-amber-200",
  Advanced:     "bg-green-50 text-green-700 border-green-200",
};

export default function StudentsPage() {
  const [q, setQ] = useState("");
  const [lvl, setLvl] = useState<string>("all");

  const list = STUDENTS.filter((s) =>
    (lvl === "all" || s.level === lvl) &&
    (!q || s.name.toLowerCase().includes(q.toLowerCase()) || s.admissionNo.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <>
      <PageHeader
        title="Students"
        description="All enrolled learners grouped by CEFR level."
        action={<Button className="gradient-primary text-primary-foreground"><UserPlus className="size-4 mr-2" />Enroll student</Button>}
      />

      {/* Level summary chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {CEFR_LEVELS.map((l) => {
          const cnt = STUDENTS.filter((s) => s.level === l).length;
          return (
            <button
              key={l}
              onClick={() => setLvl(lvl === l ? "all" : l)}
              className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors ${
                lvl === l ? "gradient-primary text-primary-foreground border-primary" : "bg-muted/40 border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {l} <span className="opacity-70">· {cnt}</span>
            </button>
          );
        })}
      </div>

      <Card className="shadow-card mb-4">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or student no…" className="pl-9" />
          </div>
          <Select value={lvl} onValueChange={setLvl}>
            <SelectTrigger className="sm:w-56"><SelectValue placeholder="All levels" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              {CEFR_LEVELS.map((l) => (
                <SelectItem key={l} value={l}>{l} — {CEFR_LEVEL_INFO[l].band}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Student No.</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Enrolled</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((s) => {
                const info = CEFR_LEVEL_INFO[s.level];
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-semibold">
                          {s.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                        </div>
                        <div>
                          <div>{s.name}</div>
                          <div className="text-xs text-muted-foreground">{s.nationality}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{s.admissionNo}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{s.level}</span>
                        <Badge className={`text-[10px] border ${BAND_COLORS[info.band]}`}>{info.band}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{s.batch}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{s.instructor}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{s.enrolledDate}</TableCell>
                    <TableCell className={`text-right font-medium ${s.totalFees - s.paid > 0 ? "text-warning" : "text-success"}`}>
                      {currency(s.totalFees - s.paid)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost"><TrendingUp className="size-3.5 mr-1" />Progress</Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {list.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No students found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
