import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatCard } from "@/components/ui-bits";
import { RoleGate, useCurrentUser } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FEE_STRUCTURE, RECEIPTS, STUDENTS, currency } from "@/lib/sample-data";
import { Wallet, TrendingUp, Clock } from "lucide-react";

export const Route = createFileRoute("/app/finance")({
  head: () => ({ meta: [{ title: "Fee Statement — Horizon Academy" }] }),
  component: () => <RoleGate allowed={["student"]}><Finance /></RoleGate>,
});

function Finance() {
  const user = useCurrentUser()!;
  const me = STUDENTS.find((s) => s.admissionNo === user.admissionNo) ?? STUDENTS[0];
  const myReceipts = RECEIPTS.filter((r) => r.studentId === me.id);
  const fs = FEE_STRUCTURE.find((f) => f.classroom === me.classroom) ?? FEE_STRUCTURE[0];

  return (
    <>
      <PageHeader title="Fee Statement" description={`${me.classroom} · ${me.admissionNo}`} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Fees" value={currency(me.totalFees)} icon={<Wallet className="size-5" />} />
        <StatCard label="Total Paid" value={currency(me.paid)} tone="success" icon={<TrendingUp className="size-5" />} />
        <StatCard label="Outstanding" value={currency(me.totalFees - me.paid)} tone="warning" icon={<Clock className="size-5" />} />
        <StatCard label="Last Payment" value={myReceipts[0]?.date ?? "—"} hint={myReceipts[0] ? currency(myReceipts[0].amount) : "No payments"} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-6">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Fee structure · {me.classroom}</h3>
            <Table>
              <TableHeader><TableRow><TableHead>Category</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
              <TableBody>
                <TableRow><TableCell>Tuition</TableCell><TableCell className="text-right">{currency(fs.tuition)}</TableCell></TableRow>
                <TableRow><TableCell>Examination</TableCell><TableCell className="text-right">{currency(fs.exam)}</TableCell></TableRow>
                <TableRow><TableCell>Library</TableCell><TableCell className="text-right">{currency(fs.library)}</TableCell></TableRow>
                <TableRow><TableCell>Activity Fee</TableCell><TableCell className="text-right">{currency(fs.activity)}</TableCell></TableRow>
                <TableRow><TableCell>Boarding</TableCell><TableCell className="text-right">{currency(fs.boarding)}</TableCell></TableRow>
                <TableRow className="font-semibold"><TableCell>Total</TableCell><TableCell className="text-right">{currency(fs.tuition + fs.exam + fs.library + fs.activity + fs.boarding)}</TableCell></TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Payment history</h3>
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Receipt</TableHead><TableHead>Method</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
              <TableBody>
                {myReceipts.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No payments yet.</TableCell></TableRow>}
                {myReceipts.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.date}</TableCell>
                    <TableCell className="font-mono text-xs">{r.receiptNo}</TableCell>
                    <TableCell><Badge variant="outline">{r.method}</Badge></TableCell>
                    <TableCell className="text-right font-semibold">{currency(r.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
