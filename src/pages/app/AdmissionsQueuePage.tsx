import React, { useState, useEffect } from "react";
import {
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  UserCheck,
  FileText,
  ChevronRight,
  ShieldCheck,
  XCircle,
  BookOpen,
  Mail,
  Phone,
  Calendar,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { API_BASE_URL, TOKEN_KEYS } from "@/services/api-client";

interface Application {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  current_german_level: string;
  preferred_campus: string;
  study_mode: string;
  preferred_intake: string;
  career_pathway: string;
  status: string;
  documents_verified: boolean;
  placement_test_score?: number;
  internal_notes: string;
  created_at: string;
}

export default function AdmissionsQueuePage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [notesInput, setNotesInput] = useState("");

  const stages = [
    "All",
    "New",
    "Under Review",
    "Placement Test Pending",
    "Approved",
    "Rejected",
    "Deferred",
    "Converted to Student",
  ];

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem(TOKEN_KEYS.ACCESS) || localStorage.getItem("access_token") || localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE_URL}/students/admissions/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setApplications(Array.isArray(data) ? data : data.results || []);
      }
    } catch (err) {
      console.error("Failed to fetch admissions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedApp) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem(TOKEN_KEYS.ACCESS) || localStorage.getItem("access_token") || localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE_URL}/students/admissions/${selectedApp.id}/update_status/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: newStatus, notes: notesInput }),
      });
      if (res.ok) {
        await fetchApplications();
        setSelectedApp((prev) => prev ? { ...prev, status: newStatus } : null);
        setNotesInput("");
      }
    } catch (err) {
      console.error("Failed status update:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertToStudent = async () => {
    if (!selectedApp) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem(TOKEN_KEYS.ACCESS) || localStorage.getItem("access_token") || localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE_URL}/students/admissions/${selectedApp.id}/convert_to_student/`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Successfully converted to Student! Admission Number: ${data.admission_number}`);
        await fetchApplications();
        setSelectedApp(null);
      } else {
        const err = await res.json();
        alert(`Error: ${err.detail || JSON.stringify(err)}`);
      }
    } catch (err) {
      console.error("Failed conversion:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredApps = applications.filter((app) => {
    const matchesTab = activeTab === "All" || app.status.toLowerCase() === activeTab.toLowerCase();
    const matchesSearch =
      `${app.first_name} ${app.last_name} ${app.email} ${app.phone}`.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "New":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">New</span>;
      case "Under Review":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">Under Review</span>;
      case "Placement Test Pending":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">Placement Test</span>;
      case "Approved":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Approved</span>;
      case "Rejected":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">Rejected</span>;
      case "Converted to Student":
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-300 border border-green-500/40">Student Enrolled</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/20 text-slate-400 border border-slate-500/30">{status}</span>;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-red-950 p-6 rounded-2xl border border-slate-700/80 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-red-400 font-semibold text-sm tracking-wider uppercase mb-1">
            <Users className="w-4 h-4" /> Admissions Management Console
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Admissions Queue & Placement Bridge
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Review online applications, verify documents, assign Goethe CEFR placement testing, and enroll approved candidates into active Horizon student profiles.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-900/80 px-4 py-3 rounded-xl border border-slate-700 text-center">
            <div className="text-xs text-slate-400">Total Applicants</div>
            <div className="text-2xl font-bold text-white">{applications.length}</div>
          </div>
          <div className="bg-red-500/10 px-4 py-3 rounded-xl border border-red-500/30 text-center">
            <div className="text-xs text-red-300">Pending Review</div>
            <div className="text-2xl font-bold text-red-400">
              {applications.filter((a) => ["New", "Under Review"].includes(a.status)).length}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {stages.map((stage) => (
            <button
              key={stage}
              onClick={() => setActiveTab(stage)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === stage
                  ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {stage}
            </button>
          ))}
        </div>
        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search applicants by name, phone or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
          />
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            <span className="text-slate-400 text-sm">Loading applications queue...</span>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <FileText className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-white font-semibold">No applicants found</h3>
            <p className="text-slate-400 text-sm">No admission applications match the selected stage filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Applicant</th>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">CEFR Target / Pathway</th>
                  <th className="py-3.5 px-4">Campus & Mode</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Applied</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4 font-medium text-white">
                      {app.first_name} {app.last_name}
                      <div className="text-xs text-slate-400 font-normal">ID #{app.id}</div>
                    </td>
                    <td className="py-4 px-4 text-slate-300">
                      <div className="flex items-center gap-1.5 text-xs"><Mail className="w-3.5 h-3.5 text-slate-400" /> {app.email}</div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5"><Phone className="w-3.5 h-3.5" /> {app.phone}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="font-semibold text-amber-400">{app.current_german_level || "Beginner (A1)"}</span>
                      <div className="text-xs text-slate-400">{app.career_pathway || "General German"}</div>
                    </td>
                    <td className="py-4 px-4 text-slate-300">
                      <div>{app.preferred_campus || "Main Campus"}</div>
                      <div className="text-xs text-slate-400">{app.study_mode || "Physical"}</div>
                    </td>
                    <td className="py-4 px-4">
                      {getStatusBadge(app.status)}
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-400">
                      {new Date(app.created_at || Date.now()).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => setSelectedApp(app)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold inline-flex items-center gap-1 transition-colors border border-slate-700"
                      >
                        Inspect <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Inspector */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-red-400">Application Inspector</span>
                <h2 className="text-xl font-bold text-white mt-0.5">
                  {selectedApp.first_name} {selectedApp.last_name}
                </h2>
              </div>
              <button onClick={() => setSelectedApp(null)} className="text-slate-400 hover:text-white transition-colors">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-950 p-4 rounded-xl border border-slate-800/80">
              <div>
                <span className="text-xs text-slate-400 block">Email Address</span>
                <span className="text-white font-medium">{selectedApp.email}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Phone Number</span>
                <span className="text-white font-medium">{selectedApp.phone}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Target CEFR Level</span>
                <span className="text-amber-400 font-semibold">{selectedApp.current_german_level || "A1 Beginner"}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Career Pathway</span>
                <span className="text-white font-medium">{selectedApp.career_pathway || "General German"}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Preferred Campus</span>
                <span className="text-white font-medium">{selectedApp.preferred_campus || "Nairobi Main"}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Current Status</span>
                <div className="mt-1">{getStatusBadge(selectedApp.status)}</div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">Internal Remarks / Review Notes</label>
              <textarea
                rows={3}
                placeholder="Enter review findings, placement test recommendations, or interview notes..."
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-red-500"
              />
              {selectedApp.internal_notes && (
                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 text-xs text-slate-300 whitespace-pre-wrap">
                  <span className="font-semibold text-slate-400 block mb-1">Previous Notes:</span>
                  {selectedApp.internal_notes}
                </div>
              )}
            </div>

            {/* Workflow Action Buttons */}
            <div className="border-t border-slate-800 pt-4 space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">Workflow Action Controls</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleUpdateStatus("Under Review")}
                  disabled={actionLoading}
                  className="px-3.5 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-all"
                >
                  Mark Under Review
                </button>
                <button
                  onClick={() => handleUpdateStatus("Placement Test Pending")}
                  disabled={actionLoading}
                  className="px-3.5 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-semibold transition-all"
                >
                  Schedule Placement Test
                </button>
                <button
                  onClick={() => handleUpdateStatus("Approved")}
                  disabled={actionLoading}
                  className="px-3.5 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-all"
                >
                  Approve Application
                </button>
                <button
                  onClick={() => handleUpdateStatus("Rejected")}
                  disabled={actionLoading}
                  className="px-3.5 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 text-xs font-semibold transition-all"
                >
                  Reject Application
                </button>
              </div>

              {selectedApp.status === "Approved" && (
                <div className="bg-gradient-to-r from-emerald-950/60 to-slate-900 p-4 rounded-xl border border-emerald-500/40 flex items-center justify-between mt-4 animate-pulse">
                  <div>
                    <h4 className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" /> Ready for SIS Enrollment
                    </h4>
                    <p className="text-xs text-slate-300">Convert this verified candidate into an active Horizon student profile.</p>
                  </div>
                  <button
                    onClick={handleConvertToStudent}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-all"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enroll Student"} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
