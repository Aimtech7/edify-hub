import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, StatCard } from "@/components/ui-bits";
import { RoleGate } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RECEIPTS, STUDENTS, currency } from "@/lib/sample-data";
import { Download, FileSpreadsheet, TrendingUp, Wallet, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/finance-reports")({
  head: () => ({ meta: [{ title: "Finance Reports — Horizon Academy" }] }),
  component: () => <RoleGate allowed={["accountant", "admin"]}><FinanceReports /></RoleGate>,
});

function FinanceReports() {
  const collections = RECEIPTS.reduce((s, r) => s + r.amount, 0);
  const outstanding = STUDENTS.reduce((s, st) => s + (st.totalFees - st.paid), 0);
  const fullyPaid = STUDENTS.filter((s) => s.paid >= s.totalFees);

  return (
    <>
      <PageHeader title="Finance Reports" description="Daily, monthly and outstanding fee reports." action={
        <Button variant="outline" onClick={() => toast.success("Report exported")}><Download className="size-4 mr-2" />Export</Button>
      } />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today's collections" value={currency(collections)} tone="success" icon={<Wallet className="size-5" />} />
        <StatCard label="Monthly collections" value={currency(collections * 18)} tone="info" icon={<TrendingUp className="size-5" />} />
        <StatCard label="Outstanding" value={currency(outstanding)} tone="warning" icon={<AlertTriangle className="size-5" />} />
        <StatCard label="Fully paid students" value={fullyPaid.length} tone="success" icon={<CheckCircle2 className="size-5" />} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-6">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Outstanding balances</h3>
            <Table>
              <TableHeader><TableRow><TableHead>Student</TableHead><TableHead>Class</TableHead><TableHead className="text-right">Balance</TableHead></TableRow></TableHeader>
              <TableBody>
                {STUDENTS.filter((s) => s.totalFees - s.paid > 0).map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell><Badge variant="outline">{s.classroom}</Badge></TableCell>
                    <TableCell className="text-right font-medium text-warning">{currency(s.totalFees - s.paid)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Collections by payment method</h3>
            <Table>
              <TableHeader><TableRow><TableHead>Method</TableHead><TableHead className="text-right">Count</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
              <TableBody>
                {["M-Pesa", "Cash", "Bank", "Cheque"].map((m) => {
                  const rows = RECEIPTS.filter((r) => r.method === m);
                  const sum = rows.reduce((s, r) => s + r.amount, 0);
                  return <TableRow key={m}><TableCell><Badge variant="outline">{m}</Badge></TableCell><TableCell className="text-right">{rows.length}</TableCell><TableCell className="text-right font-medium">{currency(sum)}</TableCell></TableRow>;
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card mt-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2"><FileSpreadsheet className="size-4 text-primary" />Receipt log</h3>
            <Button size="sm" variant="ghost" onClick={() => toast.success("CSV exported")}>Export CSV</Button>
          </div>
          <Table>
            <TableHeader><TableRow><TableHead>Receipt</TableHead><TableHead>Date</TableHead><TableHead>Student</TableHead><TableHead>Method</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
            <TableBody>
              {RECEIPTS.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.receiptNo}</TableCell>
                  <TableCell>{r.date}</TableCell>
                  <TableCell>{r.studentName}</TableCell>
                  <TableCell><Badge variant="outline">{r.method}</Badge></TableCell>
                  <TableCell className="text-right font-medium">{currency(r.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
