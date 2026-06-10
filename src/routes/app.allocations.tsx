import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/ui-bits";
import { RoleGate } from "@/components/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FEE_CATEGORIES, RECEIPTS, currency } from "@/lib/sample-data";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/allocations")({
  head: () => ({ meta: [{ title: "Allocations — Horizon Academy" }] }),
  component: () => <RoleGate allowed={["accountant"]}><Allocations /></RoleGate>,
});

function Allocations() {
  const [receiptId, setReceiptId] = useState(RECEIPTS[0].id);
  const receipt = RECEIPTS.find((r) => r.id === receiptId)!;
  const [amounts, setAmounts] = useState<Record<string, string>>(() =>
    Object.fromEntries(FEE_CATEGORIES.map((c) => [c, String(receipt.allocations.find((a) => a.category === c)?.amount ?? 0)]))
  );
  const total = useMemo(() => Object.values(amounts).reduce((s, v) => s + (parseInt(v || "0", 10) || 0), 0), [amounts]);
  const diff = receipt.amount - total;

  return (
    <>
      <PageHeader title="Payment Allocations" description="Split a payment across fee categories. Allocated total must match received amount." />

      <Card className="shadow-card mb-4">
        <CardContent className="p-4 grid md:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>Receipt</Label>
            <Select value={receiptId} onValueChange={(v) => {
              setReceiptId(v);
              const r = RECEIPTS.find((x) => x.id === v)!;
              setAmounts(Object.fromEntries(FEE_CATEGORIES.map((c) => [c, String(r.allocations.find((a) => a.category === c)?.amount ?? 0)])));
            }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{RECEIPTS.map((r) => <SelectItem key={r.id} value={r.id}>{r.receiptNo} · {r.studentName} · {currency(r.amount)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><div className="text-xs text-muted-foreground">Student</div><div className="font-medium mt-1">{receipt.studentName}</div><div className="text-xs text-muted-foreground">{receipt.admissionNo}</div></div>
          <div><div className="text-xs text-muted-foreground">Received</div><div className="text-2xl font-display font-bold mt-1">{currency(receipt.amount)}</div></div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Allocation breakdown</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEE_CATEGORIES.map((c) => (
              <div key={c} className="space-y-1.5">
                <Label>{c}</Label>
                <Input type="number" value={amounts[c]} onChange={(e) => setAmounts((a) => ({ ...a, [c]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div className={`mt-6 p-4 rounded-lg border flex items-center justify-between ${diff === 0 ? "border-success/30 bg-success/10" : "border-warning/40 bg-warning/10"}`}>
            <div className="flex items-center gap-3">
              {diff === 0 ? <CheckCircle2 className="size-5 text-success" /> : <AlertTriangle className="size-5 text-warning" />}
              <div>
                <div className="text-sm font-semibold">{diff === 0 ? "Allocations balanced" : `Difference of ${currency(Math.abs(diff))}`}</div>
                <div className="text-xs text-muted-foreground">
                  Allocated {currency(total)} of {currency(receipt.amount)}
                  {diff !== 0 && (diff > 0 ? " — under-allocated" : " — over-allocated")}
                </div>
              </div>
            </div>
            <Button disabled={diff !== 0} className="gradient-primary text-primary-foreground" onClick={() => toast.success("Allocations saved")}>Save allocations</Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
