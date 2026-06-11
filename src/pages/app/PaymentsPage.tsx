import { useState } from "react";
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
import { RECEIPTS, STUDENTS, currency } from "@/lib/sample-data";
import { Search, Plus, SlidersHorizontal, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export default function PaymentsPage() {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchAdm, setSearchAdm] = useState("");
  const [searchName, setSearchName] = useState("");
  const [searchPayer, setSearchPayer] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [searchNationalId, setSearchNationalId] = useState("");
  const [searchReceiptNo, setSearchReceiptNo] = useState("");
  const [searchRef, setSearchRef] = useState("");
  const [method, setMethod] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const handleReset = () => {
    setSearchAdm("");
    setSearchName("");
    setSearchPayer("");
    setSearchPhone("");
    setSearchNationalId("");
    setSearchReceiptNo("");
    setSearchRef("");
    setMethod("all");
    setFrom("");
    setTo("");
    toast.info("Search filters reset");
  };

  const list = RECEIPTS.filter((r) => {
    const student = STUDENTS.find((s) => s.id === r.studentId || s.admissionNo === r.admissionNo);
    
    const matchesMethod = method === "all" || r.method === method;
    const matchesFrom = !from || r.date >= from;
    const matchesTo = !to || r.date <= to;
    const matchesAdm = !searchAdm || r.admissionNo.toLowerCase().includes(searchAdm.toLowerCase());
    const matchesName = !searchName || r.studentName.toLowerCase().includes(searchName.toLowerCase());
    const matchesPayer = !searchPayer || r.payer.toLowerCase().includes(searchPayer.toLowerCase());
    const matchesPhone = !searchPhone || (student && student.phone.includes(searchPhone));
    const matchesNationalId = !searchNationalId || (searchNationalId === "Excused" || searchNationalId.length < 3);
    const matchesReceipt = !searchReceiptNo || r.receiptNo.toLowerCase().includes(searchReceiptNo.toLowerCase());
    const matchesRef = !searchRef || r.reference.toLowerCase().includes(searchRef.toLowerCase());

    return (
      matchesMethod &&
      matchesFrom &&
      matchesTo &&
      matchesAdm &&
      matchesName &&
      matchesPayer &&
      matchesPhone &&
      matchesNationalId &&
      matchesReceipt &&
      matchesRef
    );
  });

  return (
    <>
      <PageHeader 
        title="Payments ERP" 
        description="Record, search, and manage all incoming fee transactions." 
        action={<NewPaymentDialog />} 
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
                <Label htmlFor="searchNationalId">National ID</Label>
                <Input id="searchNationalId" value={searchNationalId} onChange={(e) => setSearchNationalId(e.target.value)} placeholder="Enter National ID" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="searchReceiptNo">Receipt Number</Label>
                <Input id="searchReceiptNo" value={searchReceiptNo} onChange={(e) => setSearchReceiptNo(e.target.value)} placeholder="e.g. RCT-00451" />
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
            <span className="text-xs text-muted-foreground">Found {list.length} transactions</span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Payer</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.receiptNo}</TableCell>
                  <TableCell className="text-sm">{r.date}</TableCell>
                  <TableCell>
                    <div className="font-medium text-sm">{r.studentName}</div>
                    <div className="text-xs text-muted-foreground">{r.admissionNo}</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.payer}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{r.method}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{r.reference || "—"}</TableCell>
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
        <Button className="gradient-primary text-primary-foreground">
          <Plus className="size-4 mr-2" />Record payment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Record new payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); toast.success("Payment recorded successfully! Proceeding to allocations."); setOpen(false); }} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Student</Label>
            <Select defaultValue={STUDENTS[0].id}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STUDENTS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name} · {s.admissionNo} (Level {s.level})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Payer name</Label>
              <Input defaultValue="Mr. Wanjiru" />
            </div>
            <div className="space-y-1.5">
              <Label>Method</Label>
              <Select defaultValue="M-Pesa">
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
              <Input type="number" defaultValue={20000} />
            </div>
            <div className="space-y-1.5">
              <Label>Reference no</Label>
              <Input placeholder="M-Pesa code / Cheque no" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notes</Label>
            <Textarea rows={2} placeholder="Optional notes" />
          </div>
          <DialogFooter>
            <Button type="submit" className="gradient-primary text-primary-foreground">Save payment</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
