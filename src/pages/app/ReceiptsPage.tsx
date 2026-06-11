import { useState } from "react";
import { PageHeader } from "@/components/ui-bits";
import { useCurrentUser } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RECEIPTS, STUDENTS, INSTITUTION, currency, type Receipt } from "@/lib/sample-data";
import { Printer, Download, Search, Eye, GraduationCap } from "lucide-react";
import { toast } from "sonner";

export default function ReceiptsPage() {
  const user = useCurrentUser();
  const [q, setQ] = useState("");
  const [active, setActive] = useState<Receipt | null>(null);
  if (!user) return null;

  const list = user.role === "student"
    ? RECEIPTS.filter((r) => r.admissionNo === user.admissionNo)
    : RECEIPTS;
  const filtered = list.filter((r) =>
    !q || r.receiptNo.toLowerCase().includes(q.toLowerCase())
       || r.studentName.toLowerCase().includes(q.toLowerCase())
       || r.admissionNo.toLowerCase().includes(q.toLowerCase())
       || r.reference.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <>
      <PageHeader
        title={user.role === "student" ? "My Receipts" : "Receipts"}
        description={user.role === "student" ? "Download or print copies of your receipts." : "Issue, reprint and audit all receipts."}
      />
      <Card className="shadow-card mb-4">
        <CardContent className="p-4 flex gap-3">
          <div className="relative flex-1">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by receipt no, student, admission, reference…" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-card">
        <CardContent className="p-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt</TableHead>
                <TableHead>Date</TableHead>
                {user.role !== "student" && <TableHead>Student</TableHead>}
                <TableHead>Payer</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.receiptNo}</TableCell>
                  <TableCell>{r.date}</TableCell>
                  {user.role !== "student" && <TableCell><div className="font-medium">{r.studentName}</div><div className="text-xs text-muted-foreground">{r.admissionNo}</div></TableCell>}
                  <TableCell>{r.payer}</TableCell>
                  <TableCell><Badge variant="outline">{r.method}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{r.reference}</TableCell>
                  <TableCell className="text-right font-semibold">{currency(r.amount)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setActive(r)}><Eye className="size-4 mr-1" />View</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Receipt {active?.receiptNo}</DialogTitle></DialogHeader>
          {active && <ReceiptView r={active} />}
        </DialogContent>
      </Dialog>
    </>
  );
}

function ReceiptView({ r }: { r: Receipt }) {
  const student = STUDENTS.find((s) => s.id === r.studentId);
  const total = r.allocations.reduce((s, a) => s + a.amount, 0);
  return (
    <div>
      <div className="rounded-lg border border-border p-5 bg-card">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-md gradient-primary text-primary-foreground grid place-items-center"><GraduationCap className="size-5" /></div>
            <div>
              <div className="font-display font-bold">{INSTITUTION.name}</div>
              <div className="text-xs text-muted-foreground">{INSTITUTION.address}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Receipt</div>
            <div className="font-mono font-semibold">{r.receiptNo}</div>
            <div className="text-xs text-muted-foreground">{r.date}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 py-4 text-sm">
          <div><div className="text-xs text-muted-foreground">Student</div><div className="font-medium">{r.studentName}</div></div>
          <div><div className="text-xs text-muted-foreground">Adm. No</div><div className="font-mono">{r.admissionNo}</div></div>
          <div><div className="text-xs text-muted-foreground">Payer</div><div>{r.payer}</div></div>
          <div><div className="text-xs text-muted-foreground">Method</div><div>{r.method} · {r.reference}</div></div>
        </div>
        <table className="w-full text-sm border-t border-border">
          <thead><tr className="text-left text-xs text-muted-foreground"><th className="py-2">Allocation</th><th className="py-2 text-right">Amount</th></tr></thead>
          <tbody>
            {r.allocations.map((a) => (
              <tr key={a.category} className="border-t border-border"><td className="py-2">{a.category}</td><td className="py-2 text-right">{currency(a.amount)}</td></tr>
            ))}
            <tr className="border-t border-border font-semibold"><td className="py-2">Total received</td><td className="py-2 text-right">{currency(total)}</td></tr>
          </tbody>
        </table>
        {student && (
          <div className="mt-4 grid grid-cols-3 gap-3 text-sm pt-4 border-t border-border">
            <div><div className="text-xs text-muted-foreground">Total Fees</div><div className="font-medium">{currency(student.totalFees)}</div></div>
            <div><div className="text-xs text-muted-foreground">Total Paid</div><div className="font-medium text-success">{currency(student.paid)}</div></div>
            <div><div className="text-xs text-muted-foreground">Balance</div><div className="font-medium text-warning">{currency(student.totalFees - student.paid)}</div></div>
          </div>
        )}
        <div className="mt-4 pt-4 border-t border-border text-[11px] text-muted-foreground italic">Computer-generated receipt — no signature required.</div>
      </div>
      <div className="mt-4 flex gap-2 justify-end">
        <Button variant="outline" onClick={() => window.print()}><Printer className="size-4 mr-2" />Print</Button>
        <Button className="gradient-primary text-primary-foreground" onClick={() => toast.success("Receipt PDF downloaded")}><Download className="size-4 mr-2" />Download PDF</Button>
      </div>
    </div>
  );
}
