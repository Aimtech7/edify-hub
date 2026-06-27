import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Download,
  Eye,
  Upload,
  Search,
  Filter,
  FileText,
  FileSpreadsheet,
  FileArchive,
  FileAudio,
  FileVideo,
  Link as LinkIcon,
  Loader2,
  Plus,
  Tag,
  CheckCircle2,
} from "lucide-react";

interface Document {
  id: number;
  title: string;
  description: string;
  category: string;
  file_type: string;
  file_size: number;
  url: string;
  tags: string[];
  course: string;
  lesson: string;
  level: string;
  uploaded_by: string;
  visibility: string;
  version: number;
  download_count: number;
  view_count: number;
  created_at: string;
}

export default function LessonResourcesPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("ALL");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [level, setLevel] = useState("A1");
  const [course, setCourse] = useState("German Intensive");
  const [tags, setTags] = useState("grammar, goethe");
  const [file, setFile] = useState<File | null>(null);
  const [extLink, setExtLink] = useState("");

  const levels = ["ALL", "A1", "A2", "B1", "B2", "C1", "C2"];

  const fetchResources = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("http://localhost:8000/api/dms/documents/?category=lesson-resources", {
        headers: { Authorization: `Token ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents || []);
      }
    } catch (err) {
      console.error("Failed to fetch resources:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file && !extLink) {
      alert("Please provide a file or external download link.");
      return;
    }
    setUploadLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const formData = new FormData();
      formData.append("category", "lesson-resources");
      formData.append("title", title);
      formData.append("description", desc);
      formData.append("level", level);
      formData.append("course", course);
      formData.append("tags", tags);
      formData.append("visibility", "PUBLIC");
      if (file) formData.append("file", file);
      if (extLink) formData.append("external_link", extLink);

      const res = await fetch("http://localhost:8000/api/dms/documents/", {
        method: "POST",
        headers: { Authorization: `Token ${token}` },
        body: formData,
      });

      if (res.ok) {
        alert("Lesson resource uploaded and indexed by AI successfully!");
        setShowUploadModal(false);
        setTitle("");
        setDesc("");
        setFile(null);
        setExtLink("");
        await fetchResources();
      } else {
        const err = await res.json();
        alert(`Upload error: ${err.error || JSON.stringify(err)}`);
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const token = localStorage.getItem("token") || "";
      await fetch(`http://localhost:8000/api/dms/documents/${doc.id}/download/`, {
        method: "POST",
        headers: { Authorization: `Token ${token}` },
      });
      window.open(doc.url, "_blank");
      setDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, download_count: d.download_count + 1 } : d))
      );
    } catch (err) {
      window.open(doc.url, "_blank");
    }
  };

  const getFileIcon = (type: string) => {
    switch (type.toUpperCase()) {
      case "PDF":
        return <FileText className="w-8 h-8 text-red-400" />;
      case "AUDIO":
        return <FileAudio className="w-8 h-8 text-amber-400" />;
      case "VIDEO":
        return <FileVideo className="w-8 h-8 text-purple-400" />;
      case "ZIP":
        return <FileArchive className="w-8 h-8 text-emerald-400" />;
      default:
        return <LinkIcon className="w-8 h-8 text-blue-400" />;
    }
  };

  const filteredDocs = documents.filter((d) => {
    const matchesLevel = levelFilter === "ALL" || d.level.toUpperCase() === levelFilter;
    const matchesSearch =
      `${d.title} ${d.description} ${d.tags.join(" ")}`.toLowerCase().includes(search.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fadeIn">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-red-950 p-6 rounded-2xl border border-slate-700/80 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm tracking-wider uppercase mb-1">
            <BookOpen className="w-4 h-4" /> Horizon Academic Repository
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Lesson Resources & ODEL Assets
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Access CEFR A1–C2 grammar guides, audio recordings, pronunciation practice cards, and official Goethe examination prep materials powered by Supabase S3.
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-600/30 flex items-center gap-2 transition-all self-start md:self-auto"
        >
          <Upload className="w-4 h-4" /> Publish Resource
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {levels.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                levelFilter === lvl
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {lvl === "ALL" ? "All Levels" : `Level ${lvl}`}
            </button>
          ))}
        </div>
        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search resources, grammar tags, keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-red-500"
          />
        </div>
      </div>

      {/* Document Grid */}
      {loading ? (
        <div className="p-16 text-center flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
          <span className="text-slate-400 text-sm">Retrieving lesson repository from Supabase S3...</span>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="p-16 text-center space-y-2 bg-slate-900/40 rounded-2xl border border-slate-800">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-white font-semibold text-lg">No lesson resources found</h3>
          <p className="text-slate-400 text-sm">Try choosing another CEFR level tab or adjusting your search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 flex flex-col justify-between hover:border-slate-700 transition-all shadow-md hover:shadow-xl group"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 group-hover:scale-105 transition-transform">
                    {getFileIcon(doc.file_type)}
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {doc.level || "General"}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-4 group-hover:text-red-400 transition-colors line-clamp-1">
                  {doc.title}
                </h3>
                <p className="text-slate-400 text-xs mt-1 line-clamp-2 min-h-[32px]">
                  {doc.description || "No description provided."}
                </p>

                {doc.tags && doc.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {doc.tags.map((t, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                        <Tag className="w-2.5 h-2.5 text-red-400" /> {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-800/80 pt-4 mt-5 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><Download className="w-3.5 h-3.5 text-slate-500" /> {doc.download_count}</span>
                  <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5 text-slate-500" /> {doc.view_count}</span>
                </div>
                <button
                  onClick={() => handleDownload(doc)}
                  className="px-3.5 py-2 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white font-semibold transition-all flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-red-500" /> Upload Lesson Resource
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Resource Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. B1 Speaking Practice Guide"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-red-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">CEFR Level</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-red-500"
                  >
                    {levels.filter((l) => l !== "ALL").map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Course Name</label>
                  <input
                    type="text"
                    value={course}
                    onChange={(e) => setCourse(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Summary of contents for AI Knowledge Indexing..."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Search Tags (comma separated)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-red-500"
                />
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-dashed border-slate-700 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">File Upload (PDF, Audio, Video)</label>
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-red-600/20 file:text-red-300 hover:file:bg-red-600/30"
                  />
                </div>
                <div className="text-center text-xs text-slate-500">— OR —</div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">External Supabase S3 URL</label>
                  <input
                    type="url"
                    placeholder="https://...supabase.co/storage/v1/object/..."
                    value={extLink}
                    onChange={(e) => setExtLink(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadLoading}
                  className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 flex items-center gap-1.5"
                >
                  {uploadLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Upload & Index"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
