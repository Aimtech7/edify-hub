import React, { useState, useEffect } from "react";
import {
  Activity, DollarSign, Users, BookOpen, Layers, ShieldCheck, Cpu, Search,
  Download, Printer, Bot, Send, Calendar, CheckCircle2, AlertCircle, FileText,
  PieChart, TrendingUp, RefreshCw, Filter, Database, Clock, ArrowRight, Server,
  GraduationCap, MessageSquare, Award, Zap, UserCheck, Globe
} from "lucide-react";
import {
  analyticsService, CommandCenterData, FinanceBIData, AcademicBIData,
  AdmissionsBIData, OdelBIData, CommunicationBIData, ExamBIData,
  CertificateBIData, ReportResult, SearchResult
} from "@/services/analyticsService";

type TabId = "overview" | "finance" | "academic" | "admissions" | "odel" | "exams" | "certificates" | "communication" | "reports" | "ai" | "search";

const KpiCard = ({
  label, value, color = "text-white", sub
}: { label: string; value: string | number; color?: string; sub?: string }) => (
  <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 hover:border-slate-600 transition">
    <div className="text-slate-400 text-xs font-bold uppercase tracking-wide">{label}</div>
    <div className={`text-xl font-black mt-1 ${color}`}>{value}</div>
    {sub && <div className="text-slate-500 text-xs mt-0.5">{sub}</div>}
  </div>
);

export default function ExecutiveCommandCenterPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [loading, setLoading] = useState(true);

  // Data States
  const [cmdData, setCmdData] = useState<CommandCenterData | null>(null);
  const [finData, setFinData] = useState<FinanceBIData | null>(null);
  const [acadData, setAcadData] = useState<AcademicBIData | null>(null);
  const [admData, setAdmData] = useState<AdmissionsBIData | null>(null);
  const [odelData, setOdelData] = useState<OdelBIData | null>(null);
  const [commData, setCommData] = useState<CommunicationBIData | null>(null);
  const [examData, setExamData] = useState<ExamBIData | null>(null);
  const [certData, setCertData] = useState<CertificateBIData | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [searching, setSearching] = useState(false);

  // Report Center State
  const [reportType, setReportType] = useState("FINANCE");
  const [filters, setFilters] = useState({ campus: "", cefr_level: "", payment_method: "", start_date: "", end_date: "" });
  const [reportResult, setReportResult] = useState<ReportResult | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  // AI Assistant State
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiHistory, setAiHistory] = useState<Array<{ sender: "user" | "ai"; text: string; data?: any }>>([
    { sender: "ai", text: "Welcome to the Horizon AI Executive Assistant. Ask me anything about institutional revenue, unpaid student balances, daily attendance, admission pipeline, or online students. All answers are calculated in real-time from live PostgreSQL tables — no estimates, no predictions." }
  ]);
  const [askingAi, setAskingAi] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [c, f, ac, ad, od, cm, ex, ce] = await Promise.all([
        analyticsService.getCommandCenterOverview(),
        analyticsService.getFinanceBI(),
        analyticsService.getAcademicBI(),
        analyticsService.getAdmissionsBI(),
        analyticsService.getOdelBI(),
        analyticsService.getCommunicationBI(),
        analyticsService.getExamBI(),
        analyticsService.getCertificateBI(),
      ]);
      setCmdData(c);
      setFinData(f);
      setAcadData(ac);
      setAdmData(ad);
      setOdelData(od);
      setCommData(cm);
      setExamData(ex);
      setCertData(ce);
    } catch (err) {
      console.error("Failed to load Executive BI data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await analyticsService.globalSearch(searchQuery);
      setSearchResults(res);
      setActiveTab("search");
    } finally {
      setSearching(false);
    }
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      const res = await analyticsService.generateReport(reportType, filters);
      setReportResult(res);
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleAskAI = async (promptText?: string) => {
    const q = promptText || aiPrompt;
    if (!q.trim()) return;
    setAiHistory(prev => [...prev, { sender: "user", text: q }]);
    if (!promptText) setAiPrompt("");
    setAskingAi(true);
    try {
      const res = await analyticsService.askAIAssistant(q);
      setAiHistory(prev => [...prev, { sender: "ai", text: res.summary, data: res.data }]);
    } catch (err) {
      setAiHistory(prev => [...prev, { sender: "ai", text: "Error executing database query. Please try again." }]);
    } finally {
      setAskingAi(false);
    }
  };

  const exportAsCSV = () => {
    if (!reportResult || !reportResult.data.length) return;
    const headers = Object.keys(reportResult.data[0]);
    const csvContent = "data:text/csv;charset=utf-8," +
      [headers.join(","), ...reportResult.data.map(row => headers.map(h => `"${row[h] || ''}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Horizon_${reportResult.report_type}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const tabs: Array<{ id: TabId; label: string; icon: any }> = [
    { id: "overview", label: "Executive Overview", icon: Activity },
    { id: "finance", label: "Finance Intelligence", icon: DollarSign },
    { id: "academic", label: "Academic & Enrollment", icon: BookOpen },
    { id: "admissions", label: "Admissions", icon: Users },
    { id: "odel", label: "ODEL Analytics", icon: Globe },
    { id: "exams", label: "Examination", icon: GraduationCap },
    { id: "certificates", label: "Certificates", icon: Award },
    { id: "communication", label: "Communication", icon: MessageSquare },
    { id: "reports", label: "Report Center", icon: FileText },
    { id: "ai", label: "AI Assistant", icon: Bot },
    { id: "search", label: "Global Search", icon: Search },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-2xl border border-indigo-500/30 gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <Cpu className="w-8 h-8 text-indigo-400 animate-pulse" />
            <h1 className="text-2xl font-black tracking-tight">Executive Command Center & BI Platform</h1>
          </div>
          <p className="text-indigo-200 mt-1 text-sm">
            Live PostgreSQL operational visibility — no estimates, no simulated values.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchAllData}
            disabled={loading}
            className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center space-x-1 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
          <form onSubmit={handleSearch} className="flex items-center space-x-2 max-w-md w-full">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search students, receipts, certs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-indigo-500/40 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-400"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition"
            >
              {searching ? "..." : "Search"}
            </button>
          </form>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-sm transition shrink-0 ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {loading && !cmdData ? (
        <div className="text-center py-20 text-slate-400 font-medium animate-pulse">
          Aggregating live institutional records from PostgreSQL...
        </div>
      ) : (
        <>
          {/* TAB 1: EXECUTIVE OVERVIEW */}
          {activeTab === "overview" && cmdData && (
            <div className="space-y-6">
              {/* Enrollment & People */}
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Enrollment & People</div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  <KpiCard label="Total Students" value={cmdData.kpis.total_students} color="text-white" />
                  <KpiCard label="Active Students" value={cmdData.kpis.active_students} color="text-indigo-400" />
                  <KpiCard label="Applicants" value={cmdData.kpis.applicants} color="text-cyan-400" />
                  <KpiCard label="Admissions Today" value={cmdData.kpis.admissions_today} color="text-emerald-400" />
                  <KpiCard label="Teachers" value={cmdData.kpis.teacher_count} color="text-purple-400" />
                  <KpiCard label="Total Staff" value={cmdData.kpis.staff_count} color="text-slate-300" />
                </div>
              </div>

              {/* Academic Activity */}
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Academic Activity</div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  <KpiCard label="Student Attendance" value={`${cmdData.kpis.today_attendance_pct}%`} color="text-emerald-400" sub="Today (live)" />
                  <KpiCard label="Classes Running" value={cmdData.kpis.classes_running} color="text-white" />
                  <KpiCard label="ODEL Active Courses" value={cmdData.kpis.odel_courses_active} color="text-cyan-400" />
                  <KpiCard label="Courses Total" value={cmdData.kpis.courses_running} color="text-slate-300" />
                  <KpiCard label="Exams Completed" value={cmdData.kpis.exams_completed} color="text-indigo-400" />
                  <KpiCard label="Pending Marking" value={cmdData.kpis.exams_pending_marking} color="text-amber-400" />
                </div>
              </div>

              {/* Finance */}
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Finance</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <KpiCard label="Today's Revenue" value={`KES ${cmdData.kpis.todays_revenue.toLocaleString()}`} color="text-emerald-400" />
                  <KpiCard label="Outstanding Fees" value={`KES ${cmdData.kpis.outstanding_fees.toLocaleString()}`} color="text-rose-400" />
                  <KpiCard label="Receipts Today" value={cmdData.kpis.receipts_issued_today} color="text-white" />
                  <KpiCard label="Pending Allocation" value={cmdData.kpis.payments_awaiting_allocation} color="text-amber-400" />
                </div>
              </div>

              {/* Comms, AI, Certificates */}
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">Operations</div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  <KpiCard label="Certs Issued" value={cmdData.kpis.certificates_generated} color="text-cyan-400" />
                  <KpiCard label="Unread Messages" value={cmdData.kpis.unread_messages} color="text-amber-400" />
                  <KpiCard label="Broadcasts Sent" value={cmdData.kpis.broadcasts_sent} color="text-slate-300" />
                  <KpiCard label="AI Queries" value={cmdData.kpis.ai_usage_queries} color="text-indigo-400" />
                  <KpiCard label="Active Workflows" value={cmdData.kpis.active_workflows} color="text-purple-400" />
                  <KpiCard label="Assignments Due" value={cmdData.kpis.assignments_due} color="text-rose-400" />
                </div>
              </div>

              {/* Real-time System Health Monitor */}
              <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6">
                <div className="flex items-center space-x-2 text-white font-bold mb-4">
                  <Server className="w-5 h-5 text-indigo-400" />
                  <span>Real-time Institutional System Health Monitor</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  {[
                    { label: "PostgreSQL DB", value: cmdData.system_health.database_health, icon: Database, color: cmdData.system_health.database_health === "HEALTHY" ? "text-emerald-400" : "text-rose-400" },
                    { label: "Storage Status", value: cmdData.system_health.supabase_storage, icon: Layers, color: "text-cyan-400" },
                    { label: "Server CPU", value: `${cmdData.system_health.cpu_usage}%`, icon: Cpu, color: "text-white" },
                    { label: "Memory Usage", value: `${cmdData.system_health.memory_usage}%`, icon: Activity, color: "text-white" },
                    { label: "API Status", value: cmdData.system_health.api_status, icon: CheckCircle2, color: "text-emerald-400" },
                    { label: "Cron Jobs", value: `${cmdData.kpis.background_jobs} Active`, icon: Clock, color: "text-amber-400" },
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="text-xs text-slate-400 font-bold uppercase">{item.label}</div>
                          <div className={`text-sm font-black mt-0.5 ${item.color}`}>{item.value}</div>
                        </div>
                        <Icon className={`w-5 h-5 ${item.color}`} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FINANCE INTELLIGENCE */}
          {activeTab === "finance" && finData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800">
                  <div className="text-xs font-bold text-slate-400 uppercase">Today's Collections</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">KES {finData.collections.today.toLocaleString()}</div>
                </div>
                <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800">
                  <div className="text-xs font-bold text-slate-400 uppercase">Weekly Collections</div>
                  <div className="text-2xl font-black text-indigo-400 mt-1">KES {finData.collections.weekly.toLocaleString()}</div>
                </div>
                <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800">
                  <div className="text-xs font-bold text-slate-400 uppercase">Monthly Collections</div>
                  <div className="text-2xl font-black text-cyan-400 mt-1">KES {finData.collections.monthly.toLocaleString()}</div>
                </div>
                <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800">
                  <div className="text-xs font-bold text-slate-400 uppercase">Total Verified Collections</div>
                  <div className="text-2xl font-black text-white mt-1">KES {finData.collections.total.toLocaleString()}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: "Pending Allocations", value: finData.kpis.pending_allocations, color: "text-amber-400" },
                  { label: "Outstanding Balances", value: `KES ${finData.kpis.outstanding_balances.toLocaleString()}`, color: "text-rose-400" },
                  { label: "Receipts Issued", value: finData.kpis.receipts_issued, color: "text-emerald-400" },
                  { label: "Invoices / Charges", value: finData.kpis.invoices_generated, color: "text-white" },
                ].map((kpi, i) => (
                  <div key={i} className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800">
                    <div className="text-xs font-bold text-slate-400 uppercase">{kpi.label}</div>
                    <div className={`text-2xl font-black mt-1 ${kpi.color}`}>{kpi.value}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Payment Method Breakdown */}
                <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 space-y-4">
                  <h3 className="font-bold text-white text-lg">Payment Method Breakdown (Live)</h3>
                  <div className="space-y-3">
                    {Object.entries(finData.payment_methods).map(([method, amount]) => (
                      <div key={method} className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800/80">
                        <span className="font-bold text-slate-200">{method}</span>
                        <span className="font-mono font-bold text-indigo-400">KES {(amount as number).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trial Balance */}
                <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 space-y-4">
                  <h3 className="font-bold text-white text-lg">Trial Balance & General Ledger Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                      <div className="text-xs font-bold text-emerald-400 uppercase">Debits Summary</div>
                      {Object.entries(finData.trial_balance.debits).map(([k, v]) => (
                        <div key={k} className="flex justify-between text-xs text-slate-300">
                          <span className="capitalize">{k.replace(/_/g, " ")}:</span>
                          <span className="font-mono font-bold">KES {(v as number).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                      <div className="text-xs font-bold text-cyan-400 uppercase">Credits Summary</div>
                      {Object.entries(finData.trial_balance.credits).map(([k, v]) => (
                        <div key={k} className="flex justify-between text-xs text-slate-300">
                          <span className="capitalize">{k.replace(/_/g, " ")}:</span>
                          <span className="font-mono font-bold">KES {(v as number).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Audit Trail */}
              {finData.audit_trail.length > 0 && (
                <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6">
                  <h3 className="font-bold text-white text-lg mb-4">Recent Ledger Activity</h3>
                  <div className="space-y-2">
                    {finData.audit_trail.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                        <span className="text-slate-400">{entry.date}</span>
                        <span className="font-bold text-slate-200">{entry.student}</span>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">{entry.type}</span>
                        <span className="font-mono font-bold text-emerald-400">KES {entry.amount.toLocaleString()}</span>
                        <span className="text-slate-500 max-w-xs truncate">{entry.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ACADEMIC & ENROLLMENT */}
          {activeTab === "academic" && acadData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800">
                  <div className="text-xs font-bold text-slate-400 uppercase">Attendance Rate (Overall)</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">{acadData.kpis.attendance_rate}%</div>
                  <div className="text-xs text-slate-500 mt-0.5">From live AttendanceRecord table</div>
                </div>
                <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800">
                  <div className="text-xs font-bold text-slate-400 uppercase">ODEL Lesson Completion</div>
                  <div className="text-2xl font-black text-indigo-400 mt-1">{acadData.kpis.course_completion}%</div>
                  <div className="text-xs text-slate-500 mt-0.5">From StudentLessonProgress table</div>
                </div>
                <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800">
                  <div className="text-xs font-bold text-slate-400 uppercase">Exam Pass Rate</div>
                  <div className="text-2xl font-black text-cyan-400 mt-1">{acadData.kpis.exam_pass_rate}%</div>
                  <div className="text-xs text-slate-500 mt-0.5">From published results.Result table</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 space-y-4">
                  <h3 className="font-bold text-white text-lg">Enrollment by CEFR Level</h3>
                  <div className="space-y-3">
                    {acadData.enrollment_by_level.length > 0 ? acadData.enrollment_by_level.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="font-bold text-indigo-300 font-mono">{item.level}</span>
                        <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold">{item.count} Students</span>
                      </div>
                    )) : (
                      <div className="text-slate-500 text-sm text-center py-6">No enrollment data available.</div>
                    )}
                  </div>
                </div>
                <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 space-y-4">
                  <h3 className="font-bold text-white text-lg">Enrollment by Campus</h3>
                  <div className="space-y-3">
                    {acadData.enrollment_by_campus.length > 0 ? acadData.enrollment_by_campus.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="font-semibold text-slate-200">{item.campus}</span>
                        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">{item.count} Enrolled</span>
                      </div>
                    )) : (
                      <div className="text-slate-500 text-sm text-center py-6">No campus data available.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Teacher Workload */}
              {acadData.teacher_workload.length > 0 && (
                <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6">
                  <h3 className="font-bold text-white text-lg mb-4">Teacher Workload (Live)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                        <tr>
                          <th className="py-3 px-4">Teacher</th>
                          <th className="py-3 px-4">Cohorts Assigned</th>
                          <th className="py-3 px-4">Students Taught</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {acadData.teacher_workload.map((t, i) => (
                          <tr key={i} className="hover:bg-slate-800/40">
                            <td className="py-2.5 px-4 font-bold text-slate-200">{t.name}</td>
                            <td className="py-2.5 px-4 text-indigo-400 font-mono">{t.classes_assigned}</td>
                            <td className="py-2.5 px-4 text-emerald-400 font-mono">{t.students_taught}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ADMISSIONS */}
          {activeTab === "admissions" && admData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {[
                  { label: "Applications Received", value: admData.kpis.applications_received, color: "text-white" },
                  { label: "Pending Review", value: admData.kpis.applications_pending, color: "text-amber-400" },
                  { label: "Interview Scheduled", value: admData.kpis.interviews_scheduled, color: "text-indigo-400" },
                  { label: "Approved Admissions", value: admData.kpis.applications_approved, color: "text-emerald-400" },
                  { label: "Rejected", value: admData.kpis.applications_rejected, color: "text-rose-400" },
                ].map((kpi, i) => (
                  <div key={i} className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800">
                    <div className="text-xs font-bold text-slate-400 uppercase">{kpi.label}</div>
                    <div className={`text-2xl font-black mt-1 ${kpi.color}`}>{kpi.value}</div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6">
                  <h3 className="font-bold text-white text-lg mb-4">Admissions by Intake</h3>
                  <div className="space-y-3">
                    {admData.admissions_by_intake.length > 0 ? admData.admissions_by_intake.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="font-semibold text-slate-200">{item.intake}</span>
                        <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold">{item.count}</span>
                      </div>
                    )) : (
                      <div className="text-slate-500 text-sm py-4 text-center">No intake data available.</div>
                    )}
                  </div>
                </div>
                <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6">
                  <h3 className="font-bold text-white text-lg mb-4">Admissions by Gender</h3>
                  <div className="space-y-3">
                    {admData.admissions_by_gender.length > 0 ? admData.admissions_by_gender.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                        <span className="font-semibold text-slate-200">{item.gender}</span>
                        <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold">{item.count}</span>
                      </div>
                    )) : (
                      <div className="text-slate-500 text-sm py-4 text-center">No gender data available.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ODEL ANALYTICS */}
          {activeTab === "odel" && odelData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                <KpiCard label="Published Lessons" value={odelData.kpis.lessons_published} color="text-emerald-400" />
                <KpiCard label="Draft Lessons" value={odelData.kpis.draft_lessons} color="text-amber-400" />
                <KpiCard label="Lessons Completed" value={odelData.kpis.completed_lessons} color="text-indigo-400" />
                <KpiCard label="Assignments" value={odelData.kpis.assignments_total} color="text-white" />
                <KpiCard label="Submissions" value={odelData.kpis.assignments_submitted} color="text-cyan-400" />
                <KpiCard label="Forum Posts" value={odelData.kpis.discussion_activity} color="text-purple-400" />
                <KpiCard label="Video Views" value={odelData.kpis.video_views} color="text-rose-400" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <KpiCard label="Downloads" value={odelData.kpis.resource_downloads} color="text-slate-300" />
                <KpiCard label="Online Students" value={odelData.kpis.online_students} color="text-emerald-400" />
                <KpiCard label="Virtual Classes" value={odelData.kpis.virtual_classes} color="text-indigo-400" />
                <KpiCard label="Avg Progress" value={`${odelData.kpis.learning_progress_pct}%`} color="text-cyan-400" />
              </div>
            </div>
          )}

          {/* TAB 6: EXAMINATION ANALYTICS */}
          {activeTab === "exams" && examData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Results", value: examData.kpis.total_results, color: "text-white" },
                  { label: "Published Results", value: examData.kpis.published_results, color: "text-emerald-400" },
                  { label: "Pending Marking", value: examData.kpis.pending_marking, color: "text-amber-400" },
                  { label: "Pass Rate", value: `${examData.kpis.pass_rate}%`, color: "text-cyan-400" },
                ].map((kpi, i) => (
                  <div key={i} className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800">
                    <div className="text-xs font-bold text-slate-400 uppercase">{kpi.label}</div>
                    <div className={`text-2xl font-black mt-1 ${kpi.color}`}>{kpi.value}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6">
                  <h3 className="font-bold text-white text-lg mb-4">Grade Distribution (Live)</h3>
                  <div className="space-y-3">
                    {Object.entries(examData.grade_distribution).length > 0
                      ? Object.entries(examData.grade_distribution).map(([grade, count]) => (
                          <div key={grade} className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                            <span className="font-bold text-slate-200">{grade}</span>
                            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold">{count as number}</span>
                          </div>
                        ))
                      : <div className="text-slate-500 text-sm py-6 text-center">No graded results available.</div>
                    }
                  </div>
                </div>
                <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6">
                  <h3 className="font-bold text-white text-lg mb-4">Results by CEFR Level</h3>
                  <div className="space-y-3">
                    {examData.results_by_level.length > 0
                      ? examData.results_by_level.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                            <span className="font-bold text-indigo-300 font-mono">{item.level}</span>
                            <span className="text-slate-400 text-xs">{item.count} results</span>
                            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">Avg: {item.avg_score}</span>
                          </div>
                        ))
                      : <div className="text-slate-500 text-sm py-6 text-center">No results by level available.</div>
                    }
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800">
                  <div className="text-xs font-bold text-slate-400 uppercase">ODEL Exam Sessions</div>
                  <div className="text-2xl font-black text-white mt-1">{examData.kpis.exam_sessions}</div>
                  <div className="text-xs text-slate-500">From ExamSessionLog</div>
                </div>
                <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800">
                  <div className="text-xs font-bold text-slate-400 uppercase">Exam Submissions</div>
                  <div className="text-2xl font-black text-indigo-400 mt-1">{examData.kpis.exam_submissions}</div>
                  <div className="text-xs text-slate-500">Average Score: {examData.kpis.avg_score}</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: CERTIFICATE ANALYTICS */}
          {activeTab === "certificates" && certData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Issued (Active)", value: certData.kpis.issued_total, color: "text-emerald-400" },
                  { label: "Issued Today", value: certData.kpis.issued_today, color: "text-cyan-400" },
                  { label: "Eligible Awaiting", value: certData.kpis.eligible_awaiting, color: "text-amber-400" },
                  { label: "Revoked", value: certData.kpis.revoked_total, color: "text-rose-400" },
                ].map((kpi, i) => (
                  <div key={i} className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800">
                    <div className="text-xs font-bold text-slate-400 uppercase">{kpi.label}</div>
                    <div className={`text-2xl font-black mt-1 ${kpi.color}`}>{kpi.value}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6">
                  <h3 className="font-bold text-white text-lg mb-4">Certificates by Type</h3>
                  <div className="space-y-3">
                    {Object.entries(certData.by_type).length > 0
                      ? Object.entries(certData.by_type).map(([type, count]) => (
                          <div key={type} className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                            <span className="font-semibold text-slate-200">{type.replace(/_/g, " ")}</span>
                            <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold">{count as number}</span>
                          </div>
                        ))
                      : <div className="text-slate-500 text-sm py-6 text-center">No certificates issued yet.</div>
                    }
                  </div>
                </div>
                <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6">
                  <h3 className="font-bold text-white text-lg mb-4">Recent Certificates Issued</h3>
                  <div className="space-y-2">
                    {certData.recent_certificates.length > 0
                      ? certData.recent_certificates.map((cert, i) => (
                          <div key={i} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                            <span className="font-mono text-slate-400">{cert.certificate_number}</span>
                            <span className="font-bold text-slate-200">{cert.name}</span>
                            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">{cert.level}</span>
                            <span className="text-slate-500">{cert.issue_date}</span>
                          </div>
                        ))
                      : <div className="text-slate-500 text-sm py-6 text-center">No certificates issued yet.</div>
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: COMMUNICATION ANALYTICS */}
          {activeTab === "communication" && commData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total Messages", value: commData.kpis.messages_total, color: "text-white" },
                  { label: "Messages Today", value: commData.kpis.messages_today, color: "text-emerald-400" },
                  { label: "Unread Messages", value: commData.kpis.unread_messages, color: "text-amber-400" },
                  { label: "Announcements", value: commData.kpis.announcements, color: "text-indigo-400" },
                  { label: "Broadcasts Sent", value: commData.kpis.broadcasts_sent, color: "text-cyan-400" },
                  { label: "Active Conversations", value: commData.kpis.active_conversations, color: "text-purple-400" },
                  { label: "Attachment Storage", value: `${commData.kpis.attachment_storage_mb} MB`, color: "text-slate-300" },
                  { label: "AI Conversations", value: commData.kpis.ai_conversations, color: "text-rose-400" },
                ].map((kpi, i) => (
                  <div key={i} className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800">
                    <div className="text-xs font-bold text-slate-400 uppercase">{kpi.label}</div>
                    <div className={`text-2xl font-black mt-1 ${kpi.color}`}>{kpi.value}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6">
                  <h3 className="font-bold text-white text-lg mb-4">Most Active Conversations</h3>
                  <div className="space-y-3">
                    {commData.most_active_conversations.length > 0
                      ? commData.most_active_conversations.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                            <span className="font-semibold text-slate-200 truncate">{item.conversation}</span>
                            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold shrink-0 ml-2">{item.messages} msgs</span>
                          </div>
                        ))
                      : <div className="text-slate-500 text-sm py-6 text-center">No conversation data available.</div>
                    }
                  </div>
                </div>
                <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6">
                  <h3 className="font-bold text-white text-lg mb-4">Top Announcers</h3>
                  <div className="space-y-3">
                    {commData.most_active_announcers.length > 0
                      ? commData.most_active_announcers.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                            <span className="font-semibold text-slate-200">{item.author}</span>
                            <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold">{item.announcements} announcements</span>
                          </div>
                        ))
                      : <div className="text-slate-500 text-sm py-6 text-center">No announcements found.</div>
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: CENTRAL REPORT CENTER */}
          {activeTab === "reports" && (
            <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-4">
                <div>
                  <h3 className="font-bold text-white text-lg">Central Report Center & Exporter</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Filter actual database records and export verified institutional reports.</p>
                </div>
                <div className="flex items-center space-x-2 flex-wrap gap-2">
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm font-bold"
                  >
                    <option value="FINANCE">Finance Report</option>
                    <option value="ACADEMIC">Academic & Student Report</option>
                    <option value="ATTENDANCE">Attendance Report</option>
                  </select>
                  <button
                    onClick={handleGenerateReport}
                    disabled={generatingReport}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition"
                  >
                    {generatingReport ? "Generating..." : "Generate Report"}
                  </button>
                  {reportResult && (
                    <>
                      <button
                        onClick={exportAsCSV}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center space-x-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>CSV Export</span>
                      </button>
                      <button
                        onClick={() => window.print()}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center space-x-1"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print PDF</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Advanced Filters Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Filter by CEFR Level</label>
                  <input
                    type="text"
                    placeholder="e.g. A1, B1.1"
                    value={filters.cefr_level}
                    onChange={(e) => setFilters({ ...filters, cefr_level: e.target.value })}
                    className="mt-1 w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Payment Method</label>
                  <select
                    value={filters.payment_method}
                    onChange={(e) => setFilters({ ...filters, payment_method: e.target.value })}
                    className="mt-1 w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                  >
                    <option value="">All Methods</option>
                    <option value="M-Pesa">M-Pesa</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">Start Date</label>
                  <input
                    type="date"
                    value={filters.start_date}
                    onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                    className="mt-1 w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase">End Date</label>
                  <input
                    type="date"
                    value={filters.end_date}
                    onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                    className="mt-1 w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs"
                  />
                </div>
              </div>

              {reportResult && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center space-x-4 text-xs text-slate-400">
                    <span>Report: <strong className="text-indigo-400">{reportResult.report_type}</strong></span>
                    <span>Generated: <strong className="text-slate-200">{new Date(reportResult.generated_at).toLocaleString()}</strong></span>
                    <span>Rows: <strong className="text-emerald-400">{reportResult.row_count}</strong></span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                        <tr>
                          {reportResult.data.length > 0 && Object.keys(reportResult.data[0]).map((h) => (
                            <th key={h} className="py-3 px-4 capitalize">{h.replace(/_/g, " ")}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {reportResult.data.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-800/40">
                            {Object.values(row).map((val: any, j) => (
                              <td key={j} className="py-2.5 px-4">{String(val)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 10: AI EXECUTIVE ASSISTANT */}
          {activeTab === "ai" && (
            <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 flex flex-col h-[650px] justify-between">
              <div>
                <div className="flex items-center space-x-2 pb-4 border-b border-slate-800 text-indigo-400 font-bold">
                  <Bot className="w-6 h-6" />
                  <span>Horizon AI Executive Assistant — Deterministic ORM Engine</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {[
                    "Show today's revenue",
                    "Show unpaid students",
                    "List students with attendance below 75%",
                    "Show certificates issued today",
                    "Show pending admissions",
                    "Show active online students",
                    "Generate today's executive summary",
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAskAI(preset)}
                      className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold transition"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto my-4 space-y-4 pr-2">
                {aiHistory.map((msg, i) => (
                  <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-2xl p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.sender === "user" ? "bg-indigo-600 text-white" : "bg-slate-950 text-slate-200 border border-slate-800"
                    }`}>
                      <div className="whitespace-pre-line">{msg.text}</div>
                    </div>
                  </div>
                ))}
                {askingAi && <div className="text-xs text-indigo-400 font-bold animate-pulse">Executing PostgreSQL aggregate query...</div>}
              </div>

              <div className="flex items-center space-x-2 pt-4 border-t border-slate-800">
                <input
                  type="text"
                  placeholder="Ask executive intelligence query..."
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAskAI(); }}
                  className="flex-1 px-4 py-3 bg-slate-950 border border-slate-700 rounded-2xl text-white text-sm focus:outline-none focus:border-indigo-400"
                />
                <button
                  onClick={() => handleAskAI()}
                  disabled={askingAi}
                  className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 11: GLOBAL SEARCH RESULTS */}
          {activeTab === "search" && (
            <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 space-y-6">
              {searchResults ? (
                <>
                  <h3 className="font-bold text-white text-lg">
                    Global Enterprise Search — "{searchResults.query}" ({searchResults.total_results} found)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Object.entries(searchResults.results).map(([cat, items]) => items.length > 0 && (
                      <div key={cat} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                        <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider capitalize">{cat} ({items.length})</div>
                        {items.map((item) => (
                          <div key={item.id} className="p-3 bg-slate-900/80 rounded-xl flex items-center justify-between">
                            <div>
                              <div className="font-bold text-slate-200 text-sm">{item.title}</div>
                              <div className="text-xs text-slate-400">{item.detail}</div>
                            </div>
                            <a href={item.url} className="text-indigo-400 hover:text-indigo-300">
                              <ArrowRight className="w-4 h-4" />
                            </a>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-20 text-slate-500">
                  Use the search bar above to search across students, payments, certificates, and lessons.
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
