import { useState } from "react";
import {
  Briefcase, Users, Calendar, DollarSign, Award, CheckCircle2,
  XCircle, Search, Plus, Filter, FileText, Check, Clock, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface StaffMember {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  designation: string;
  salary: number;
  status: "Active" | "On Leave" | "Inactive";
}

interface LeaveReq {
  id: string;
  employeeName: string;
  employeeId: string;
  type: string;
  dates: string;
  days: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

interface PayrollItem {
  id: string;
  employeeName: string;
  month: string;
  basic: number;
  allowances: number;
  deductions: number;
  net: number;
  status: "DRAFT" | "PAID";
}

export function HrPortal() {
  const [activeTab, setActiveTab] = useState("directory");
  const [searchTerm, setSearchTerm] = useState("");

  const [staffList] = useState<StaffMember[]>([
    { id: "1", employeeId: "EMP-AC-01", name: "Frau Anna Müller", department: "Academic & Instruction", designation: "Senior German Instructor", salary: 145000, status: "Active" },
    { id: "2", employeeId: "EMP-AC-02", name: "Herr Hans Schmidt", department: "Academic & Instruction", designation: "B2/C1 Lecturer", salary: 135000, status: "Active" },
    { id: "3", employeeId: "EMP-FN-01", name: "Grace Achieng", department: "Finance & Accounting", designation: "Chief Accountant", salary: 160000, status: "Active" },
    { id: "4", employeeId: "EMP-AD-01", name: "Beatrix Otieno", department: "Administration & HR", designation: "HR Manager", salary: 155000, status: "On Leave" },
  ]);

  const [leaveRequests, setLeaveRequests] = useState<LeaveReq[]>([
    { id: "l1", employeeName: "Frau Anna Müller", employeeId: "EMP-AC-01", type: "Annual Leave", dates: "12 Jul 2026 - 22 Jul 2026", days: 10, reason: "Summer holiday travel to Germany", status: "PENDING" },
    { id: "l2", employeeName: "Herr Hans Schmidt", employeeId: "EMP-AC-02", type: "Sick Leave", dates: "15 Jun 2026 - 17 Jun 2026", days: 3, reason: "Severe flu medical recommendation", status: "APPROVED" },
    { id: "l3", employeeName: "Beatrix Otieno", employeeId: "EMP-AD-01", type: "Maternity Leave", dates: "01 Jun 2026 - 31 Aug 2026", days: 90, reason: "Maternity leave entitlement", status: "APPROVED" },
  ]);

  const [payrolls, setPayrolls] = useState<PayrollItem[]>([
    { id: "p1", employeeName: "Frau Anna Müller", month: "June 2026", basic: 145000, allowances: 25000, deductions: 32000, net: 138000, status: "PAID" },
    { id: "p2", employeeName: "Herr Hans Schmidt", month: "June 2026", basic: 135000, allowances: 20000, deductions: 29000, net: 126000, status: "PAID" },
    { id: "p3", employeeName: "Grace Achieng", month: "June 2026", basic: 160000, allowances: 30000, deductions: 36000, net: 154000, status: "DRAFT" },
  ]);

  const handleApproveLeave = (id: string) => {
    setLeaveRequests((prev) => prev.map((l) => l.id === id ? { ...l, status: "APPROVED" } : l));
  };

  const handleRejectLeave = (id: string) => {
    setLeaveRequests((prev) => prev.map((l) => l.id === id ? { ...l, status: "REJECTED" } : l));
  };

  const handleMarkPaid = (id: string) => {
    setPayrolls((prev) => prev.map((p) => p.id === id ? { ...p, status: "PAID" } : p));
  };

  const filteredStaff = staffList.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.designation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 text-xs uppercase font-semibold tracking-wider mb-2">
              <Briefcase className="size-4" /> Enterprise HR & Payroll Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold">Human Resources Management</h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Manage institute faculty, process payroll ledgers, review performance evaluations, and streamline leave request workflows.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 shadow-lg">
              <Plus className="size-4" /> Add Employee
            </Button>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 size-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/60 backdrop-blur border-border/60 shadow-sm hover:shadow transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Staff</CardTitle>
            <div className="size-8 rounded-lg bg-indigo-500/10 text-indigo-500 grid place-items-center"><Users className="size-4" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">42</div>
            <p className="text-xs text-muted-foreground mt-1"><span className="text-emerald-500 font-medium">+3</span> hired this quarter</p>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur border-border/60 shadow-sm hover:shadow transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">On Leave Today</CardTitle>
            <div className="size-8 rounded-lg bg-amber-500/10 text-amber-500 grid place-items-center"><Calendar className="size-4" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">3</div>
            <p className="text-xs text-muted-foreground mt-1">2 Academic, 1 Admin staff</p>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur border-border/60 shadow-sm hover:shadow transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Payroll</CardTitle>
            <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-500 grid place-items-center"><DollarSign className="size-4" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">KES 4.25M</div>
            <p className="text-xs text-muted-foreground mt-1">June 2026 Disbursement</p>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur border-border/60 shadow-sm hover:shadow transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Leaves</CardTitle>
            <div className="size-8 rounded-lg bg-rose-500/10 text-rose-500 grid place-items-center"><AlertCircle className="size-4" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display">{leaveRequests.filter(l => l.status === "PENDING").length}</div>
            <p className="text-xs text-muted-foreground mt-1">Requires HR Officer review</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/60 p-1 rounded-xl h-12 flex items-center justify-start gap-1 w-full sm:w-auto overflow-x-auto">
          <TabsTrigger value="directory" className="rounded-lg gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm px-4">
            <Users className="size-4" /> Staff Directory
          </TabsTrigger>
          <TabsTrigger value="leaves" className="rounded-lg gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm px-4">
            <Calendar className="size-4" /> Leave Workflows
            {leaveRequests.some(l => l.status === "PENDING") && (
              <span className="size-2 rounded-full bg-rose-500 ml-1" />
            )}
          </TabsTrigger>
          <TabsTrigger value="payroll" className="rounded-lg gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm px-4">
            <DollarSign className="size-4" /> Payroll Ledgers
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Staff Directory */}
        <TabsContent value="directory" className="space-y-4">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
              <div>
                <CardTitle className="text-lg font-semibold">Faculty & Staff Roster</CardTitle>
                <CardDescription>Comprehensive directory of all teaching and non-teaching institute employees.</CardDescription>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, EMP ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 bg-muted/40"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left font-medium text-muted-foreground">
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Department</th>
                      <th className="py-3 px-4">Designation</th>
                      <th className="py-3 px-4 text-right">Basic Salary</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredStaff.map((staff) => (
                      <tr key={staff.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-medium text-foreground">{staff.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{staff.employeeId}</div>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{staff.department}</td>
                        <td className="py-3 px-4 font-medium">{staff.designation}</td>
                        <td className="py-3 px-4 text-right font-mono">KES {staff.salary.toLocaleString()}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={staff.status === "Active" ? "default" : "secondary"} className={staff.status === "Active" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"}>
                            {staff.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button variant="ghost" size="sm" className="h-8 text-xs">View Profile</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Leave Workflows */}
        <TabsContent value="leaves" className="space-y-4">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-4 border-b border-border">
              <CardTitle className="text-lg font-semibold">Leave Applications & Approval Pipeline</CardTitle>
              <CardDescription>Review employee leave submissions, inspect date overlaps, and grant authorizations.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left font-medium text-muted-foreground">
                      <th className="py-3 px-4">Applicant</th>
                      <th className="py-3 px-4">Leave Type</th>
                      <th className="py-3 px-4">Duration</th>
                      <th className="py-3 px-4">Reason</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Decision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {leaveRequests.map((req) => (
                      <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-medium text-foreground">{req.employeeName}</div>
                          <div className="text-xs text-muted-foreground font-mono">{req.employeeId}</div>
                        </td>
                        <td className="py-3 px-4 font-medium">{req.type}</td>
                        <td className="py-3 px-4">
                          <div className="text-xs">{req.dates}</div>
                          <div className="text-[10px] text-muted-foreground">{req.days} business days</div>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-muted-foreground">{req.reason}</td>
                        <td className="py-3 px-4 text-center">
                          {req.status === "PENDING" && <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30"><Clock className="size-3 mr-1" /> Pending</Badge>}
                          {req.status === "APPROVED" && <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30"><Check className="size-3 mr-1" /> Approved</Badge>}
                          {req.status === "REJECTED" && <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30"><XCircle className="size-3 mr-1" /> Rejected</Badge>}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {req.status === "PENDING" ? (
                            <div className="flex items-center justify-end gap-1">
                              <Button size="sm" variant="outline" className="h-7 text-xs bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/30" onClick={() => handleApproveLeave(req.id)}>
                                Approve
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 text-xs bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 border-rose-500/30" onClick={() => handleRejectLeave(req.id)}>
                                Reject
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Resolved</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Payroll Ledgers */}
        <TabsContent value="payroll" className="space-y-4">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
              <div>
                <CardTitle className="text-lg font-semibold">Monthly Payroll Ledger — June 2026</CardTitle>
                <CardDescription>Automated gross-to-net calculations including PAYE, NHIF, and pension contributions.</CardDescription>
              </div>
              <Button size="sm" className="gap-2"><FileText className="size-4" /> Export Bank File (.CSV)</Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left font-medium text-muted-foreground">
                      <th className="py-3 px-4">Employee</th>
                      <th className="py-3 px-4">Pay Period</th>
                      <th className="py-3 px-4 text-right">Basic Salary</th>
                      <th className="py-3 px-4 text-right">Allowances</th>
                      <th className="py-3 px-4 text-right">Deductions</th>
                      <th className="py-3 px-4 text-right font-semibold">Net Disbursement</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {payrolls.map((pay) => (
                      <tr key={pay.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-medium">{pay.employeeName}</td>
                        <td className="py-3 px-4 text-muted-foreground">{pay.month}</td>
                        <td className="py-3 px-4 text-right font-mono">KES {pay.basic.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-600">+KES {pay.allowances.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right font-mono text-rose-600">-KES {pay.deductions.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-foreground">KES {pay.net.toLocaleString()}</td>
                        <td className="py-3 px-4 text-center">
                          <Badge variant={pay.status === "PAID" ? "default" : "outline"} className={pay.status === "PAID" ? "bg-emerald-500 text-white" : "border-amber-500/50 text-amber-600"}>
                            {pay.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {pay.status === "DRAFT" ? (
                            <Button size="sm" className="h-7 text-xs bg-indigo-600 hover:bg-indigo-500 text-white" onClick={() => handleMarkPaid(pay.id)}>
                              Disburse Pay
                            </Button>
                          ) : (
                            <Button variant="ghost" size="sm" className="h-7 text-xs">Payslip</Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
