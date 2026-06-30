import React, { useState, useEffect } from "react";
import {
  Bot,
  Activity,
  Layers,
  Database,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Upload,
  FileText,
  Trash2,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";

interface KPIStats {
  requests_today: number;
  total_requests: number;
  indexed_documents: number;
  failed_jobs: number;
  avg_response_time_ms: number;
  success_rate: number;
  category_distribution: Record<string, number>;
  recent_logs: Array<{
    id: number;
    user: string;
    role: string;
    question: string;
    response_time_ms: number;
    feedback: string;
    timestamp: string;
  }>;
}

interface IndexJob {
  id: number;
  doc_id?: number;
  source_name: string;
  source_type: string;
  status: string;
  error_log: string;
  retry_count: number;
  started_at: string;
}

interface KnowledgeDoc {
  id: number;
  title: string;
  category: string;
  category_display: string;
  file_size: number;
  file_url: string;
  indexing_status: string;
  error_message: string;
  updated_at: string;
}

export default function AIAdministrationPage() {
  const [stats, setStats] = useState<KPIStats | null>(null);
  const [jobs, setJobs] = useState<IndexJob[]>([]);
  const [docs, setDocs] = useState<KnowledgeDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"kpi" | "docs" | "jobs" | "upload">("kpi");

  // Upload Form
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("POLICY");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const token = localStorage.getItem("access_token") || localStorage.getItem("token") || "";

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [resStats, resJobs, resDocs] = await Promise.all([
        fetch("/api/ai/dashboard-stats/", { headers }),
        fetch("/api/ai/indexing-jobs/", { headers }),
        fetch("/api/ai/knowledge/", { headers }),
      ]);

      if (resStats.ok) setStats(await resStats.json());
      if (resJobs.ok) {
        const jData = await resJobs.json();
        setJobs(jData.jobs || []);
      }
      if (resDocs.ok) {
        const dData = await resDocs.json();
        setDocs(dData.documents || []);
      }
    } catch (err) {
      console.error("Error loading AI telemetry:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRetryJob = async (jobId: number) => {
    try {
      const res = await fetch(`/api/ai/indexing-jobs/${jobId}/retry/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReindexDoc = async (docId: number) => {
    try {
      const res = await fetch(`/api/ai/knowledge/${docId}/reindex/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDoc = async (docId: number) => {
    if (!window.confirm("Are you sure you want to deactivate this knowledge source?")) return;
    try {
      await fetch(`/api/ai/knowledge/${docId}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setDocs((prev) => prev.filter((d) => d.id !== docId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("category", category);
      formData.append("content", content);
      if (file) formData.append("file", file);

      const res = await fetch("/api/ai/knowledge/", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (res.ok) {
        setMessage("✅ Knowledge document uploaded and indexed successfully!");
        setTitle("");
        setContent("");
        setFile(null);
        fetchData();
      } else {
        setMessage("❌ Upload failed. Please verify user permissions.");
      }
    } catch (err) {
      setMessage("❌ Network error during upload.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fadeIn text-slate-900 dark:text-slate-100">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#7f1d1d] p-6 rounded-2xl border border-slate-700 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#EAB308] font-bold text-xs tracking-wider uppercase mb-1">
            <Bot className="size-4" /> Institutional AI Command Center
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            AI Platform & RAG Telemetry
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Monitor real-time RAG ingestion pipelines, vector embeddings, role-isolated request telemetry, and automated index retries across Horizon.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2.5 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition"
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} /> Refresh Telemetry
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-300 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("kpi")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "kpi"
              ? "bg-[#0F172A] text-white dark:bg-[#DC2626]"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
          }`}
        >
          <Activity className="size-4" /> Executive Telemetry
        </button>
        <button
          onClick={() => setActiveTab("docs")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "docs"
              ? "bg-[#0F172A] text-white dark:bg-[#DC2626]"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
          }`}
        >
          <Database className="size-4" /> Knowledge Sources ({docs.length})
        </button>
        <button
          onClick={() => setActiveTab("jobs")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "jobs"
              ? "bg-[#0F172A] text-white dark:bg-[#DC2626]"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
          }`}
        >
          <Layers className="size-4" /> Indexing Pipeline ({jobs.length})
        </button>
        <button
          onClick={() => setActiveTab("upload")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === "upload"
              ? "bg-[#0F172A] text-white dark:bg-[#DC2626]"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
          }`}
        >
          <Upload className="size-4" /> Upload Knowledge
        </button>
      </div>

      {loading && !stats ? (
        <div className="p-16 text-center flex flex-col items-center justify-center space-y-3">
          <Loader2 className="size-8 text-[#DC2626] animate-spin" />
          <span className="text-slate-400 text-sm">Loading PostgreSQL AI Telemetry...</span>
        </div>
      ) : (
        <>
          {/* TAB 1: EXECUTIVE TELEMETRY */}
          {activeTab === "kpi" && stats && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Requests Today</span>
                    <span className="text-3xl font-extrabold text-[#DC2626] mt-1 block">{stats.requests_today}</span>
                    <span className="text-[11px] text-slate-400">Total All-Time: {stats.total_requests}</span>
                  </div>
                  <div className="p-3 bg-red-500/10 rounded-xl text-[#DC2626]">
                    <Sparkles className="size-6" />
                  </div>
                </div>

                <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Indexed Documents</span>
                    <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">{stats.indexed_documents}</span>
                    <span className="text-[11px] text-slate-400">Active vector embeddings</span>
                  </div>
                  <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
                    <CheckCircle2 className="size-6" />
                  </div>
                </div>

                <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Failed Index Jobs</span>
                    <span className="text-3xl font-extrabold text-amber-600 dark:text-[#EAB308] mt-1 block">{stats.failed_jobs}</span>
                    <span className="text-[11px] text-slate-400">Requires automated retry</span>
                  </div>
                  <div className="p-3 bg-amber-500/10 rounded-xl text-[#EAB308]">
                    <AlertTriangle className="size-6" />
                  </div>
                </div>

                <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Avg Response Latency</span>
                    <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-1 block">{stats.avg_response_time_ms} ms</span>
                    <span className="text-[11px] text-slate-400">Success Rate: {stats.success_rate}%</span>
                  </div>
                  <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500">
                    <Clock className="size-6" />
                  </div>
                </div>
              </div>

              {/* Recent AI Activity Table */}
              <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="p-4 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-bold text-sm">
                  Recent Role-Isolated AI Interaction Logs
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500">
                      <tr>
                        <th className="p-3">User & Role</th>
                        <th className="p-3">Prompt Summary</th>
                        <th className="p-3">Latency</th>
                        <th className="p-3">Feedback</th>
                        <th className="p-3">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {stats.recent_logs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="p-3 font-semibold">
                            {log.user} <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded ml-1">{log.role}</span>
                          </td>
                          <td className="p-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">{log.question}</td>
                          <td className="p-3 font-mono">{log.response_time_ms} ms</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded font-bold ${
                              log.feedback === 'HELPFUL' ? 'bg-emerald-500/10 text-emerald-500' :
                              log.feedback === 'NOT_HELPFUL' ? 'bg-red-500/10 text-red-500' : 'text-slate-400'
                            }`}>
                              {log.feedback}
                            </span>
                          </td>
                          <td className="p-3 text-slate-400">{log.timestamp}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KNOWLEDGE SOURCES */}
          {activeTab === "docs" && (
            <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-bold text-sm flex justify-between items-center">
                <span>Indexed RAG Knowledge Documents</span>
                <span className="text-xs text-slate-400">{docs.length} Active Sources</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500">
                    <tr>
                      <th className="p-3">Title</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Updated At</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {docs.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="p-3 font-bold flex items-center gap-2">
                          <FileText className="size-4 text-[#DC2626]" /> {d.title}
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-semibold">{d.category_display}</span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded font-bold ${
                            d.indexing_status === 'INDEXED' ? 'bg-emerald-500/10 text-emerald-500' :
                            d.indexing_status === 'FAILED' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                          }`}>
                            {d.indexing_status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400">{d.updated_at}</td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() => handleReindexDoc(d.id)}
                            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-[#DC2626] hover:text-white rounded font-bold transition"
                          >
                            Re-Index
                          </button>
                          <button
                            onClick={() => handleDeleteDoc(d.id)}
                            className="p-1 text-red-500 hover:text-red-700 transition"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: INDEXING JOBS */}
          {activeTab === "jobs" && (
            <div className="bg-white dark:bg-[#0F172A] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="p-4 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-bold text-sm">
                Document Indexing Pipeline & Retry Queue
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500">
                    <tr>
                      <th className="p-3">Job ID</th>
                      <th className="p-3">Source Name</th>
                      <th className="p-3">Type</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Retries</th>
                      <th className="p-3">Started</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {jobs.map((j) => (
                      <tr key={j.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                        <td className="p-3 font-mono">#{j.id}</td>
                        <td className="p-3 font-bold">{j.source_name}</td>
                        <td className="p-3">{j.source_type}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded font-bold ${
                            j.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-500' :
                            j.status === 'FAILED' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                          }`}>
                            {j.status}
                          </span>
                        </td>
                        <td className="p-3">{j.retry_count}</td>
                        <td className="p-3 text-slate-400">{j.started_at}</td>
                        <td className="p-3 text-right">
                          {j.status === 'FAILED' && (
                            <button
                              onClick={() => handleRetryJob(j.id)}
                              className="px-2.5 py-1 bg-red-600 text-white rounded font-bold hover:bg-red-700 transition"
                            >
                              Retry Job
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: UPLOAD FORM */}
          {activeTab === "upload" && (
            <div className="bg-white dark:bg-[#0F172A] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-2xl">
              <h2 className="text-lg font-bold mb-4">Ingest New Institutional Knowledge</h2>
              {message && <div className="p-3 mb-4 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs">{message}</div>}
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Document Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Horizon Student Refund Policy 2026"
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm focus:outline-none focus:border-[#DC2626]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm focus:outline-none focus:border-[#DC2626]"
                  >
                    <option value="POLICY">Institution Policy & Rules</option>
                    <option value="HANDBOOK">Student Handbook</option>
                    <option value="LESSON_PDF">Lesson PDF</option>
                    <option value="LESSON_DOCX">Lesson DOCX</option>
                    <option value="PPT">PowerPoint Presentation</option>
                    <option value="TEACHER_NOTE">Teacher Notes</option>
                    <option value="REGULATION">Academic Regulations</option>
                    <option value="FAQ">Frequently Asked Questions</option>
                    <option value="BLOG">Institutional Blog</option>
                    <option value="MEMO">Memorandum</option>
                    <option value="ANNOUNCEMENT">Public Announcement</option>
                    <option value="FORM">Institutional Form</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Text Content / Notes</label>
                  <textarea
                    rows={6}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Paste policy text or lesson summary..."
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm focus:outline-none focus:border-[#DC2626]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Attach Source File (Optional PDF/Word/PowerPoint)</label>
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full py-3 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white font-extrabold text-sm shadow-lg transition flex justify-center items-center gap-2"
                >
                  {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                  Submit & Index Document
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}
