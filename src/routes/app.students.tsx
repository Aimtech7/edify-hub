import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/ui-bits";
import { RoleGate } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { STUDENTS, CLASSES, currency } from "@/lib/sample-data";
import { Search } from "lucide-react";

export const Route = createFileRoute("/app/students")({
  head: () => ({ meta: [{ title: "Students — Horizon Academy" }] }),
  component: () => <RoleGate allowed={["teacher", "admin"]}><StudentsPage /></RoleGate>,
});

function StudentsPage() {
  const [q, setQ] = useState("");
  const [cls, setCls] = useState<string>("all");
  const list = STUDENTS.filter((s) =>
    (cls === "all" || s.classroom === cls) &&
    (!q || s.name.toLowerCase().includes(q.toLowerCase()) || s.admissionNo.toLowerCase().includes(q.toLowerCase()))
  );
  return (
    <>
      <PageHeader title="Students" description="Assigned classes and learners." />
      <Card className="shadow-card mb-4">
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or admission no…" className="pl-9" />
          </div>
          <Select value={cls} onValueChange={setCls}>
            <SelectTrigger className="sm:w-56"><SelectValue placeholder="All classes" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      <Card className="shadow-card">
        <CardContent className="p-6">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Student</TableHead><TableHead>Adm. No</TableHead><TableHead>Class</TableHead>
              <TableHead>Parent</TableHead><TableHead>Phone</TableHead><TableHead className="text-right">Balance</TableHead>
              <TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {list.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium flex items-center gap-3">
                    <div className="size-9 rounded-full bg-primary/10 text-primary grid place-items-center text-xs font-semibold">{s.name.split(" ").map(n=>n[0]).slice(0,2).join("")}</div>
                    {s.name}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{s.admissionNo}</TableCell>
                  <TableCell><Badge variant="outline">{s.classroom}</Badge></TableCell>
                  <TableCell>{s.parent}</TableCell>
                  <TableCell className="text-muted-foreground">{s.phone}</TableCell>
                  <TableCell className={`text-right font-medium ${s.totalFees - s.paid > 0 ? "text-warning" : "text-success"}`}>{currency(s.totalFees - s.paid)}</TableCell>
                  <TableCell className="text-right"><Button size="sm" variant="ghost">View</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
