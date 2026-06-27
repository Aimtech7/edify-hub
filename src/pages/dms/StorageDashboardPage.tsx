import React, { useState, useEffect } from "react";
import {
  HardDrive,
  Database,
  FileText,
  Download,
  AlertTriangle,
  Activity,
  ShieldCheck,
  RefreshCw,
  Loader2,
  TrendingUp,
  Layers,
  Clock,
  User,
} from "lucide-react";

interface StorageStats {
  total_files: number;
  storage_used_bytes: number;
  categories: Record<string, number>;
  largest_files: { id: number; title: string; size: number; category: string }[];
  most_downloaded: { id: number; title: string; downloads: number; category: string }[];
  pending_ai_indexing: number;
  storage_health: string;
  recent_audit_logs: { id: number; action: string; user: string; details: string; timestamp: string }[];
}

export default function StorageDashboardPage() {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("http://localhost:8000/api/dms/storage/dashboard/", {
        headers: { Authorization: `Token ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch storage stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-red-950 p-6 rounded-2xl border border-slate-700/80 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm tracking-wider uppercase mb-1">
            <HardDrive className="w-4 h-4" /> Supabase S3 Storage Cluster
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Enterprise Document Management System
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Real-time telemetry, storage bucket allocation, AI indexing pipelines, and strict HIPAA/GDPR audit logs across all Horizon modules.
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 flex items-center gap-2 transition-all self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh Telemetry
        </button>
      </div>

      {loading || !stats ? (
        <div className="p-20 text-center flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
          <span className="text-slate-400 text-sm">Aggregating S3 storage telemetry and audit trail...</span>
        </div>
      ) : (
        <>
          {/* Top KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-lg flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Files Stored</span>
                <div className="text-3xl font-extrabold text-white mt-1">{stats.total_files}</div>
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" /> Active objects
                </span>
              </div>
              <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <FileText className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-lg flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Storage Used</span>
                <div className="text-3xl font-extrabold text-amber-400 mt-1">{formatBytes(stats.storage_used_bytes)}</div>
                <span className="text-xs text-slate-400 font-medium mt-1 block">Supabase S3 Compatible</span>
              </div>
              <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Database className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-lg flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">AI Knowledge Queue</span>
                <div className="text-3xl font-extrabold text-white mt-1">{stats.pending_ai_indexing}</div>
                <span className="text-xs text-purple-400 font-medium mt-1 block">Vector search embeddings</span>
              </div>
              <div className="p-4 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Activity className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 shadow-lg flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cluster Health</span>
                <div className="text-xl font-bold text-emerald-400 mt-1">Optimal</div>
                <span className="text-xs text-slate-400 font-medium mt-1 block">{stats.storage_health.split('(')[1]?.replace(')', '') || '99.99% Uptime'}</span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Rankings Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Largest Files */}
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-lg space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-amber-400" /> Largest Stored Assets
              </h3>
              <div className="divide-y divide-slate-800/80 text-sm">
                {stats.largest_files.map((file, idx) => (
                  <div key={file.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-medium text-white line-clamp-1">{file.title}</div>
                        <div className="text-xs text-slate-400 capitalize">{file.category.replace("-", " ")}</div>
                      </div>
                    </div>
                    <span className="font-mono font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20 text-xs">
                      {formatBytes(file.size)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Most Downloaded */}
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-lg space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-red-400" /> Most Downloaded Documents
              </h3>
              <div className="divide-y divide-slate-800/80 text-sm">
                {stats.most_downloaded.map((file, idx) => (
                  <div key={file.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-medium text-white line-clamp-1">{file.title}</div>
                        <div className="text-xs text-slate-400 capitalize">{file.category.replace("-", " ")}</div>
                      </div>
                    </div>
                    <span className="font-semibold text-red-400 bg-red-500/10 px-2.5 py-1 rounded border border-red-500/20 text-xs flex items-center gap-1">
                      <Download className="w-3 h-3" /> {file.downloads}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Audit Trail Log */}
          <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" /> Live DMS Security & Access Audit Trail
              </h3>
              <span className="text-xs text-slate-400">Strict compliance log</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">User / Actor</th>
                    <th className="py-3 px-4">Details</th>
                    <th className="py-3 px-4 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {stats.recent_audit_logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded text-xs font-bold bg-slate-800 text-white border border-slate-700">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-300 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" /> {log.user}
                      </td>
                      <td className="py-3 px-4 text-slate-300">{log.details}</td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-slate-400 flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3 text-slate-500" /> {log.timestamp}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
