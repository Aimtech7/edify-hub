import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { PageHeader } from "@/components/ui-bits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FEE_CATEGORIES, currency } from "@/lib/sample-data";
import { AlertTriangle, CheckCircle2, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { paymentService } from "@/services/payment-service";
import { allocationService } from "@/services/allocation-service";
import type { Payment } from "@/types";

const CATEGORY_MAP: Record<string, string> = {
  "Course Fee": "Tuition",
  "Exam Registration": "Examination",
  "Study Materials": "Library",
  "Certificate Fee": "Registration",
  "Lab/Tech Fee": "Activity",
};

export default function AllocationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryPaymentId = searchParams.get("paymentId");

  const [payments, setPayments] = useState<Payment[]>([]);
  const [selectedPaymentId, setSelectedPaymentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [amounts, setAmounts] = useState<Record<string, string>>(() =>
    Object.fromEntries(FEE_CATEGORIES.map((c) => [c, "0"]))
  );

  const fetchUnallocatedPayments = async () => {
    setLoading(true);
    try {
      // Fetch only payments that are pending allocation
      const data = await paymentService.search({ unallocated: true });
      setPayments(data);

      if (data.length > 0) {
        // If query param is valid and in the list, select it
        const match = data.find((p) => p.id === queryPaymentId);
        if (match) {
          setSelectedPaymentId(match.id);
        } else {
          setSelectedPaymentId(data[0].id);
        }
      } else {
        setSelectedPaymentId("");
      }
    } catch (err) {
      toast.error("Failed to load unallocated payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnallocatedPayments();
  }, [queryPaymentId]);

  const currentPayment = useMemo(() => {
    return payments.find((p) => p.id === selectedPaymentId);
  }, [payments, selectedPaymentId]);

  // Update amounts when selected payment changes
  useEffect(() => {
    if (currentPayment) {
      setAmounts(
        Object.fromEntries(
          FEE_CATEGORIES.map((c) => {
            // If the payment somehow has existing allocations, populate them (usually 0 for pending)
            return [c, "0"];
          })
        )
      );
    }
  }, [currentPayment]);

  const total = useMemo(() => {
    return Object.values(amounts).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  }, [amounts]);

  const diff = useMemo(() => {
    if (!currentPayment) return 0;
    return currentPayment.amount - total;
  }, [currentPayment, total]);

  const handleSave = async () => {
    if (!selectedPaymentId || !currentPayment) {
      toast.error("No payment selected.");
      return;
    }

    if (diff !== 0) {
      toast.error(`Allocations are not balanced. Difference is ${currency(Math.abs(diff))}`);
      return;
    }

    setSubmitting(true);
    try {
      // Map frontend category names to backend Django models TextChoices
      const allocationsPayload = Object.entries(amounts)
        .map(([categoryLabel, amountStr]) => ({
          category: CATEGORY_MAP[categoryLabel] || categoryLabel,
          amount: parseFloat(amountStr) || 0,
        }))
        .filter((a) => a.amount > 0); // Only send active allocations

      await allocationService.allocate(selectedPaymentId, allocationsPayload);
      toast.success("Allocations saved successfully! Payment and receipt finalized.");
      
      // Clear query params and reload
      setSearchParams({});
      fetchUnallocatedPayments();
    } catch (err: any) {
      const errMsg = err?.response?.data?.detail || err?.response?.data?.message || "Failed to save allocations";
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="size-8 animate-spin text-primary mb-3" />
        <span className="text-muted-foreground text-sm">Loading pending payments...</span>
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <>
        <PageHeader title="Payment Allocations" description="Split a payment across fee categories. Allocated total must match received amount." />
        <Card className="shadow-card border-success/30 bg-success/5 max-w-2xl mx-auto mt-12 text-center p-8">
          <CardContent className="space-y-4">
            <div className="mx-auto size-12 rounded-full bg-success/10 flex items-center justify-center text-success">
              <CheckCircle2 className="size-6" />
            </div>
            <h3 className="font-semibold text-lg">All Payments Allocated!</h3>
            <p className="text-muted-foreground text-sm">
              There are currently no new payments pending allocation. All incoming transactions have been balanced across fee categories.
            </p>
            <div className="pt-2">
              <Button onClick={() => window.location.href = "/app/payments"} className="gradient-primary text-primary-foreground">
                Go to Payments List
              </Button>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Payment Allocations" description="Split a payment across fee categories. Allocated total must match received amount." />

      <Card className="shadow-card mb-4">
        <CardContent className="p-4 grid md:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label>Pending Payment Transaction</Label>
            <Select value={selectedPaymentId} onValueChange={setSelectedPaymentId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {payments.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.reference || "Unreferenced"} · {p.studentName} · {currency(p.amount)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {currentPayment && (
            <>
              <div>
                <div className="text-xs text-muted-foreground font-medium">Student Info</div>
                <div className="font-medium mt-1">{currentPayment.studentName}</div>
                <div className="text-xs text-muted-foreground">{currentPayment.admissionNo}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground font-medium">Received Amount</div>
                <div className="text-2xl font-display font-bold mt-1 text-primary">
                  {currency(currentPayment.amount)}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Recorded: {currentPayment.date} via {currentPayment.method}</div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {currentPayment && (
        <Card className="shadow-card">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Allocation breakdown</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEE_CATEGORIES.map((c) => (
                <div key={c} className="space-y-1.5">
                  <Label>{c}</Label>
                  <Input 
                    type="number" 
                    value={amounts[c]} 
                    min="0"
                    onChange={(e) => setAmounts((a) => ({ ...a, [c]: e.target.value }))} 
                  />
                </div>
              ))}
            </div>
            
            <div className={`mt-6 p-4 rounded-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${diff === 0 ? "border-success/30 bg-success/5" : "border-warning/40 bg-warning/5"}`}>
              <div className="flex items-center gap-3">
                {diff === 0 ? <CheckCircle2 className="size-5 text-success" /> : <AlertTriangle className="size-5 text-warning" />}
                <div>
                  <div className="text-sm font-semibold">
                    {diff === 0 ? "Allocations balanced" : `Difference of ${currency(Math.abs(diff))}`}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Allocated {currency(total)} of {currency(currentPayment.amount)}
                    {diff !== 0 && (diff > 0 ? " — under-allocated" : " — over-allocated")}
                  </div>
                </div>
              </div>
              <Button 
                disabled={diff !== 0 || submitting} 
                className="gradient-primary text-primary-foreground min-w-[120px]" 
                onClick={handleSave}
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save allocations"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
