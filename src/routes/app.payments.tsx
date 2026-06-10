import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/ui-bits";
import { RoleGate } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RECEIPTS, STUDENTS, currency } from "@/lib/sample-data";
import { Search, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/payments")({
  head: () => ({ meta: [{ title: "Payments — Horizon Academy" }] }),
  component: () => <RoleGate allowed={["accountant"]}><Payments /></RoleGate>,
});

function Payments() {
  const [q, setQ] = useState("");
  const [method, setMethod] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const list = RECEIPTS.filter((r) =>
    (method === "all" || r.method === method) &&
    (!from || r.date >= from) && (!to || r.date <= to) &&
    (!q
      || r.studentName.toLowerCase().includes(q.toLowerCase())
      || r.admissionNo.toLowerCase().includes(q.toLowerCase())
      || r.payer.toLowerCase().includes(q.toLowerCase())
      || r.reference.toLowerCase().includes(q.toLowerCase())
      || r.receiptNo.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <>
      <PageHeader title="Payments" description="Search, record and audit all incoming payments." action={<NewPaymentDialog />} />

      <Card className="shadow-card mb-4">
        <CardContent className="p-4 grid md:grid-cols-5 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Adm no, name, payer, phone, receipt, M-Pesa ref…" className="pl-9" />
          </div>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger><SelectValue placeholder="Method" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All methods</SelectItem>
              <SelectItem value="M-Pesa">M-Pesa</SelectItem>
              <SelectItem value="Cash">Cash</SelectItem>
              <SelectItem value="Bank">Bank</SelectItem>
              <SelectItem value="Cheque">Cheque</SelectItem>
            </SelectContent>
          </Select>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="p-6">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Receipt</TableHead><TableHead>Date</TableHead><TableHead>Student</TableHead>
              <TableHead>Payer</TableHead><TableHead>Method</TableHead><TableHead>Reference</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {list.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.receiptNo}</TableCell>
                  <TableCell>{r.date}</TableCell>
                  <TableCell><div className="font-medium">{r.studentName}</div><div className="text-xs text-muted-foreground">{r.admissionNo}</div></TableCell>
                  <TableCell>{r.payer}</TableCell>
                  <TableCell><Badge variant="outline">{r.method}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{r.reference}</TableCell>
                  <TableCell className="text-right font-semibold">{currency(r.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

function NewPaymentDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary text-primary-foreground"><Plus className="size-4 mr-2" />Record payment</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Record new payment</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); toast.success("Payment recorded. Proceed to allocations."); setOpen(false); }} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Student</Label>
            <Select defaultValue={STUDENTS[0].id}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STUDENTS.map((s) => <SelectItem key={s.id} value={s.id}>{s.name} · {s.admissionNo}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Payer name</Label><Input defaultValue="Mr. Wanjiru" /></div>
            <div className="space-y-1.5"><Label>Method</Label>
              <Select defaultValue="M-Pesa"><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="M-Pesa">M-Pesa</SelectItem><SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank">Bank Transfer</SelectItem><SelectItem value="Cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>Amount (KES)</Label><Input type="number" defaultValue={15000} /></div>
            <div className="space-y-1.5"><Label>Reference no</Label><Input placeholder="M-Pesa code / Cheque no" /></div>
          </div>
          <div className="space-y-1.5"><Label>Notes</Label><Textarea rows={2} placeholder="Optional notes" /></div>
          <DialogFooter><Button type="submit" className="gradient-primary text-primary-foreground">Save payment</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
