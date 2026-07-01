import React, { useState, useEffect } from "react";
import {
  BookOpen,
  FileText,
  Search,
  Download,
  Eye,
  ShieldCheck,
  HelpCircle,
  FileSpreadsheet,
  Layers,
  Loader2,
  Tag,
  ExternalLink,
} from "lucide-react";
import { API_BASE_URL, TOKEN_KEYS } from "@/services/api-client";

interface Document {
  id: number;
  title: string;
  description: string;
  category: string;
  file_type: string;
  file_size: number;
  url: string;
  tags: string[];
  level: string;
  uploaded_by: string;
  visibility: string;
  version?: number;
  download_count: number;
  view_count: number;
  created_at: string;
}

export default function KnowledgeBasePage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");

  const tabs = [
    { id: "all", label: "All Documents", icon: Layers },
    { id: "knowledge-base", label: "Student Handbooks & FAQs", icon: HelpCircle },
    { id: "institution-policies", label: "Institutional Policies", icon: ShieldCheck },
  ];

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem(TOKEN_KEYS.ACCESS) || localStorage.getItem("access_token") || localStorage.getItem("token") || "";
      const url = activeTab === "all"
        ? `${API_BASE_URL}/dms/documents/`
        : `${API_BASE_URL}/dms/documents/?category=${activeTab}`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        // Filter out lesson resources if showing all in KB
        const list = (data.documents || []).filter((d: Document) => d.category !== "lesson-resources");
        setDocuments(list);
      }
    } catch (err) {
      console.error("Failed to fetch knowledge base:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [activeTab]);

  const handleDownload = async (doc: Document) => {
    try {
      const token = localStorage.getItem(TOKEN_KEYS.ACCESS) || localStorage.getItem("access_token") || localStorage.getItem("token") || "";
      await fetch(`${API_BASE_URL}/dms/documents/${doc.id}/download/`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      window.open(doc.url, "_blank");
      setDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, download_count: d.download_count + 1 } : d))
      );
    } catch (err) {
      window.open(doc.url, "_blank");
    }
  };

  const filteredDocs = documents.filter((d) =>
    `${d.title} ${d.description} ${d.tags.join(" ")}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-red-950 p-6 rounded-2xl border border-slate-700/80 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-red-400 font-semibold text-sm tracking-wider uppercase mb-1">
            <ShieldCheck className="w-4 h-4" /> Official Knowledge & Policy Hub
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Institutional Knowledge Base
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Explore Horizon Deutsch Training Institute code of conduct, tuition refund policies, Ausbildung nursing application guidelines, and campus rules.
          </p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === t.id
                    ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>
        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search policies, handbooks, FAQs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-red-500"
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="p-16 text-center flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
          <span className="text-slate-400 text-sm">Loading institutional knowledge repository...</span>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="p-16 text-center space-y-2 bg-slate-900/40 rounded-2xl border border-slate-800">
          <HelpCircle className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-white font-semibold text-lg">No knowledge articles found</h3>
          <p className="text-slate-400 text-sm">No institutional documents match your search criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-md group"
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      {doc.category.replace("-", " ")}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300">
                    Version {doc.version}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mt-4 group-hover:text-red-400 transition-colors">
                  {doc.title}
                </h3>
                <p className="text-slate-300 text-sm mt-2 leading-relaxed">
                  {doc.description || "Official Horizon administrative document."}
                </p>

                {doc.tags && doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {doc.tags.map((t, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 text-xs bg-slate-950 border border-slate-800 text-slate-400 px-2.5 py-1 rounded-lg">
                        <Tag className="w-3 h-3 text-amber-400" /> {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-800 pt-4 mt-6 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-4">
                  <span>Published: {doc.created_at}</span>
                  <span>Downloads: {doc.download_count}</span>
                </div>
                <button
                  onClick={() => handleDownload(doc)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-red-600 text-white font-semibold transition-all flex items-center gap-2 group-hover:shadow-lg group-hover:shadow-red-600/20"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> View / Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
