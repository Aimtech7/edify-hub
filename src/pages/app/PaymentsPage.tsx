import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui-bits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { currency } from "@/lib/sample-data";
import { Search, Plus, SlidersHorizontal, RotateCcw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { paymentService } from "@/services/payment-service";
import { studentService } from "@/services/student-service";
import type { Payment, Student, PaymentMethod } from "@/types";

export default function PaymentsPage() {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Search filter states
  const [searchAdm, setSearchAdm] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchPayer, setSearchPayer] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [searchReceiptNo, setSearchReceiptNo] = useState("");
  const [searchRef, setSearchRef] = useState("");
  const [method, setMethod] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await paymentService.search({
        admissionNo: searchAdm || undefined,
        studentName: searchName || undefined,
        parentName: searchPayer || undefined,
        phone: searchPhone || undefined,
        receiptNo: searchReceiptNo || undefined,
        mpesaRef: searchRef || undefined,
        chequeNo: searchRef || undefined,
        dateFrom: from || undefined,
        dateTo: to || undefined,
      });
      setPayments(data);
    } catch (err) {
      toast.error("Failed to fetch payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [searchAdm, searchName, searchPayer, searchPhone, searchReceiptNo, searchRef, from, to]);

  const handleReset = () => {
    setSearchAdm("");
    setSearchName("");
    setSearchPayer("");
    setSearchPhone("");
    setSearchReceiptNo("");
    setSearchRef("");
    setMethod("all");
    setFrom("");
    setTo("");
    toast.info("Search filters reset");
  };

  // Filter by payment method client-side (as backend queryset does not explicitly filter by method)
  const list = payments.filter((p) => {
    return method === "all" || p.method === method;
  });

  return (
    <>
      <PageHeader 
        title="Payments ERP" 
        description="Record, search, and manage all incoming fee transactions." 
        action={<NewPaymentDialog onCreated={fetchPayments} />} 
      />

      <Card className="shadow-card mb-4">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                value={searchName} 
                onChange={(e) => setSearchName(e.target.value)} 
                placeholder="Quick search by Student Name..." 
                className="pl-9 bg-muted/40" 
              />
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={showAdvanced ? "bg-primary/5 border-primary text-primary" : ""}
            >
              <SlidersHorizontal className="size-4 mr-2" />
              Advanced Filters
            </Button>
            <Button variant="ghost" size="icon" onClick={handleReset} title="Reset filters">
              <RotateCcw className="size-4" />
            </Button>
          </div>

          {showAdvanced && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-border animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="space-y-1.5">
                <Label htmlFor="searchAdm">Admission Number</Label>
                <Input id="searchAdm" value={searchAdm} onChange={(e) => setSearchAdm(e.target.value)} placeholder="e.g. DA-2024-1042" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="searchPayer">Parent / Payer Name</Label>
                <Input id="searchPayer" value={searchPayer} onChange={(e) => setSearchPayer(e.target.value)} placeholder="e.g. Mr. Wanjiru" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="searchPhone">Phone Number</Label>
                <Input id="searchPhone" value={searchPhone} onChange={(e) => setSearchPhone(e.target.value)} placeholder="e.g. +254..." />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="searchReceiptNo">Receipt Number</Label>
                <Input id="searchReceiptNo" value={searchReceiptNo} onChange={(e) => setSearchReceiptNo(e.target.value)} placeholder="e.g. RCT-000001" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="searchRef">Payment Reference (M-Pesa/Cheque)</Label>
                <Input id="searchRef" value={searchRef} onChange={(e) => setSearchRef(e.target.value)} placeholder="e.g. SFA8KQ12M" />
              </div>
              <div className="space-y-1.5">
                <Label>Payment Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger><SelectValue placeholder="Method" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All methods</SelectItem>
                    <SelectItem value="M-Pesa">M-Pesa</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Bank">Bank Transfer</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 col-span-1">
                <Label>Date Range</Label>
                <div className="flex gap-2">
                  <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full text-xs" />
                  <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-full text-xs" />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Payments list</h3>
            <span className="text-xs text-muted-foreground">
              {loading ? "Loading..." : `Found ${list.length} transactions`}
            </span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-primary mr-2" />
              <span className="text-muted-foreground text-sm">Fetching payments...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt / Reference</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Payer</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-mono text-xs font-semibold">{r.id.startsWith("p-") ? "Pending" : `RCT-${r.id.padStart(6, "0")}`}</div>
                      <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{r.reference || "—"}</div>
                    </TableCell>
                    <TableCell className="text-sm">{r.date}</TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{r.studentName}</div>
                      <div className="text-xs text-muted-foreground">{r.admissionNo}</div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.payer}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.method}</Badge>
                    </TableCell>
                    <TableCell>
                      {r.allocated ? (
                        <Badge className="bg-success/15 text-success border-success/20">Allocated</Badge>
                      ) : (
                        <Badge className="bg-warning/15 text-warning border-warning/30">Pending Allocation</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-success">{currency(r.amount)}</TableCell>
                  </TableRow>
                ))}
                {list.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No transactions match your search criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function NewPaymentDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Form states
  const [studentId, setStudentId] = useState("");
  const [payerName, setPayerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("M-Pesa");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setLoadingStudents(true);
      studentService.list()
        .then((res) => {
          setStudents(res);
          if (res.length > 0) {
            setStudentId(res[0].id);
            // Default payer name to student's name initially if desired
            setPayerName("");
            setPhoneNumber(res[0].phone || "");
          }
        })
        .catch(() => toast.error("Failed to load students"))
        .finally(() => setLoadingStudents(false));
    }
  }, [open]);

  // Update phone number automatically when student changes
  const handleStudentChange = (val: string) => {
    setStudentId(val);
    const selected = students.find((s) => s.id === val);
    if (selected) {
      setPhoneNumber(selected.phone || "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) {
      toast.error("Please select a student.");
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid payment amount.");
      return;
    }
    if (!reference.trim()) {
      toast.error("Please enter a payment reference (M-Pesa code, Cheque number, etc).");
      return;
    }

    setSubmitting(true);
    try {
      await paymentService.create({
        studentId,
        amount: parseFloat(amount),
        method,
        reference: reference.trim(),
        notes: notes.trim(),
        payerName: payerName.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        nationalId: nationalId.trim() || undefined,
      });

      toast.success("Payment recorded successfully! Proceeding to allocations.");
      setOpen(false);
      onCreated();

      // Reset fields
      setPayerName("");
      setPhoneNumber("");
      setNationalId("");
      setAmount("");
      setReference("");
      setNotes("");
    } catch (err) {
      toast.error("Failed to save payment transaction.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary text-primary-foreground">
          <Plus className="size-4 mr-2" />Record payment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record new payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Student</Label>
            {loadingStudents ? (
              <div className="text-xs text-muted-foreground flex items-center gap-2 py-2">
                <Loader2 className="size-3 animate-spin" /> Loading students...
              </div>
            ) : (
              <Select value={studentId} onValueChange={handleStudentChange}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} · {s.admissionNo} (Level {s.level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Payer Name</Label>
              <Input value={payerName} onChange={(e) => setPayerName(e.target.value)} placeholder="e.g. Mr. Wanjiru" />
            </div>
            <div className="space-y-1.5">
              <Label>Method</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="M-Pesa">M-Pesa</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Bank">Bank Transfer</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Amount (KES)</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" required />
            </div>
            <div className="space-y-1.5">
              <Label>Reference No</Label>
              <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="M-Pesa code / Cheque no" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Phone Number</Label>
              <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="e.g. +254..." />
            </div>
            <div className="space-y-1.5">
              <Label>National ID</Label>
              <Input value={nationalId} onChange={(e) => setNationalId(e.target.value)} placeholder="Optional ID" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional payment notes" />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={submitting} className="gradient-primary text-primary-foreground w-full">
              {submitting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Saving Payment...
                </>
              ) : (
                "Save Payment"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
