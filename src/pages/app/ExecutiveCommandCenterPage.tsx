import React, { useState, useEffect } from "react";
import {
  Activity, DollarSign, Users, BookOpen, Layers, ShieldCheck, Cpu, Search,
  Download, Printer, Bot, Send, Calendar, CheckCircle2, AlertCircle, FileText,
  PieChart, TrendingUp, RefreshCw, Filter, Database, Clock, ArrowRight, Server
} from "lucide-react";
import {
  analyticsService, CommandCenterData, FinanceBIData, AcademicBIData,
  AdmissionsBIData, OdelBIData, CommunicationBIData, ReportResult, SearchResult
} from "@/services/analyticsService";

export default function ExecutiveCommandCenterPage() {
  const [activeTab, setActiveTab] = useState<"overview" | "finance" | "academic" | "admissions" | "reports" | "ai" | "search">("overview");
  const [loading, setLoading] = useState(true);

  // Data States
  const [cmdData, setCmdData] = useState<CommandCenterData | null>(null);
  const [finData, setFinData] = useState<FinanceBIData | null>(null);
  const [acadData, setAcadData] = useState<AcademicBIData | null>(null);
  const [admData, setAdmData] = useState<AdmissionsBIData | null>(null);
  const [odelData, setOdelData] = useState<OdelBIData | null>(null);
  const [commData, setCommData] = useState<CommunicationBIData | null>(null);

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
    { sender: "ai", text: "Welcome to the Horizon AI Executive Assistant. Ask me anything about institutional revenue, unpaid student balances, daily attendance, or admissions pipeline. All answers are calculated in real-time from PostgreSQL tables." }
  ]);
  const [askingAi, setAskingAi] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [c, f, ac, ad, od, cm] = await Promise.all([
        analyticsService.getCommandCenterOverview(),
        analyticsService.getFinanceBI(),
        analyticsService.getAcademicBI(),
        analyticsService.getAdmissionsBI(),
        analyticsService.getOdelBI(),
        analyticsService.getCommunicationBI()
      ]);
      setCmdData(c);
      setFinData(f);
      setAcadData(ac);
      setAdmData(ad);
      setOdelData(od);
      setCommData(cm);
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
      setAiHistory(prev => [...prev, { sender: "ai", text: "Error querying database. Please try again." }]);
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
            Institutional operational visibility, financial ledger reconciliation, and AI intelligence derived strictly from live PostgreSQL records.
          </p>
        </div>
        <form onSubmit={handleSearch} className="flex items-center space-x-2 max-w-md w-full">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search students, receipts, certs, lessons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-indigo-500/40 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-400 shadow-inner"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-indigo-600/30"
          >
            {searching ? "..." : "Search"}
          </button>
        </form>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2 overflow-x-auto">
        {[
          { id: "overview", label: "Executive Overview", icon: Activity },
          { id: "finance", label: "Finance Intelligence", icon: DollarSign },
          { id: "academic", label: "Academic & Enrollment", icon: BookOpen },
          { id: "admissions", label: "Admissions & ODEL", icon: Users },
          { id: "reports", label: "Central Report Center", icon: FileText },
          { id: "ai", label: "AI Executive Assistant", icon: Bot },
          { id: "search", label: "Global Search & Audit", icon: Search },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
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
        <div className="text-center py-20 text-slate-400 font-medium">Aggregating live institutional records from PostgreSQL...</div>
      ) : (
        <>
          {/* TAB 1: EXECUTIVE OVERVIEW */}
          {activeTab === "overview" && cmdData && (
            <div className="space-y-6">
              {/* Institutional KPI Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800">
                  <div className="text-slate-400 text-xs font-bold uppercase">Total Students</div>
                  <div className="text-xl font-black text-white mt-1">{cmdData.kpis.total_students}</div>
                </div>
                <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800">
                  <div className="text-slate-400 text-xs font-bold uppercase">Active Students</div>
                  <div className="text-xl font-black text-indigo-400 mt-1">{cmdData.kpis.active_students}</div>
                </div>
                <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800">
                  <div className="text-slate-400 text-xs font-bold uppercase">Applicants</div>
                  <div className="text-xl font-black text-cyan-400 mt-1">{cmdData.kpis.applicants}</div>
                </div>
                <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800">
                  <div className="text-slate-400 text-xs font-bold uppercase">Admissions Today</div>
                  <div className="text-xl font-black text-emerald-400 mt-1">{cmdData.kpis.admissions_today}</div>
                </div>
                <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800">
                  <div className="text-slate-400 text-xs font-bold uppercase">Student Attendance</div>
                  <div className="text-xl font-black text-emerald-400 mt-1">{cmdData.kpis.today_attendance_pct}%</div>
                </div>
                <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800">
                  <div className="text-slate-400 text-xs font-bold uppercase">Teacher Attendance</div>
                  <div className="text-xl font-black text-purple-400 mt-1">{cmdData.kpis.teacher_attendance_pct}%</div>
                </div>
                <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800">
                  <div className="text-slate-400 text-xs font-bold uppercase">Classes Running</div>
                  <div className="text-xl font-black text-white mt-1">{cmdData.kpis.classes_running}</div>
                </div>

                <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800">
                  <div className="text-slate-400 text-xs font-bold uppercase">Today's Revenue</div>
                  <div className="text-xl font-black text-emerald-400 mt-1">KES {cmdData.kpis.todays_revenue.toLocaleString()}</div>
                </div>
                <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800">
                  <div className="text-slate-400 text-xs font-bold uppercase">Outstanding Fees</div>
                  <div className="text-xl font-black text-rose-400 mt-1">KES {cmdData.kpis.outstanding_fees.toLocaleString()}</div>
                </div>
                <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800">
                  <div className="text-slate-400 text-xs font-bold uppercase">Receipts Today</div>
                  <div className="text-xl font-black text-white mt-1">{cmdData.kpis.receipts_issued_today}</div>
                </div>
                <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800">
                  <div className="text-slate-400 text-xs font-bold uppercase">Pending Alloc.</div>
                  <div className="text-xl font-black text-amber-400 mt-1">{cmdData.kpis.payments_awaiting_allocation}</div>
                </div>
                <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800">
                  <div className="text-slate-400 text-xs font-bold uppercase">Certs Issued</div>
                  <div className="text-xl font-black text-cyan-400 mt-1">{cmdData.kpis.certificates_generated}</div>
                </div>
                <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800">
                  <div className="text-slate-400 text-xs font-bold uppercase">Support Tickets</div>
                  <div className="text-xl font-black text-amber-400 mt-1">{cmdData.kpis.support_tickets}</div>
                </div>
                <div className="p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800">
                  <div className="text-slate-400 text-xs font-bold uppercase">Active Workflows</div>
                  <div className="text-xl font-black text-indigo-400 mt-1">{cmdData.kpis.active_workflows}</div>
                </div>
              </div>

              {/* Real-time System Health Monitor */}
              <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6">
                <div className="flex items-center space-x-2 text-white font-bold mb-4">
                  <Server className="w-5 h-5 text-indigo-400" />
                  <span>Real-time Institutional System Health Monitor</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400 font-bold uppercase">PostgreSQL DB</div>
                      <div className="text-sm font-black text-emerald-400 mt-0.5">{cmdData.system_health.database_health}</div>
                    </div>
                    <Database className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400 font-bold uppercase">Storage Status</div>
                      <div className="text-sm font-black text-cyan-400 mt-0.5">{cmdData.system_health.supabase_storage}</div>
                    </div>
                    <Layers className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400 font-bold uppercase">Server CPU</div>
                      <div className="text-sm font-black text-white mt-0.5">{cmdData.system_health.cpu_usage}%</div>
                    </div>
                    <Cpu className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400 font-bold uppercase">Memory Usage</div>
                      <div className="text-sm font-black text-white mt-0.5">{cmdData.system_health.memory_usage}%</div>
                    </div>
                    <Activity className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400 font-bold uppercase">API Status</div>
                      <div className="text-sm font-black text-emerald-400 mt-0.5">{cmdData.system_health.api_status}</div>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-400 font-bold uppercase">Cron Jobs</div>
                      <div className="text-sm font-black text-white mt-0.5">{cmdData.kpis.background_jobs} Active</div>
                    </div>
                    <Clock className="w-5 h-5 text-amber-400" />
                  </div>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Payment Method Breakdown */}
                <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 space-y-4">
                  <h3 className="font-bold text-white text-lg">Real Payment Method Breakdown</h3>
                  <div className="space-y-3">
                    {Object.entries(finData.payment_methods).map(([method, amount]) => (
                      <div key={method} className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800/80">
                        <span className="font-bold text-slate-200">{method}</span>
                        <span className="font-mono font-bold text-indigo-400">KES {amount.toLocaleString()}</span>
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
                          <span className="font-mono font-bold">KES {v.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                      <div className="text-xs font-bold text-cyan-400 uppercase">Credits Summary</div>
                      {Object.entries(finData.trial_balance.credits).map(([k, v]) => (
                        <div key={k} className="flex justify-between text-xs text-slate-300">
                          <span className="capitalize">{k.replace(/_/g, " ")}:</span>
                          <span className="font-mono font-bold">KES {v.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ACADEMIC & ENROLLMENT */}
          {activeTab === "academic" && acadData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 space-y-4">
                <h3 className="font-bold text-white text-lg">Enrollment by CEFR Level</h3>
                <div className="space-y-3">
                  {acadData.enrollment_by_level.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="font-bold text-indigo-300 font-mono">{item.level}</span>
                      <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold">{item.count} Students</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 space-y-4">
                <h3 className="font-bold text-white text-lg">Enrollment by Campus & Intake</h3>
                <div className="space-y-3">
                  {acadData.enrollment_by_campus.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-950 rounded-xl border border-slate-800">
                      <span className="font-semibold text-slate-200">{item.campus}</span>
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">{item.count} Enrolled</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ADMISSIONS & ODEL */}
          {activeTab === "admissions" && admData && odelData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800">
                  <div className="text-xs font-bold text-slate-400 uppercase">Applications Received</div>
                  <div className="text-2xl font-black text-white mt-1">{admData.kpis.applications_received}</div>
                </div>
                <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800">
                  <div className="text-xs font-bold text-slate-400 uppercase">Pending Review</div>
                  <div className="text-2xl font-black text-amber-400 mt-1">{admData.kpis.applications_pending}</div>
                </div>
                <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800">
                  <div className="text-xs font-bold text-slate-400 uppercase">Approved Admissions</div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">{admData.kpis.applications_approved}</div>
                </div>
                <div className="p-5 bg-slate-900/90 rounded-2xl border border-slate-800">
                  <div className="text-xs font-bold text-slate-400 uppercase">ODEL Lessons Published</div>
                  <div className="text-2xl font-black text-cyan-400 mt-1">{odelData.kpis.lessons_published}</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CENTRAL REPORT CENTER */}
          {activeTab === "reports" && (
            <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-4">
                <div>
                  <h3 className="font-bold text-white text-lg">Central Report Center & Exporter</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Filter actual database records and export verified institutional reports.</p>
                </div>
                <div className="flex items-center space-x-2">
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
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition shadow"
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
                  >
                </div>
              </div>

              {/* Report Output Table */}
              {reportResult && (
                <div className="mt-4 overflow-x-auto">
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
              )}
            </div>
          )}

          {/* TAB 6: AI EXECUTIVE ASSISTANT */}
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
                    "Generate today's executive summary"
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

              {/* Chat History */}
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
                {askingAi && <div className="text-xs text-indigo-400 font-bold animate-pulse">Executing SQL aggregate query...</div>}
              </div>

              {/* Input Bar */}
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
                  className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold transition shadow"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 7: GLOBAL SEARCH RESULTS */}
          {activeTab === "search" && searchResults && (
            <div className="bg-slate-900/90 rounded-3xl border border-slate-800 p-6 space-y-6">
              <h3 className="font-bold text-white text-lg">Global Enterprise Search Results for "{searchResults.query}" ({searchResults.total_results} found)</h3>
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
                        <a href={item.url} className="text-indigo-400 hover:text-indigo-300"><ArrowRight className="w-4 h-4" /></a>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
