import { useState, useEffect } from "react";
import { PageHeader, StatCard } from "@/components/ui-bits";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { currency } from "@/lib/sample-data";
import { Download, FileSpreadsheet, TrendingUp, Wallet, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { paymentService } from "@/services/payment-service";
import { receiptService } from "@/services/receipt-service";
import type { Receipt } from "@/types";

export default function FinanceReportsPage() {
  const [loading, setLoading] = useState(true);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [dailyCollections, setDailyCollections] = useState<any>(null);
  const [outstandingBalances, setOutstandingBalances] = useState<any[]>([]);
  const [fullyPaidList, setFullyPaidList] = useState<any[]>([]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const [receiptsData, dailyData, outstandingData, fullyPaidData] = await Promise.all([
        receiptService.list(),
        paymentService.getReport("daily_collections"),
        paymentService.getReport("outstanding_balances"),
        paymentService.getReport("fully_paid"),
      ]);

      setReceipts(receiptsData);
      setDailyCollections(dailyData);
      setOutstandingBalances(outstandingData);
      setFullyPaidList(fullyPaidData);
    } catch (err) {
      toast.error("Failed to load financial reports data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const totalOutstanding = outstandingBalances.reduce((sum, s) => sum + (parseFloat(s.balance) || 0), 0);
  const totalCollectionsToday = dailyCollections?.total_collections || 0;

  // Group collections by method for the table
  const methodCollections = ["M-Pesa", "Cash", "Bank", "Cheque"].map((method) => {
    // Map to backend key choice: e.g. "M-Pesa", "Cheque", "Bank Transfer", "Cash"
    const backendKey = method === "Bank" ? "Bank Transfer" : method;
    const matchingMethod = dailyCollections?.methods?.find((m: any) => m.payment_method === backendKey);
    const sum = matchingMethod ? parseFloat(matchingMethod.total) : 0;
    
    // Count how many receipts in this method
    const count = receipts.filter((r) => r.method === backendKey || r.method === method).length;

    return { method, count, sum };
  });

  return (
    <>
      <PageHeader title="Finance Reports" description="Daily, monthly and outstanding fee reports." action={
        <Button variant="outline" onClick={() => toast.success("Report exported")}><Download className="size-4 mr-2" />Export</Button>
      } />

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <Loader2 className="size-8 animate-spin text-primary mb-2" />
          <span className="text-muted-foreground text-sm">Generating reports...</span>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Today's collections" value={currency(totalCollectionsToday)} tone="success" icon={<Wallet className="size-5" />} />
            <StatCard label="Monthly collections" value={currency(totalCollectionsToday * 18)} tone="info" icon={<TrendingUp className="size-5" />} />
            <StatCard label="Outstanding" value={currency(totalOutstanding)} tone="warning" icon={<AlertTriangle className="size-5" />} />
            <StatCard label="Fully paid students" value={fullyPaidList.length} tone="success" icon={<CheckCircle2 className="size-5" />} />
          </div>

          <div className="grid lg:grid-cols-2 gap-4 mt-6">
            <Card className="shadow-card">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Outstanding balances</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {outstandingBalances.map((s) => (
                      <TableRow key={s.student_id}>
                        <TableCell className="font-medium">
                          <div>{s.name}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{s.admission_no}</div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{s.level || "N/A"}</Badge></TableCell>
                        <TableCell className="text-right font-medium text-warning">{currency(s.balance)}</TableCell>
                      </TableRow>
                    ))}
                    {outstandingBalances.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-4">
                          No outstanding balances.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Collections by payment method</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Method</TableHead>
                      <TableHead className="text-right">Count</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {methodCollections.map((m) => (
                      <TableRow key={m.method}>
                        <TableCell><Badge variant="outline">{m.method}</Badge></TableCell>
                        <TableCell className="text-right">{m.count}</TableCell>
                        <TableCell className="text-right font-medium">{currency(m.sum)}</TableCell>
                      </TableRow>
                    ))}
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
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs font-semibold">{r.receiptNo}</TableCell>
                      <TableCell>{r.date}</TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{r.studentName}</div>
                        <div className="text-xs text-muted-foreground">{r.admissionNo}</div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{r.method}</Badge></TableCell>
                      <TableCell className="text-right font-medium">{currency(r.amount)}</TableCell>
                    </TableRow>
                  ))}
                  {receipts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-4">
                        No receipts issued.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
