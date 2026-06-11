import { useState } from "react";
import { PageHeader } from "@/components/ui-bits";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AUDIT_LOGS } from "@/lib/sample-data";
import { Search } from "lucide-react";

export default function AuditLogsPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const list = AUDIT_LOGS.filter((l) =>
    (cat === "all" || l.category === cat) &&
    (!q || l.action.toLowerCase().includes(q.toLowerCase()) || l.actor.toLowerCase().includes(q.toLowerCase()))
  );
  return (
    <>
      <PageHeader title="Audit Logs" description="Every action across the system, time-stamped and traceable." />
      <Card className="shadow-card mb-4">
        <CardContent className="p-4 grid sm:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search action or actor…" className="pl-9" />
          </div>
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {["Login","Payment","Receipt","User","Academic"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      <Card className="shadow-card">
        <CardContent className="p-6">
          <Table>
            <TableHeader><TableRow><TableHead>Timestamp</TableHead><TableHead>Actor</TableHead><TableHead>Category</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
            <TableBody>
              {list.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-mono text-xs">{l.ts}</TableCell>
                  <TableCell>{l.actor}</TableCell>
                  <TableCell><Badge variant="outline">{l.category}</Badge></TableCell>
                  <TableCell>{l.action}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
