import { useState, useEffect } from "react";
import { PageHeader, StatCard } from "@/components/ui-bits";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { studentService } from "@/services/student-service";
import { resultService } from "@/services/result-service";
import { STUDENTS, STUDENT_RESULTS, RECEIPTS, currency } from "@/lib/sample-data";
import { Users, GraduationCap, Wallet, Activity, FileText, Download, CreditCard, Clock } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function ParentPortal() {
  const navigate = useNavigate();
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchChildren = async () => {
      try {
        const res = await studentService.getMyChildren();
        if (active) setChildren(res);
      } catch (err) {
        toast.error("Failed to load children records");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchChildren();
    return () => { active = false; };
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading Parent Portal overview...</div>;
  }

  // Calculate aggregated stats across all children
  const totalFees = children.reduce((acc, c) => acc + (c.total_fees || 0), 0);
  const totalPaid = children.reduce((acc, c) => acc + (c.total_paid || 0), 0);
  const totalBalance = totalFees - totalPaid;
  const avgAttendance = children.length > 0 
    ? (children.reduce((acc, c) => acc + (c.attendance_rate || 100), 0) / children.length).toFixed(1)
    : "100";

  return (
    <>
      <PageHeader
        title="Parent / Guardian Portal"
        description="Monitor your children's CEFR German academic progression, attendance, and financial status."
        action={
          <Button onClick={() => navigate("/app/receipts")} variant="outline">
            <FileText className="size-4 mr-2" /> View Receipts
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Linked Children" value={children.length} icon={<Users className="size-5" />} tone="info" />
        <StatCard label="Avg Attendance" value={`${avgAttendance}%`} icon={<Activity className="size-5" />} tone="success" />
        <StatCard label="Total Fees Invoiced" value={currency(totalFees)} icon={<Wallet className="size-5" />} />
        <StatCard label="Outstanding Balance" value={currency(totalBalance)} icon={<Clock className="size-5" />} tone={totalBalance > 0 ? "warning" : "success"} />
      </div>

      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <GraduationCap className="size-5 text-primary" /> My Children
      </h3>

      <div className="grid lg:grid-cols-2 gap-6">
        {children.map((child) => {
          const fullName = `${child.first_name} ${child.last_name}`;
          const bal = (child.total_fees || 0) - (child.total_paid || 0);
          
          // Match fixture student for detailed tabs/results if available
          const fixtureMatch = STUDENTS.find(s => s.admissionNo === child.admission_number) || STUDENTS[0];
          const childResults = STUDENT_RESULTS.slice(0, 4);

          return (
            <Card key={child.id || child.admission_number} className="shadow-card overflow-hidden border-t-4 border-t-primary">
              <CardHeader className="bg-muted/30 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold">{fullName}</CardTitle>
                    <p className="text-xs font-mono text-muted-foreground mt-0.5">{child.admission_number}</p>
                  </div>
                  <Badge className="gradient-primary text-primary-foreground font-semibold px-3 py-1">
                    Level {child.current_level_name}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Metrics row */}
                <div className="grid grid-cols-3 gap-3 bg-muted/20 p-3 rounded-lg border border-border/50 text-center">
                  <div>
                    <div className="text-[11px] text-muted-foreground uppercase font-medium">Attendance</div>
                    <div className="text-base font-bold text-success mt-0.5">{child.attendance_rate}%</div>
                  </div>
                  <div className="border-x border-border/60">
                    <div className="text-[11px] text-muted-foreground uppercase font-medium">Fees Paid</div>
                    <div className="text-base font-bold text-foreground mt-0.5">{currency(child.total_paid || 0)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground uppercase font-medium">Balance</div>
                    <div className={`text-base font-bold mt-0.5 ${bal > 0 ? "text-warning" : "text-success"}`}>
                      {currency(bal > 0 ? bal : 0)}
                    </div>
                  </div>
                </div>

                {/* Academic results preview */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent Academic Performance</h4>
                    <Badge variant="outline" className="text-[10px]">CEFR {child.current_level_name}</Badge>
                  </div>
                  <div className="space-y-2">
                    {childResults.map((r) => (
                      <div key={r.subject} className="flex items-center justify-between p-2.5 rounded bg-muted/30 text-sm">
                        <span className="font-medium">{r.subject}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs">{r.score}%</span>
                          <Badge variant={r.score >= 60 ? "secondary" : "destructive"} className="text-[10px] px-1.5">
                            {r.grade}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      toast.success(`Downloading report card for ${fullName}...`);
                    }}
                  >
                    <Download className="size-3.5 mr-1.5" /> Report Card
                  </Button>

                  {bal > 0 ? (
                    <Button 
                      size="sm" 
                      className="gradient-primary text-primary-foreground"
                      onClick={() => {
                        toast.info(`Redirecting to secure online payment portal for ${child.admission_number}...`);
                      }}
                    >
                      <CreditCard className="size-3.5 mr-1.5" /> Pay {currency(bal)}
                    </Button>
                  ) : (
                    <Badge className="bg-success/15 text-success border-success/20 py-1.5 px-3">
                      Fees Fully Cleared ✓
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
